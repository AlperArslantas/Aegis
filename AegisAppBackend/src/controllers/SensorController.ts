/**
 * Sensor Controller
 * Sensör verileri için HTTP endpoint'leri
 */

import { Request, Response } from 'express';
import { SensorService } from '../services/SensorService';
import { container, SERVICE_IDENTIFIERS } from '../infrastructure/Container';
import { insertAcilDurum, getAcilDurumlar, insertYanginTespiti, getYanginTespitleri, insertOlay, getOlaylar } from '../config/db';
import { getSocketInstance } from '../utils/socketInstance';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PythonShell } = require('python-shell');
import fs from 'fs';
import path from 'path';

export class SensorController {
  private sensorService: SensorService;

  constructor() {
    // Dependency injection ile servisleri al
    const sensorService = container.resolve(SERVICE_IDENTIFIERS.SENSOR_SERVICE) as any;
    const unitOfWorkFactory = container.resolve(SERVICE_IDENTIFIERS.UNIT_OF_WORK_FACTORY) as any;
    
    // Her request için yeni UnitOfWork oluştur
    this.sensorService = new SensorService(sensorService, unitOfWorkFactory);
  }

  /**
   * @swagger
   * /api/sensors/current:
   *   get:
   *     summary: Güncel sensör verilerini getir
   *     description: Sistemdeki en son sensör verilerini döndürür
   *     tags: [Sensors]
   *     responses:
   *       200:
   *         description: Başarılı
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/SensorData'
   *       404:
   *         description: Sensör verisi bulunamadı
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Sunucu hatası
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getCurrentSensorData(req: Request, res: Response): Promise<void> {
    try {
      const sensorData = await this.sensorService.getLatestSensorData();
      
      if (!sensorData) {
        res.status(404).json({
          success: false,
          message: 'No sensor data found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: sensorData.id,
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          airQuality: sensorData.airQuality,
          fireDetected: sensorData.fireDetected,
          motionDetected: sensorData.motionDetected,
          timestamp: sensorData.timestamp
        }
      });
    } catch (error: any) {
      console.error('Error getting current sensor data:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * @swagger
   * /api/sensors/update:
   *   post:
   *     summary: Raspberry Pi'den gelen gerçek sensör verilerini kaydet
   *     description: Raspberry Pi'den gönderilen sıcaklık, gaz, hareket ve kapı durumu verilerini kaydeder
   *     tags: [Sensors]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - sicaklik
   *               - gaz
   *               - hareket
   *             properties:
   *               sicaklik:
   *                 type: number
   *                 example: 24.5
   *               gaz:
   *                 type: number
   *                 example: 150
   *               hareket:
   *                 type: boolean
   *                 example: true
   *               kapiAcik:
   *                 type: boolean
   *                 example: false
   *     responses:
   *       200:
   *         description: Veriler başarıyla kaydedildi
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: "ok"
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/SensorData'
   *       400:
   *         description: Geçersiz veri
   *       500:
   *         description: Sunucu hatası
   */
  async updateSensorData(req: Request, res: Response): Promise<void> {
    try {
      const { sicaklik, gaz, hareket, kapiAcik, zil } = req.body;
      let aiResult: { fireDetected: boolean; confidence: number } | null = null;

      // Validasyon
      if (typeof sicaklik !== 'number' || typeof gaz !== 'number' || typeof hareket !== 'boolean') {
        res.status(400).json({
          success: false,
          status: 'error',
          message: 'Invalid data format. Required: sicaklik (number), gaz (number), hareket (boolean)'
        });
        return;
      }

      console.log("Pi'den Veri Geldi:", { sicaklik, gaz, hareket, kapiAcik });

      // Fotoğrafı kaydet (varsa)
      let savedImagePath: string | undefined = undefined;
      const { image } = req.body;
      if (image && typeof image === 'string') {
        try {
          // Base64 string'den görüntü verisini çıkar
          let imageData = image;
          if (image.includes(',')) {
            imageData = image.split(',')[1];
          }

          // Base64'ü Buffer'a çevir
          const imageBuffer = Buffer.from(imageData, 'base64');

          // Kalıcı dosya yolu oluştur (acil durumlar için)
          const permanentDir = path.join(process.cwd(), 'uploads', 'acil-durumlar');
          if (!fs.existsSync(permanentDir)) {
            fs.mkdirSync(permanentDir, { recursive: true });
          }

          const timestamp = Date.now();
          const imageFileName = `acil_durum_${timestamp}.jpg`;
          savedImagePath = path.join(permanentDir, imageFileName);

          // Görüntüyü kalıcı dosyaya kaydet
          fs.writeFileSync(savedImagePath, imageBuffer);
          
          // Veritabanına kaydetmek için göreceli yol kullan
          const relativeImagePath = path.join('uploads', 'acil-durumlar', imageFileName).replace(/\\/g, '/');
          savedImagePath = relativeImagePath;
          
          console.log(`✅ Fotoğraf kalıcı olarak kaydedildi: ${savedImagePath} (Boyut: ${imageBuffer.length} bytes)`);
        } catch (imageError: any) {
          console.error('❌ Fotoğraf kaydedilirken hata:', imageError);
        }

        // Yangın tespiti için görüntü analizi (Pi'nin sonucu beklemesi için await ile bekleniyor)
        console.log('📸 Fotoğraf alındı, analiz başlatılıyor... (Base64 uzunluğu:', image.length, ')');
        aiResult = await this.analyzeImageForFire(image);
        if (aiResult) {
          console.log(`✅ AI analiz sonucu alındı: fireDetected=${aiResult.fireDetected}, confidence=${aiResult.confidence}`);
        } else {
          console.log('⚠️ AI analiz sonucu alınamadı');
        }
      } else {
        console.log('⚠️ Fotoğraf gönderilmedi veya geçersiz format. image:', image ? typeof image : 'undefined');
      }

      // Acil durum kontrolü ve kayıt (olaylar tablosuna)
      // Not: Tip her zaman gerçek durumu yansıtır (YUKSEK_SICAKLIK, GAZ_KACAGI, KAPI_ZILI)
      // Eğer fotoğraf analizi yapıldıysa (aiResult varsa), yangın analizi sonuçları da kaydedilir
      const SICAKLIK_ESIGI = 28;
      if (sicaklik > SICAKLIK_ESIGI) {
        console.log(`🔥 Yüksek sıcaklık tespit edildi: ${sicaklik}°C (Eşik: ${SICAKLIK_ESIGI}°C) - Veritabanına kaydediliyor...`);
        
        const aciklama = aiResult 
          ? `Sıcaklık limiti aşıldı! (${sicaklik}°C > ${SICAKLIK_ESIGI}°C). Yangın analizi: ${aiResult.fireDetected ? 'Yangın tespit edildi' : 'Yangın tespit edilmedi'} (Güven: ${(aiResult.confidence * 100).toFixed(2)}%)`
          : `Sıcaklık limiti aşıldı! (${sicaklik}°C > ${SICAKLIK_ESIGI}°C)`;
        
        insertOlay(
          'YUKSEK_SICAKLIK',
          sicaklik, // deger
          aiResult?.fireDetected, // yangin_tespit_edildi (fotoğraf analizi yapıldıysa)
          aiResult?.confidence, // guven_seviyesi (fotoğraf analizi yapıldıysa)
          aciklama,
          savedImagePath // goruntu_yolu
        ).then(() => {
          console.log(`✅ Yüksek sıcaklık başarıyla kaydedildi: ${sicaklik}°C${aiResult ? ` (Yangın analizi: ${aiResult.fireDetected ? 'VAR' : 'YOK'}, Güven: ${(aiResult.confidence * 100).toFixed(2)}%)` : ''}`);
        }).catch(err => {
          console.error('❌ Yüksek sıcaklık kaydı hatası:', err);
          console.error('Hata detayı:', err.message);
        });
      }

      if (gaz > 0) {
        console.log(`⚠️ Gaz kaçağı tespit edildi: ${gaz} - Veritabanına kaydediliyor...`);
        
        const aciklama = aiResult 
          ? `Gaz kaçağı tespit edildi! Gaz seviyesi: ${gaz}. Yangın analizi: ${aiResult.fireDetected ? 'Yangın tespit edildi' : 'Yangın tespit edilmedi'} (Güven: ${(aiResult.confidence * 100).toFixed(2)}%)`
          : `Gaz kaçağı tespit edildi! Gaz seviyesi: ${gaz}`;
        
        insertOlay(
          'GAZ_KACAGI',
          gaz, // deger
          aiResult?.fireDetected, // yangin_tespit_edildi (fotoğraf analizi yapıldıysa)
          aiResult?.confidence, // guven_seviyesi (fotoğraf analizi yapıldıysa)
          aciklama,
          savedImagePath // goruntu_yolu
        ).then(() => {
          console.log(`✅ Gaz kaçağı başarıyla kaydedildi: ${gaz}${aiResult ? ` (Yangın analizi: ${aiResult.fireDetected ? 'VAR' : 'YOK'}, Güven: ${(aiResult.confidence * 100).toFixed(2)}%)` : ''}`);
        }).catch(err => {
          console.error('❌ Gaz kaçağı kaydı hatası:', err);
          console.error('Hata detayı:', err.message);
        });
      }

      if (hareket) {
        // Hareket tespit edildi - opsiyonel olarak kaydedilebilir
        // Şimdilik sadece logluyoruz, gerekirse aktif edilebilir
        // insertAcilDurum('HAREKET', 1, 'Hareket tespit edildi')
        //   .catch(err => console.error('Hareket kaydı hatası:', err));
      }

      // Kapı zili kontrolü
      if (zil === true) {
        console.log('🔔 Kapı zili çalındı! Mobil uygulamaya bildirim gönderiliyor...');
        
        // Socket.IO ile mobil uygulamaya kapı zili bildirimi gönder
        const io = getSocketInstance();
        if (io) {
          // Odaya katılan socket sayısını kontrol et
          const mobilRoom = io.sockets.adapter.rooms.get('mobil-uygulamalar');
          const mobilCount = mobilRoom ? mobilRoom.size : 0;
          console.log(`📊 'mobil-uygulamalar' odasında ${mobilCount} aktif socket var`);
          
          if (mobilCount > 0) {
            io.to('mobil-uygulamalar').emit('kapi-zili', {
              type: 'KAPI_ZILI',
              message: 'Kapı zili çalıyor!',
              timestamp: new Date().toISOString()
            });
            console.log('✅ Kapı zili bildirimi Socket.IO ile gönderildi (oda: mobil-uygulamalar)');
          } else {
            // Eğer odaya kimse katılmamışsa, tüm bağlı socket'lere gönder (fallback)
            console.warn('⚠️ mobil-uygulamalar odasında kimse yok, tüm bağlı socket\'lere gönderiliyor...');
            io.emit('kapi-zili', {
              type: 'KAPI_ZILI',
              message: 'Kapı zili çalıyor!',
              timestamp: new Date().toISOString()
            });
            console.log('✅ Kapı zili bildirimi tüm socket\'lere gönderildi (fallback)');
          }
        } else {
          console.warn('⚠️ Socket.IO instance bulunamadı, kapı zili bildirimi gönderilemedi');
        }

        // Veritabanına kaydet (opsiyonel)
        insertOlay(
          'KAPI_ZILI',
          undefined, // deger
          undefined, // yangin_tespit_edildi
          undefined, // guven_seviyesi
          'Kapı zili çalındı',
          undefined // goruntu_yolu
        ).then(() => {
          console.log('✅ Kapı zili olayı veritabanına kaydedildi');
        }).catch(err => {
          console.error('❌ Kapı zili kaydı hatası:', err);
        });
      }

      // Veriyi kaydet
      const sensorData = await this.sensorService.saveSensorDataFromPi({
        sicaklik,
        gaz,
        hareket,
        kapiAcik
      });

      // Response oluştur
      // ÖNEMLİ: Pi kodu "aiResult" objesini bekliyor (response.json()["aiResult"])
      const response: any = {
        status: 'ok',
        success: true,
        message: 'Data updated',
        data: {
          id: sensorData.id,
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          airQuality: sensorData.airQuality,
          fireDetected: sensorData.fireDetected,
          motionDetected: sensorData.motionDetected,
          timestamp: sensorData.timestamp
        }
      };

      // AI analiz sonucunu aiResult objesi içinde ekle (Pi kodu bu formatta bekliyor)
      if (aiResult) {
        response.aiResult = {
          fireDetected: aiResult.fireDetected,
          confidence: aiResult.confidence,
          imageProcessed: savedImagePath ? true : false
        };
      } else {
        // Fotoğraf analizi yapılmadıysa false değerlerle döndür
        response.aiResult = {
          fireDetected: false,
          confidence: 0,
          imageProcessed: false
        };
      }

      res.status(200).json(response);
    } catch (error: any) {
      console.error('Error updating sensor data:', error);
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'Failed to update sensor data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * @swagger
   * /api/sensors/read:
   *   post:
   *     summary: Yeni sensör verilerini oku ve kaydet
   *     description: Tüm sensörlerden veri okuyup veritabanına kaydeder
   *     tags: [Sensors]
   *     responses:
   *       200:
   *         description: Başarılı
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/SensorData'
   *       500:
   *         description: Sunucu hatası
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async readSensorData(req: Request, res: Response): Promise<void> {
    try {
      const sensorData = await this.sensorService.readAndSaveSensorData();
      
      res.json({
        success: true,
        data: {
          id: sensorData.id,
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          airQuality: sensorData.airQuality,
          fireDetected: sensorData.fireDetected,
          motionDetected: sensorData.motionDetected,
          timestamp: sensorData.timestamp
        }
      });
    } catch (error: any) {
      console.error('Error reading sensor data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to read sensor data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/sensors/history
   * Sensör verilerini tarih aralığına göre getir
   */
  async getSensorHistory(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, type } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate and endDate are required'
        });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
        return;
      }

      let sensorData;
      if (type) {
        sensorData = await this.sensorService.getSensorDataByType(type as any);
      } else {
        sensorData = await this.sensorService.getSensorDataByDateRange(start, end);
      }

      res.json({
        success: true,
        data: sensorData,
        count: sensorData.length
      });
    } catch (error: any) {
      console.error('Error getting sensor history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get sensor history',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * POST /api/sensors/calibrate
   * Sensörleri kalibre et
   */
  async calibrateSensors(req: Request, res: Response): Promise<void> {
    try {
      await this.sensorService.calibrateSensors();
      
      res.json({
        success: true,
        message: 'Sensors calibrated successfully'
      });
    } catch (error: any) {
      console.error('Error calibrating sensors:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calibrate sensors',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/sensors/health
   * Sensör sağlık durumunu kontrol et
   */
  async checkSensorHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.sensorService.checkSensorHealth();
      
      res.json({
        success: true,
        data: health,
        overall: Object.values(health).every(status => status)
      });
    } catch (error: any) {
      console.error('Error checking sensor health:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check sensor health',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * @swagger
   * /api/sensors/yangin-tespitleri:
   *   get:
   *     summary: Yangın tespiti kayıtlarını getir
   *     description: Yangın tespiti tablosundaki tüm kayıtları getirir
   *     tags: [Sensors]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Maksimum kayıt sayısı
   *       - in: query
   *         name: sadece_yangin
   *         schema:
   *           type: boolean
   *         description: Sadece yangın tespit edilen kayıtları getir
   *     responses:
   *       200:
   *         description: Başarılı
   *       500:
   *         description: Sunucu hatası
   */
  async getYanginTespitleri(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const sadeceYangin = req.query.sadece_yangin === 'true';
      const tespitler = await getYanginTespitleri(limit, sadeceYangin);

      res.json({
        success: true,
        data: tespitler,
        count: tespitler.length
      });
    } catch (error: any) {
      console.error('Error getting yangın tespitleri:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get yangın tespitleri',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * @swagger
   * /api/sensors/acil-durumlar:
   *   get:
   *     summary: Acil durum kayıtlarını getir
   *     description: Tüm acil durum kayıtlarını getirir (Yüksek sıcaklık, gaz kaçağı, yangın vb.)
   *     tags: [Sensors]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Maksimum kayıt sayısı
   *       - in: query
   *         name: tip
   *         schema:
   *           type: string
   *         description: Acil durum tipi (YUKSEK_SICAKLIK, GAZ_KACAGI, YANGIN_TESPITI, GORUNTU_ANALIZI)
   *     responses:
   *       200:
   *         description: Başarılı
   *       500:
   *         description: Sunucu hatası
   */
  async getAcilDurumlar(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const tip = req.query.tip as string | undefined;
      const durumlar = await getAcilDurumlar(limit, tip);

      res.json({
        success: true,
        data: durumlar,
        count: durumlar.length
      });
    } catch (error: any) {
      console.error('Error getting acil durumlar:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get acil durumlar',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Görüntüyü analiz et ve yangın tespiti yap
   * @param base64Image Base64 encoded görüntü
   * @returns Yangın tespit sonucu (fireDetected ve confidence) veya null (hata durumunda)
   */
  private async analyzeImageForFire(base64Image: string): Promise<{ fireDetected: boolean; confidence: number } | null> {
    let tempImagePath: string | null = null;
    let permanentImagePath: string | null = null;

    try {
      // Base64 string'den görüntü verisini çıkar
      // Base64 formatı: "data:image/jpeg;base64,/9j/4AAQSkZJRg..." veya sadece "/9j/4AAQSkZJRg..."
      let imageData = base64Image;
      if (base64Image.includes(',')) {
        imageData = base64Image.split(',')[1];
      }

      // Base64'ü Buffer'a çevir
      const imageBuffer = Buffer.from(imageData, 'base64');

      // Kalıcı dosya yolu oluştur (yangın tespiti için)
      const permanentDir = path.join(process.cwd(), 'uploads', 'yangin-tespiti');
      if (!fs.existsSync(permanentDir)) {
        fs.mkdirSync(permanentDir, { recursive: true });
      }

      const timestamp = Date.now();
      const imageFileName = `yangin_tespiti_${timestamp}.jpg`;
      permanentImagePath = path.join(permanentDir, imageFileName);

      // Görüntüyü kalıcı dosyaya kaydet
      fs.writeFileSync(permanentImagePath, imageBuffer);
      console.log(`✅ Görüntü kalıcı olarak kaydedildi: ${permanentImagePath} (Boyut: ${imageBuffer.length} bytes)`);

      // Geçici dosya yolu oluştur (Python script için)
      const tempDir = path.join(process.cwd(), 'uploads', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      tempImagePath = path.join(tempDir, `fire_check_${timestamp}.jpg`);

      // Görüntüyü geçici dosyaya da kopyala (Python script için)
      fs.writeFileSync(tempImagePath, imageBuffer);
      console.log(`✅ Görüntü geçici dosyaya kopyalandı: ${tempImagePath} (Python script için)`);

      // Python script yolunu belirle
      const scriptPath = path.join(process.cwd(), 'detect_fire.py');
      
      // Script dosyasının varlığını kontrol et
      if (!fs.existsSync(scriptPath)) {
        console.error(`❌ Python scripti bulunamadı: ${scriptPath}`);
        insertOlay(
          'GORUNTU_ANALIZI',
          0,
          undefined,
          undefined,
          `Python scripti bulunamadı: ${scriptPath}`
        ).catch(err => console.error('Hata kaydı hatası:', err));
        return null;
      }

      // Python scriptini çalıştır
      const options = {
        mode: 'text' as const,
        pythonPath: 'python3', // veya 'python'
        pythonOptions: ['-u'], // unbuffered output
        scriptPath: process.cwd(), // PythonShell buraya scriptPath ekleyecek
        args: [tempImagePath]
      };

      console.log(`🐍 Python scripti çalıştırılıyor: ${scriptPath}`);
      console.log(`📁 Çalışma dizini: ${process.cwd()}`);
      console.log(`📷 Analiz edilecek görüntü: ${tempImagePath}`);
      
      const result = await PythonShell.run('detect_fire.py', options);
      
      // Python scripti JSON çıktısı verir
      // Ultralytics mesajları olabilir, sadece JSON satırını bul
      const allLines = result.join('\n').split('\n');
      let resultString = '';
      
      // JSON formatında bir satır bul
      for (const line of allLines) {
        const trimmed = line.trim();
        // JSON formatında olan satırı bul ( { ile başlayıp } ile biten)
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          resultString = trimmed;
          break;
        }
      }
      
      // Eğer JSON bulunamadıysa tüm çıktıyı kullan
      if (!resultString) {
        resultString = allLines.join('\n').trim();
      }
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 PYTHON SCRIPT ÇIKTISI (ham):`);
      console.log(allLines.join('\n'));
      console.log(`\n📋 JSON olarak bulunan: ${resultString}`);
      console.log(`${'='.repeat(60)}\n`);
      
      let fireDetectionResult: { 
        fireDetected?: boolean; 
        confidence?: number; 
        error?: string;
        detectedObjects?: Array<{ class: string; confidence: number }>;
        note?: string;
      };

      try {
        fireDetectionResult = JSON.parse(resultString);
      } catch (parseError) {
        console.error(`\n${'='.repeat(60)}`);
        console.error('❌ Python script çıktısı parse edilemedi!');
        console.error('Tüm çıktı satırları:', allLines);
        console.error('Bulunan JSON string:', resultString);
        console.error('Parse hatası:', parseError);
        console.error(`${'='.repeat(60)}\n`);
        // Hata durumunda da veritabanına kaydet
        insertOlay(
          'GORUNTU_ANALIZI',
          0,
          undefined,
          undefined,
          `Görüntü analizi parse hatası: ${resultString.substring(0, 200)}`
        ).catch(err => console.error('Hata kaydı hatası:', err));
        return null;
      }

      console.log(`\n${'='.repeat(60)}`);
      console.log('🔥 YANGIN TESPİT SONUCU:');
      console.log(JSON.stringify(fireDetectionResult, null, 2));
      
      // Tespit edilen objeleri göster
      if (fireDetectionResult.detectedObjects && fireDetectionResult.detectedObjects.length > 0) {
        console.log('\n📋 Tespit Edilen Objeler:');
        fireDetectionResult.detectedObjects.forEach((obj: any, index: number) => {
          console.log(`  ${index + 1}. ${obj.class}: ${(obj.confidence * 100).toFixed(2)}%`);
        });
      }
      
      if (fireDetectionResult.note) {
        console.log(`\n⚠️ Not: ${fireDetectionResult.note}`);
      }
      
      console.log(`${'='.repeat(60)}\n`);

      const confidence = fireDetectionResult.confidence || 0;
      const fireDetected = fireDetectionResult.fireDetected === true;

      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔥 YANGIN ANALİZ SONUCU (Pi'ye döndürülecek):`);
      console.log(`Yangın Tespit Edildi: ${fireDetected}`);
      console.log(`Güven Seviyesi: ${confidence} (${(confidence * 100).toFixed(2)}%)`);
      console.log(`${'='.repeat(60)}\n`);
      
      // Not: Analiz sonucu döndürülüyor (Pi'ye gönderilecek)
      // Veritabanı kaydı yukarıdaki YUKSEK_SICAKLIK/GAZ_KACAGI kayıtlarında yapılıyor
      // Tip her zaman gerçek durumu yansıtır (YUKSEK_SICAKLIK, GAZ_KACAGI, KAPI_ZILI) - YANGIN_TESPITI değil

      // Eğer yangın tespit edildiyse Socket.IO ile mobil uygulamaya bildirim gönder
      if (fireDetected) {
        const io = getSocketInstance();
        if (io) {
          io.to('mobil-uygulamalar').emit('yangin-alarm', {
            type: 'YANGIN_TESPITI',
            message: 'YANGIN VAR!',
            confidence: confidence,
            timestamp: new Date().toISOString()
          });
          console.log('Yangın alarmı Socket.IO ile gönderildi');
        }
      }

      // Sonucu döndür (Pi'ye gönderilecek)
      return {
        fireDetected,
        confidence
      };

    } catch (error: any) {
      console.error(`\n${'='.repeat(60)}`);
      console.error('❌❌❌ GÖRÜNTÜ ANALİZ İŞLEMİ HATASI:');
      console.error('Hata mesajı:', error.message);
      console.error('Hata stack:', error.stack);
      if (error.script) {
        console.error('Script yolu:', error.script);
      }
      if (error.args) {
        console.error('Argümanlar:', error.args);
      }
      console.error(`${'='.repeat(60)}\n`);
      // Hata durumunda null döndür
      return null;
    } finally {
      // Geçici dosyayı temizle
      if (tempImagePath && fs.existsSync(tempImagePath)) {
        try {
          fs.unlinkSync(tempImagePath);
          console.log(`Geçici dosya silindi: ${tempImagePath}`);
        } catch (unlinkError) {
          console.error('Geçici dosya silinirken hata:', unlinkError);
        }
      }
    }
  }
}
