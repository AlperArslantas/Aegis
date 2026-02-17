/**
 * Aegis App Backend - Main Entry Point
 * Akıllı kapı zili ve yangın tespit sistemi backend uygulaması
 */

import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Environment variables
dotenv.config();

// Controllers
import { SensorController } from './controllers/SensorController';
import { DoorController } from './controllers/DoorController';
import { getOlaylar } from './config/db';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Utils
import { logger } from './utils/logger';
import { setSocketInstance } from './utils/socketInstance';

/**
 * PCM verisini WAV formatına çevir
 * @param base64PCM Base64 encoded PCM verisi
 * @param sampleRate Örnekleme hızı (default: 44100)
 * @param channels Kanal sayısı (default: 1 - Mono)
 * @param bitsPerSample Bit derinliği (default: 16)
 * @returns Base64 encoded WAV verisi
 */
function convertPCMToWAV(
  base64PCM: string,
  sampleRate: number = 44100,
  channels: number = 1,
  bitsPerSample: number = 16
): string {
  try {
    // Base64'ü Buffer'a çevir
    const pcmData = Buffer.from(base64PCM, 'base64');
    const dataLength = pcmData.length;
    const fileSize = 36 + dataLength;

    // WAV header oluştur
    const header = Buffer.alloc(44);
    
    // RIFF header
    header.write('RIFF', 0);
    header.writeUInt32LE(fileSize, 4);
    header.write('WAVE', 8);
    
    // fmt chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // fmt chunk size
    header.writeUInt16LE(1, 20); // audio format (PCM)
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28); // byte rate
    header.writeUInt16LE(channels * (bitsPerSample / 8), 32); // block align
    header.writeUInt16LE(bitsPerSample, 34);
    
    // data chunk
    header.write('data', 36);
    header.writeUInt32LE(dataLength, 40);

    // WAV dosyasını oluştur (header + PCM data)
    const wavBuffer = Buffer.concat([header, pcmData]);
    
    // Base64'e çevir
    return wavBuffer.toString('base64');
  } catch (error) {
    logger.error(`PCM to WAV dönüşüm hatası: ${error}`);
    throw error;
  }
}

// Swagger
import { setupSwagger } from './config/swagger';

class AegisApp {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST']
      }
    });

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeSocketIO();
    this.initializeErrorHandling();
    
    // Socket.IO instance'ını global olarak set et
    setSocketInstance(this.io);
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));

    // Compression
    this.app.use(compression());

    // Request logging
    this.app.use(morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) }
    }));

    // Custom request logger
    this.app.use(requestLogger);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files
    this.app.use('/uploads', express.static('uploads'));
    this.app.use('/recordings', express.static('recordings'));
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /health:
     *   get:
     *     summary: Sistem sağlık kontrolü
     *     description: Backend servisinin çalışma durumunu kontrol eder
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Sistem sağlıklı
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: "OK"
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     *                   example: "2025-10-22T14:41:54.945Z"
     *                 uptime:
     *                   type: number
     *                   description: "Sistem çalışma süresi (saniye)"
     *                   example: 123.456
     *                 environment:
     *                   type: string
     *                   example: "development"
     */
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // API routes
    this.app.use('/api', this.createApiRoutes());
  }

  private initializeSwagger(): void {
    setupSwagger(this.app);
  }

  private createApiRoutes(): express.Router {
    const router = express.Router();
    
    // Initialize controllers
    const sensorController = new SensorController();
    const doorController = new DoorController();

    // Sensor routes
    router.get('/sensors/current', (req, res) => sensorController.getCurrentSensorData(req, res));
    router.post('/sensors/update', async (req, res) => {
      // Response'u intercept etmek için wrapper
      const originalJson = res.json.bind(res);
      let responseData: any = null;
      
      res.json = function(data: any) {
        responseData = data;
        return originalJson(data);
      };

      await sensorController.updateSensorData(req, res);
      
      // Socket.IO ile gerçek zamanlı güncellemeleri broadcast et
      if (responseData && responseData.success && responseData.data) {
        this.io.to('sensors').emit('sensor-update', responseData.data);
      }
    });
    router.post('/sensors/read', (req, res) => sensorController.readSensorData(req, res));
    router.get('/sensors/history', (req, res) => sensorController.getSensorHistory(req, res));
    router.get('/sensors/yangin-tespitleri', (req, res) => sensorController.getYanginTespitleri(req, res));
    router.get('/sensors/acil-durumlar', (req, res) => sensorController.getAcilDurumlar(req, res));
    router.get('/sensors/olaylar', (req, res) => {
      // Birleşik olaylar endpoint'i
      const limit = parseInt(req.query.limit as string) || 100;
      const tip = req.query.tip as string | undefined;
      const sadeceYangin = req.query.sadece_yangin === 'true';
      getOlaylar(limit, tip, sadeceYangin).then(olaylar => {
        res.json({
          success: true,
          data: olaylar,
          count: olaylar.length
        });
      }).catch(error => {
        res.status(500).json({
          success: false,
          error: error.message
        });
      });
    });
    router.post('/sensors/calibrate', (req, res) => sensorController.calibrateSensors(req, res));
    router.get('/sensors/health', (req, res) => sensorController.checkSensorHealth(req, res));

    // Door routes
    router.get('/door/status', (req, res) => doorController.getDoorStatus(req, res));
    router.post('/door/unlock', (req, res) => doorController.unlockDoor(req, res));
    router.post('/door/lock', (req, res) => doorController.lockDoor(req, res));
    router.post('/door/ring', (req, res) => doorController.ringDoorbell(req, res));
    router.get('/door/calls', (req, res) => doorController.getUnansweredCalls(req, res));
    router.post('/door/calls/:id/answer', (req, res) => doorController.answerCall(req, res));
    router.get('/door/events', (req, res) => doorController.getDoorEvents(req, res));
    router.get('/door/security', (req, res) => doorController.checkDoorSecurity(req, res));

    return router;
  }

  private initializeSocketIO(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Sensör verilerini dinle
      socket.on('subscribe-sensors', () => {
        socket.join('sensors');
        logger.info(`Client ${socket.id} subscribed to sensor updates`);
      });

      // Kapı olaylarını dinle
      socket.on('subscribe-door', () => {
        socket.join('door');
        logger.info(`Client ${socket.id} subscribed to door updates`);
      });

      // Raspberry Pi bu odaya katılacak
      socket.on('pi-baglandi', () => {
        socket.join('pi-cihazlari');
        logger.info(`Raspberry Pi odaya katıldı: ${socket.id}`);
      });

      // Mobil Uygulama bu odaya katılacak
      socket.on('mobil-baglandi', () => {
        socket.join('mobil-uygulamalar');
        logger.info(`Mobil Uygulama bağlandı: ${socket.id}`);
      });

      // --- SES İLETİMİ ---
      // Telefondan gelen ses verisini alıp Pi'ye gönderiyoruz
      socket.on('ses-gonder', (sesVerisi) => {
        // 'pi-cihazlari' odasındaki herkese (yani senin Pi'ye) gönder
        // broadcast kullanmıyoruz çünkü gönderen mobil, alan Pi.
        this.io.to('pi-cihazlari').emit('ses-al', sesVerisi);
        logger.info(`Ses verisi Pi'ye gönderildi. Gönderen: ${socket.id}, Veri boyutu: ${JSON.stringify(sesVerisi).length} bytes`);
      });

      // --- ÇİFT YÖNLÜ SES SİSTEMİ (İNTERKOM) ---
      // Mobil uygulamadan gelen 'misafir-konussun' eventini Pi'ye 'mikrofon-ac-kapa' olarak ilet
      socket.on('misafir-konussun', (aktif: boolean) => {
        logger.info(`Mobil uygulama mikrofon kontrolü: ${aktif ? 'Açık' : 'Kapalı'}, Gönderen: ${socket.id}`);
        // Pi'ye mikrofon aç/kapa komutu gönder
        this.io.to('pi-cihazlari').emit('mikrofon-ac-kapa', aktif);
      });

      // Pi'den gelen ses verisini mobil uygulamaya ilet
      socket.on('pi-ses-verisi', (sesVerisi: string) => {
        const dataSize = typeof sesVerisi === 'string' ? sesVerisi.length : JSON.stringify(sesVerisi).length;
        logger.info(`Pi'den PCM ses verisi alındı. Gönderen: ${socket.id}, Veri boyutu: ${dataSize} bytes`);
        
        // Pi'nin hangi odada olduğunu kontrol et
        const isPiInRoom = Array.from(socket.rooms).includes('pi-cihazlari');
        if (!isPiInRoom) {
          logger.warn(`Pi ses verisi gönderdi ama 'pi-cihazlari' odasında değil. Socket ID: ${socket.id}`);
        }
        
        try {
          // PCM'yi WAV formatına çevir
          // Pi'den gelen format: 44100Hz, Mono, 16-bit PCM
          const wavBase64 = convertPCMToWAV(sesVerisi, 44100, 1, 16);
          const wavSize = wavBase64.length;
          logger.info(`PCM → WAV dönüşümü tamamlandı. WAV boyutu: ${wavSize} bytes (${Math.round(wavSize / 1024)} KB)`);
          
          // Mobil uygulamalara WAV formatında gönder
          const mobilCount = this.io.sockets.adapter.rooms.get('mobil-uygulamalar')?.size || 0;
          logger.info(`Mobil uygulamalara WAV gönderiliyor. Aktif mobil uygulama sayısı: ${mobilCount}`);
          
          // WAV verisini { audio: base64, type: 'wav' } formatında gönder
          this.io.to('mobil-uygulamalar').emit('pi-den-ses-geliyor', {
            audio: wavBase64,
            type: 'wav',
            sampleRate: 44100,
            channels: 1
          });
        } catch (error: any) {
          logger.error(`PCM to WAV dönüşüm hatası: ${error.message}`);
          // Hata durumunda orijinal PCM'yi gönder (fallback)
          logger.warn('Fallback: Orijinal PCM formatında gönderiliyor');
          this.io.to('mobil-uygulamalar').emit('pi-den-ses-geliyor', sesVerisi);
        }
      });

      // Bağlantı kesildiğinde
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    // Sensör verilerini periyodik olarak gönder
    this.startSensorBroadcast();
  }

  private startSensorBroadcast(): void {
    // Mock broadcast kaldırıldı - Artık Raspberry Pi'den gerçek veriler geliyor
    // Socket.IO ile gerçek veri güncellemeleri updateSensorData endpoint'inde yapılacak
    logger.info('Sensor broadcast: Waiting for real sensor data from Raspberry Pi');
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
      });
    });

    // Global error handler
    this.app.use(errorHandler);
  }

  public start(): void {
    this.server.listen(this.port, () => {
      logger.info(`🚀 Aegis App Backend started on port ${this.port}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔧 GPIO Mode: ${process.env.GPIO_MODE || 'mock'}`);
      logger.info(`📱 CORS Origins: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the application
const app = new AegisApp();
app.start();

export default app;
