/**
 * AegisApp - API Servis Modülü
 * Backend ile iletişim için tüm API istekleri
 */

import { SensorData, AirQualityStatus } from '../types';

// Backend URL - Mac IP adresi (aynı ağda olmalı)
// Development için localhost, production için gerçek IP
const API_BASE_URL = 'http://172.20.10.3:3000';

// API Response tipleri
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface BackendSensorData {
  id: string;
  temperature: number;
  humidity: number;
  airQuality: AirQualityStatus;
  fireDetected: boolean;
  motionDetected: boolean;
  timestamp: string;
}

export interface DoorStatus {
  isLocked: boolean;
  isRinging: boolean;
}

export interface DoorEvent {
  id: string;
  type: 'unlock' | 'lock' | 'ring' | 'motion' | 'call';
  timestamp: string;
  userId?: string;
  description?: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

// Timeout süresi (ms)
const REQUEST_TIMEOUT = 10000;

// Fetch with timeout helper
const fetchWithTimeout = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('İstek zaman aşımına uğradı');
    }
    throw error;
  }
};

/**
 * API Servisi
 */
export const apiService = {
  /**
   * Backend sağlık kontrolü
   */
  checkHealth: async (): Promise<HealthStatus | null> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/health`);
      if (!response.ok) {
        console.error('Health check failed:', response.status);
        return null;
      }
      return await response.json();
    } catch (error: any) {
      // Network hatası için daha açıklayıcı log
      if (error.message?.includes('Network request failed') || error.name === 'TypeError') {
        console.error('Health check error: Backend sunucusuna bağlanılamadı.');
        console.error('Backend URL:', API_BASE_URL);
        console.error('Lütfen kontrol edin:');
        console.error('  1. Backend sunucusu çalışıyor mu? (npm run dev veya npm start)');
        console.error('  2. IP adresi doğru mu? Şu an:', API_BASE_URL);
        console.error('  3. Aynı WiFi ağında mısınız?');
        console.error('  4. Firewall backend portunu engelliyor mu? (Port 3000)');
      } else {
        console.error('Health check error:', error);
      }
      return null;
    }
  },

  /**
   * Güncel sensör verilerini getir
   */
  getSensorData: async (): Promise<SensorData | null> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/sensors/current`);
      
      if (!response.ok) {
        // 404 = henüz veri yok, diğerleri hata
        if (response.status === 404) {
          console.log('No sensor data available yet');
          return null;
        }
        console.error('Get sensor data failed:', response.status);
        return null;
      }

      const result: ApiResponse<BackendSensorData> = await response.json();
      
      if (result.success && result.data) {
        // Backend verisini mobil app formatına dönüştür
        return {
          temperature: result.data.temperature,
          humidity: result.data.humidity,
          airQuality: result.data.airQuality,
          fireDetected: result.data.fireDetected,
          motionDetected: result.data.motionDetected,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Get sensor data error:', error);
      return null;
    }
  },

  /**
   * Kapı durumunu getir
   */
  getDoorStatus: async (): Promise<DoorStatus | null> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/door/status`);
      
      if (!response.ok) {
        console.error('Get door status failed:', response.status);
        return null;
      }

      const result: ApiResponse<DoorStatus> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      
      return null;
    } catch (error: any) {
      // Network hatası için daha açıklayıcı log
      if (error.message?.includes('Network request failed') || error.name === 'TypeError') {
        console.error('Get door status error: Backend sunucusuna bağlanılamadı. URL:', API_BASE_URL);
        console.error('Lütfen kontrol edin: Backend çalışıyor mu? IP adresi doğru mu?');
      } else {
        console.error('Get door status error:', error);
      }
      return null;
    }
  },

  /**
   * Kapıyı aç
   */
  unlockDoor: async (userId?: string): Promise<boolean> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/door/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        console.error('Unlock door failed:', response.status);
        return false;
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Unlock door error:', error);
      return false;
    }
  },

  /**
   * Kapıyı kilitle
   */
  lockDoor: async (userId?: string): Promise<boolean> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/door/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        console.error('Lock door failed:', response.status);
        return false;
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Lock door error:', error);
      return false;
    }
  },

  /**
   * Kapı zilini çal
   */
  ringDoorbell: async (): Promise<boolean> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/door/ring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Ring doorbell failed:', response.status);
        return false;
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Ring doorbell error:', error);
      return false;
    }
  },

  /**
   * Cevaplanmamış kapı çağrılarını getir
   */
  getUnansweredCalls: async (): Promise<DoorEvent[]> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/door/calls`);
      
      if (!response.ok) {
        console.error('Get unanswered calls failed:', response.status);
        return [];
      }

      const result: ApiResponse<DoorEvent[]> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      
      return [];
    } catch (error) {
      console.error('Get unanswered calls error:', error);
      return [];
    }
  },

  /**
   * Kapı olaylarını getir
   */
  getDoorEvents: async (): Promise<DoorEvent[]> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/door/events`);
      
      if (!response.ok) {
        console.error('Get door events failed:', response.status);
        return [];
      }

      const result: ApiResponse<DoorEvent[]> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      
      return [];
    } catch (error) {
      console.error('Get door events error:', error);
      return [];
    }
  },

  /**
   * Güvenlik durumunu kontrol et
   */
  checkSecurity: async (): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/door/security`);
      
      if (!response.ok) {
        console.error('Check security failed:', response.status);
        return null;
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Check security error:', error);
      return null;
    }
  },

  /**
   * Acil durumları getir
   */
  getOlaylar: async (limit: number = 100, tip?: string, sadeceYangin?: boolean): Promise<any[]> => {
    try {
      let url = `${API_BASE_URL}/api/sensors/olaylar?limit=${limit}`;
      if (tip) {
        url += `&tip=${encodeURIComponent(tip)}`;
      }
      if (sadeceYangin) {
        url += `&sadece_yangin=true`;
      }

      const response = await fetchWithTimeout(url);
      
      if (!response.ok) {
        console.error('Get olaylar failed:', response.status);
        return [];
      }

      const result: ApiResponse<any[]> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      return [];
    } catch (error) {
      console.error('Get olaylar error:', error);
      return [];
    }
  },

  getAcilDurumlar: async (limit: number = 100, tip?: string): Promise<any[]> => {
    try {
      let url = `${API_BASE_URL}/api/sensors/acil-durumlar?limit=${limit}`;
      if (tip) {
        url += `&tip=${encodeURIComponent(tip)}`;
      }

      const response = await fetchWithTimeout(url);
      
      if (!response.ok) {
        console.error('Get acil durumlar failed:', response.status);
        return [];
      }

      const result: ApiResponse<any[]> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      
      return [];
    } catch (error: any) {
      console.error('Get acil durumlar error:', error);
      if (error.message?.includes('Network request failed') || error.name === 'TypeError') {
        console.error('Backend sunucusuna bağlanılamadı. URL:', API_BASE_URL);
      }
      return [];
    }
  },

  /**
   * Yangın tespitlerini getir
   */
  getYanginTespitleri: async (limit: number = 100, sadeceYangin: boolean = false): Promise<any[]> => {
    try {
      let url = `${API_BASE_URL}/api/sensors/yangin-tespitleri?limit=${limit}`;
      if (sadeceYangin) {
        url += `&sadece_yangin=true`;
      }

      const response = await fetchWithTimeout(url);
      
      if (!response.ok) {
        console.error('Get yangın tespitleri failed:', response.status);
        return [];
      }

      const result: ApiResponse<any[]> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      
      return [];
    } catch (error: any) {
      console.error('Get yangın tespitleri error:', error);
      if (error.message?.includes('Network request failed') || error.name === 'TypeError') {
        console.error('Backend sunucusuna bağlanılamadı. URL:', API_BASE_URL);
      }
      return [];
    }
  },
};

export default apiService;

