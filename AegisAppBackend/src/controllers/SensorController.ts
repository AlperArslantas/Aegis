/**
 * Sensor Controller
 * Sensör verileri için HTTP endpoint'leri
 */

import { Request, Response } from 'express';
import { SensorService } from '../services/SensorService';
import { container, SERVICE_IDENTIFIERS } from '../infrastructure/Container';

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
}
