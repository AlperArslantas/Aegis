/**
 * AegisApp - Mock Veri Servisi
 */

import { SensorData, VideoStream, DoorCall, AirQualityStatus } from '../types';

// Sensör verileri
export const getMockSensorData = (): SensorData => ({
  temperature: 24,
  humidity: 45,
  airQuality: 'good' as AirQualityStatus,
});

// Video stream verisi
export const getMockVideoStream = (): VideoStream => ({
  isLive: true,
  timestamp: new Date().toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) + ', Bugün',
  source: 'front_door_camera',
});

// Kapı çağrısı verisi
export const getMockDoorCall = (): DoorCall => ({
  id: 'call_001',
  isActive: true,
  caller: 'FRONT DOOR',
  timestamp: new Date().toLocaleTimeString('tr-TR'),
});

// Hava kalitesi durumları için renk kodları
export const getAirQualityColor = (status: AirQualityStatus): string => {
  switch (status) {
    case 'excellent':
      return '#10B981'; // Yeşil
    case 'good':
      return '#10B981'; // Yeşil
    case 'moderate':
      return '#F59E0B'; // Turuncu
    case 'poor':
      return '#F97316'; // Kırmızı-turuncu
    case 'hazardous':
      return '#EF4444'; // Kırmızı
    default:
      return '#10B981';
  }
};

// Hava kalitesi durumları için metin
export const getAirQualityText = (status: AirQualityStatus): string => {
  switch (status) {
    case 'excellent':
      return 'MÜKEMMEL';
    case 'good':
      return 'NORMAL (YEŞİL)';
    case 'moderate':
      return 'ORTA (TURUNCU)';
    case 'poor':
      return 'KÖTÜ (KIRMIZI)';
    case 'hazardous':
      return 'TEHLİKELİ (KIRMIZI)';
    default:
      return 'NORMAL';
  }
};
