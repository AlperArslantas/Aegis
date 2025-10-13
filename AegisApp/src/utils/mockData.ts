/**
 * AegisApp - Mock Veri Servisi
 */

import { SensorData, VideoStream, DoorCall, AirQualityStatus, User } from '../types';

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

// Mock kullanıcı verileri
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@aegis.com',
    username: 'admin',
    deviceNumber: 'AEGIS-001',
    name: 'Sistem Yöneticisi',
    role: 'admin',
  },
  {
    id: '2',
    email: 'user@aegis.com',
    username: 'user',
    deviceNumber: 'AEGIS-002',
    name: 'Güvenlik Operatörü',
    role: 'user',
  },
  {
    id: '3',
    email: 'test@aegis.com',
    username: 'test',
    deviceNumber: 'AEGIS-003',
    name: 'Test Kullanıcısı',
    role: 'user',
  },
];

// Mock authentication fonksiyonları
export const mockLogin = async (emailOrUsername: string, password: string, deviceNumber: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  // Simüle edilmiş network delay
  await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
  
  // Mock validation
  const user = mockUsers.find(u => 
    (u.email === emailOrUsername || u.username === emailOrUsername) &&
    u.deviceNumber === deviceNumber &&
    password === 'password123' // Tüm mock kullanıcılar aynı şifreyi kullanıyor
  );
  
  if (user) {
    return { success: true, user };
  } else {
    return { success: false, error: 'Geçersiz kullanıcı adı, şifre veya cihaz numarası' };
  }
};

export const mockForgotPassword = async (emailOrUsername: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  // Simüle edilmiş network delay
  await new Promise<void>(resolve => setTimeout(() => resolve(), 800));
  
  const user = mockUsers.find(u => 
    u.email === emailOrUsername || u.username === emailOrUsername
  );
  
  if (user) {
    return { 
      success: true, 
      message: `Şifre sıfırlama bağlantısı ${user.email} adresine gönderildi.` 
    };
  } else {
    return { 
      success: false, 
      error: 'Bu e-posta adresi veya kullanıcı adı sistemde kayıtlı değil.' 
    };
  }
};
