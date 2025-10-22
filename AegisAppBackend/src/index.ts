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

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Utils
import { logger } from './utils/logger';

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
    router.post('/sensors/read', (req, res) => sensorController.readSensorData(req, res));
    router.get('/sensors/history', (req, res) => sensorController.getSensorHistory(req, res));
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

      // Bağlantı kesildiğinde
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    // Sensör verilerini periyodik olarak gönder
    this.startSensorBroadcast();
  }

  private startSensorBroadcast(): void {
    setInterval(async () => {
      try {
        const sensorController = new SensorController();
        const mockReq = {} as any;
        const mockRes = {
          json: (data: any) => {
            if (data.success) {
              this.io.to('sensors').emit('sensor-update', data.data);
            }
          }
        } as any;
        
        await sensorController.getCurrentSensorData(mockReq, mockRes);
      } catch (error) {
        logger.error('Error broadcasting sensor data:', error);
      }
    }, 5000); // 5 saniyede bir
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
