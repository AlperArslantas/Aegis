/**
 * Sensor Service
 * Sensör verilerini yöneten business logic katmanı
 */

import { ISensorService } from '../interfaces/IGPIOService';
import { ISensorDataRepository, SensorData, SensorType } from '../interfaces/IRepository';
import { IUnitOfWork } from '../interfaces/IUnitOfWork';

export class SensorService {
  constructor(
    private sensorService: ISensorService,
    private unitOfWorkFactory: any
  ) {}

    /**
   * Raspberry Pi'den gelen gerçek sensör verilerini kaydet
   */
  async saveSensorDataFromPi(data: {
    sicaklik: number;
    gaz: number;
    hareket: boolean;
    kapiAcik?: boolean;
  }): Promise<SensorData> {
    const unitOfWork = await this.unitOfWorkFactory.create();
    try {
      await unitOfWork.beginTransaction();

      // Gaz değerine göre hava kalitesi belirle
      let airQuality: 'excellent' | 'good' | 'moderate' | 'poor' | 'hazardous' = 'good';
      if (data.gaz < 100) airQuality = 'excellent';
      else if (data.gaz < 300) airQuality = 'good';
      else if (data.gaz < 500) airQuality = 'moderate';
      else if (data.gaz < 1000) airQuality = 'poor';
      else airQuality = 'hazardous';

      // Gaz değerine göre yangın tespiti (gaz > 800 ise yangın şüphesi)
      const fireDetected = data.gaz > 800;

      // Sensör verisini oluştur
      const sensorData: Omit<SensorData, 'id'> = {
        temperature: data.sicaklik,
        humidity: 0, // Nem sensörü yoksa 0
        airQuality: airQuality,
        fireDetected: fireDetected,
        motionDetected: data.hareket,
        timestamp: new Date(),
        sensorType: 'temperature'
      };

      // Veritabanına kaydet
      const savedData = await unitOfWork.sensorDataRepository.create(sensorData);

      await unitOfWork.commit();

      // Yangın tespit edildiyse alarm tetikle
      if (fireDetected) {
        await this.triggerFireAlarm(savedData);
      }

      // Hareket tespit edildiyse bildirim gönder
      if (data.hareket) {
        await this.triggerMotionAlert(savedData);
      }

      return savedData;
    } catch (error) {
      await unitOfWork.rollback();
      throw error;
    }
  }

  /**
   * Güncel sensör verilerini oku ve kaydet
   */
  async readAndSaveSensorData(): Promise<SensorData> {
    const unitOfWork = await this.unitOfWorkFactory.create();
    try {
      await unitOfWork.beginTransaction();

      // Tüm sensörleri oku
      const sensorReadings = await this.sensorService.readAllSensors();

      // Sensör verisini oluştur
      const sensorData: Omit<SensorData, 'id'> = {
        temperature: sensorReadings.temperature,
        humidity: sensorReadings.humidity,
        airQuality: sensorReadings.airQuality,
        fireDetected: sensorReadings.fireDetected,
        motionDetected: sensorReadings.motionDetected,
        timestamp: new Date(),
        sensorType: 'temperature' // Ana sensör tipi
      };

      // Veritabanına kaydet
      const savedData = await unitOfWork.sensorDataRepository.create(sensorData);

      await unitOfWork.commit();

      // Yangın tespit edildiyse alarm tetikle
      if (sensorReadings.fireDetected) {
        await this.triggerFireAlarm(savedData);
      }

      // Hareket tespit edildiyse bildirim gönder
      if (sensorReadings.motionDetected) {
        await this.triggerMotionAlert(savedData);
      }

      return savedData;
    } catch (error) {
      await unitOfWork.rollback();
      throw error;
    }
  }

  /**
   * Son sensör verilerini getir
   */
  async getLatestSensorData(): Promise<SensorData | null> {
    const unitOfWork = await this.unitOfWorkFactory.create();
    return await unitOfWork.sensorDataRepository.findLatest();
  }

  /**
   * Belirli tarih aralığındaki sensör verilerini getir
   */
  async getSensorDataByDateRange(startDate: Date, endDate: Date): Promise<SensorData[]> {
    const unitOfWork = await this.unitOfWorkFactory.create();
    return await unitOfWork.sensorDataRepository.findByDateRange(startDate, endDate);
  }

  /**
   * Sensör tipine göre verileri getir
   */
  async getSensorDataByType(type: SensorType): Promise<SensorData[]> {
    const unitOfWork = await this.unitOfWorkFactory.create();
    return await unitOfWork.sensorDataRepository.findBySensorType(type);
  }

  /**
   * Yangın alarmı tetikle
   */
  private async triggerFireAlarm(sensorData: SensorData): Promise<void> {
    console.log('🚨 FIRE ALARM TRIGGERED! 🚨');
    console.log(`Temperature: ${sensorData.temperature}°C`);
    console.log(`Timestamp: ${sensorData.timestamp}`);
    
    // TODO: Push notification gönder
    // TODO: Acil durum servislerini bilgilendir
    // TODO: Video kaydı başlat
    // TODO: Kapı kilidini otomatik aç (kaçış için)
  }

  /**
   * Hareket alarmı tetikle
   */
  private async triggerMotionAlert(sensorData: SensorData): Promise<void> {
    console.log('👤 MOTION DETECTED! 👤');
    console.log(`Timestamp: ${sensorData.timestamp}`);
    
    // TODO: Push notification gönder
    // TODO: Video kaydı başlat
    // TODO: Kapı zilini çal
  }

  /**
   * Sensör kalibrasyonu
   */
  async calibrateSensors(): Promise<void> {
    console.log('🔧 Calibrating sensors...');
    
    // Mock kalibrasyon işlemi
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Sensors calibrated successfully');
  }

  /**
   * Sensör durumunu kontrol et
   */
  async checkSensorHealth(): Promise<{
    temperature: boolean;
    humidity: boolean;
    airQuality: boolean;
    fire: boolean;
    motion: boolean;
  }> {
    try {
      // Tüm sensörleri test et
      await this.sensorService.readAllSensors();
      
      return {
        temperature: true,
        humidity: true,
        airQuality: true,
        fire: true,
        motion: true
      };
    } catch (error) {
      console.error('Sensor health check failed:', error);
      return {
        temperature: false,
        humidity: false,
        airQuality: false,
        fire: false,
        motion: false
      };
    }
  }
}
