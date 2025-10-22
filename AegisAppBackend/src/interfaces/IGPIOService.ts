/**
 * GPIO Service Interface
 * Raspberry Pi GPIO pin kontrolü için interface
 */
export interface IGPIOService {
  /**
   * Pin'i input veya output olarak ayarla
   */
  setupPin(pin: number, mode: 'input' | 'output'): Promise<void>;

  /**
   * Input pin'den değer oku
   */
  readPin(pin: number): Promise<boolean>;

  /**
   * Output pin'e değer yaz
   */
  writePin(pin: number, value: boolean): Promise<void>;

  /**
   * Analog sensör değeri oku (0-1023 arası)
   */
  readAnalogSensor(pin: number): Promise<number>;

  /**
   * PWM sinyal gönder
   */
  writePWM(pin: number, dutyCycle: number): Promise<void>;

  /**
   * Tüm pin'leri temizle
   */
  cleanup(): Promise<void>;
}

export interface ISensorService {
  /**
   * Sıcaklık sensörü oku
   */
  readTemperature(): Promise<number>;

  /**
   * Nem sensörü oku
   */
  readHumidity(): Promise<number>;

  /**
   * Hava kalitesi sensörü oku
   */
  readAirQuality(): Promise<'excellent' | 'good' | 'moderate' | 'poor' | 'hazardous'>;

  /**
   * Yangın sensörü oku
   */
  readFireSensor(): Promise<boolean>;

  /**
   * Hareket sensörü oku
   */
  readMotionSensor(): Promise<boolean>;

  /**
   * Tüm sensör verilerini oku
   */
  readAllSensors(): Promise<{
    temperature: number;
    humidity: number;
    airQuality: 'excellent' | 'good' | 'moderate' | 'poor' | 'hazardous';
    fireDetected: boolean;
    motionDetected: boolean;
  }>;
}

export interface IDoorService {
  /**
   * Kapı kilidini aç
   */
  unlockDoor(): Promise<void>;

  /**
   * Kapı kilidini kapat
   */
  lockDoor(): Promise<void>;

  /**
   * Kapı kilidi durumunu kontrol et
   */
  isDoorLocked(): Promise<boolean>;

  /**
   * Kapı zilini çal
   */
  ringDoorbell(): Promise<void>;

  /**
   * Kapı zili durumunu kontrol et
   */
  isDoorbellRinging(): Promise<boolean>;
}

export interface IVideoService {
  /**
   * Video stream başlat
   */
  startStream(): Promise<string>;

  /**
   * Video stream durdur
   */
  stopStream(): Promise<void>;

  /**
   * Video kaydı başlat
   */
  startRecording(): Promise<string>;

  /**
   * Video kaydı durdur
   */
  stopRecording(): Promise<void>;

  /**
   * Kayıtlı videoları listele
   */
  getRecordings(): Promise<Array<{
    id: string;
    filename: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    size: number;
  }>>;

  /**
   * Video stream URL'ini al
   */
  getStreamUrl(): Promise<string>;
}
