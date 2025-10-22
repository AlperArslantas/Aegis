/**
 * Mock GPIO Service Implementation
 * Raspberry Pi gelmeden önce test ve development için
 */

import { IGPIOService, ISensorService, IDoorService, IVideoService } from '@/interfaces/IGPIOService';

export class MockGPIOService implements IGPIOService {
  private pins: Map<number, { mode: 'input' | 'output'; value: boolean }> = new Map();
  private analogValues: Map<number, number> = new Map();

  async setupPin(pin: number, mode: 'input' | 'output'): Promise<void> {
    console.log(`[MOCK GPIO] Pin ${pin} setup as ${mode}`);
    this.pins.set(pin, { mode, value: false });
    
    // Mock analog değerleri için rastgele başlangıç değeri
    if (mode === 'input') {
      this.analogValues.set(pin, Math.random() * 1023);
    }
  }

  async readPin(pin: number): Promise<boolean> {
    const pinData = this.pins.get(pin);
    if (!pinData || pinData.mode !== 'input') {
      throw new Error(`Pin ${pin} is not configured as input`);
    }

    // Mock: Rastgele değer döndür
    const value = Math.random() > 0.5;
    pinData.value = value;
    console.log(`[MOCK GPIO] Pin ${pin} read: ${value}`);
    return value;
  }

  async writePin(pin: number, value: boolean): Promise<void> {
    const pinData = this.pins.get(pin);
    if (!pinData || pinData.mode !== 'output') {
      throw new Error(`Pin ${pin} is not configured as output`);
    }

    pinData.value = value;
    console.log(`[MOCK GPIO] Pin ${pin} write: ${value}`);
  }

  async readAnalogSensor(pin: number): Promise<number> {
    // Mock: Rastgele analog değer (0-1023)
    const value = Math.random() * 1023;
    this.analogValues.set(pin, value);
    console.log(`[MOCK GPIO] Analog pin ${pin} read: ${value.toFixed(2)}`);
    return value;
  }

  async writePWM(pin: number, dutyCycle: number): Promise<void> {
    console.log(`[MOCK GPIO] Pin ${pin} PWM: ${dutyCycle}%`);
  }

  async cleanup(): Promise<void> {
    console.log('[MOCK GPIO] Cleanup called');
    this.pins.clear();
    this.analogValues.clear();
  }
}

export class MockSensorService implements ISensorService {
  private baseTemperature = 22;
  private baseHumidity = 45;
  private fireDetected = false;
  private motionDetected = false;

  async readTemperature(): Promise<number> {
    // Mock: 20-30°C arası rastgele sıcaklık
    const temperature = this.baseTemperature + (Math.random() - 0.5) * 10;
    console.log(`[MOCK SENSOR] Temperature: ${temperature.toFixed(1)}°C`);
    return Math.round(temperature * 10) / 10;
  }

  async readHumidity(): Promise<number> {
    // Mock: 30-70% arası rastgele nem
    const humidity = this.baseHumidity + (Math.random() - 0.5) * 40;
    console.log(`[MOCK SENSOR] Humidity: ${humidity.toFixed(1)}%`);
    return Math.round(humidity * 10) / 10;
  }

  async readAirQuality(): Promise<'excellent' | 'good' | 'moderate' | 'poor' | 'hazardous'> {
    const quality = Math.random();
    let result: 'excellent' | 'good' | 'moderate' | 'poor' | 'hazardous';
    
    if (quality < 0.1) result = 'hazardous';
    else if (quality < 0.3) result = 'poor';
    else if (quality < 0.6) result = 'moderate';
    else if (quality < 0.9) result = 'good';
    else result = 'excellent';

    console.log(`[MOCK SENSOR] Air Quality: ${result}`);
    return result;
  }

  async readFireSensor(): Promise<boolean> {
    // Mock: %5 ihtimalle yangın tespit et
    this.fireDetected = Math.random() < 0.05;
    console.log(`[MOCK SENSOR] Fire detected: ${this.fireDetected}`);
    return this.fireDetected;
  }

  async readMotionSensor(): Promise<boolean> {
    // Mock: %20 ihtimalle hareket tespit et
    this.motionDetected = Math.random() < 0.2;
    console.log(`[MOCK SENSOR] Motion detected: ${this.motionDetected}`);
    return this.motionDetected;
  }

  async readAllSensors(): Promise<{
    temperature: number;
    humidity: number;
    airQuality: 'excellent' | 'good' | 'moderate' | 'poor' | 'hazardous';
    fireDetected: boolean;
    motionDetected: boolean;
  }> {
    const [temperature, humidity, airQuality, fireDetected, motionDetected] = await Promise.all([
      this.readTemperature(),
      this.readHumidity(),
      this.readAirQuality(),
      this.readFireSensor(),
      this.readMotionSensor()
    ]);

    return {
      temperature,
      humidity,
      airQuality,
      fireDetected,
      motionDetected
    };
  }
}

export class MockDoorService implements IDoorService {
  private isLocked = true;
  private isRinging = false;

  async unlockDoor(): Promise<void> {
    this.isLocked = false;
    console.log('[MOCK DOOR] Door unlocked');
  }

  async lockDoor(): Promise<void> {
    this.isLocked = true;
    console.log('[MOCK DOOR] Door locked');
  }

  async isDoorLocked(): Promise<boolean> {
    console.log(`[MOCK DOOR] Door locked: ${this.isLocked}`);
    return this.isLocked;
  }

  async ringDoorbell(): Promise<void> {
    this.isRinging = true;
    console.log('[MOCK DOOR] Doorbell ringing');
    
    // 3 saniye sonra otomatik durdur
    setTimeout(() => {
      this.isRinging = false;
      console.log('[MOCK DOOR] Doorbell stopped');
    }, 3000);
  }

  async isDoorbellRinging(): Promise<boolean> {
    console.log(`[MOCK DOOR] Doorbell ringing: ${this.isRinging}`);
    return this.isRinging;
  }
}

export class MockVideoService implements IVideoService {
  private isStreaming = false;
  private isRecording = false;
  private recordings: Array<{
    id: string;
    filename: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    size: number;
  }> = [];

  async startStream(): Promise<string> {
    this.isStreaming = true;
    const streamUrl = 'rtsp://mock-stream:8554/stream';
    console.log(`[MOCK VIDEO] Stream started: ${streamUrl}`);
    return streamUrl;
  }

  async stopStream(): Promise<void> {
    this.isStreaming = false;
    console.log('[MOCK VIDEO] Stream stopped');
  }

  async startRecording(): Promise<string> {
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    this.isRecording = true;
    const recordingId = `rec_${Date.now()}`;
    const filename = `recording_${recordingId}.mp4`;
    
    console.log(`[MOCK VIDEO] Recording started: ${filename}`);
    return recordingId;
  }

  async stopRecording(): Promise<void> {
    if (!this.isRecording) {
      throw new Error('No recording in progress');
    }

    this.isRecording = false;
    const recording = {
      id: `rec_${Date.now()}`,
      filename: `recording_${Date.now()}.mp4`,
      startTime: new Date(Date.now() - 30000), // 30 saniye önce başladı
      endTime: new Date(),
      duration: 30,
      size: Math.floor(Math.random() * 10000000) + 1000000 // 1-10MB arası
    };

    this.recordings.push(recording);
    console.log(`[MOCK VIDEO] Recording stopped: ${recording.filename}`);
  }

  async getRecordings(): Promise<Array<{
    id: string;
    filename: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    size: number;
  }>> {
    console.log(`[MOCK VIDEO] Retrieved ${this.recordings.length} recordings`);
    return [...this.recordings];
  }

  async getStreamUrl(): Promise<string> {
    return 'rtsp://mock-stream:8554/stream';
  }
}
