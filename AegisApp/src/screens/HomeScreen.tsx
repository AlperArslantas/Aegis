/**
 * AegisApp - Ana Ekran
 * Güvenlik uygulaması ana arayüzü
 * Backend API'ye bağlı - Gerçek zamanlı veriler
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  TouchableOpacity,
  Animated,
  Modal,
  Vibration,
} from 'react-native';
import { check, request, PERMISSIONS, RESULTS, checkNotifications, requestNotifications } from 'react-native-permissions';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import Sound from 'react-native-sound';
import { Typography, Spacing } from '../constants/theme';
import { useTheme } from '../utils/themeContext';
import LinearGradient from 'react-native-linear-gradient';
import { SensorData, VideoStream as VideoStreamType, DoorCall } from '../types';
import { getMockVideoStream, getMockDoorCall } from '../utils/mockData';
import apiService from '../utils/apiService';
import socketService from '../utils/socketService';

// Bileşenler
import Header from '../components/Header.tsx';
import SensorPanel from '../components/SensorPanel';
import VideoStream from '../components/VideoStream';
import ActionButtons from '../components/ActionButtons';
import BottomNavigation from '../components/BottomNavigation';
import SidebarNavbar from '../components/SidebarNavbar';
import NotificationsModal from '../components/NotificationsModal';
import HistoryScreen from './HistoryScreen';
import SettingsScreen from './SettingsScreen';
import ProfileScreen from '../components/ProfileScreen';

const HomeScreen: React.FC = () => {
  // Tema context
  const { theme } = useTheme();
  
  // State yönetimi
  const [currentTab, setCurrentTab] = useState<'home' | 'history' | 'settings' | 'profile'>('home');
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [isDoorUnlocked, setIsDoorUnlocked] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [notificationDataForHistory, setNotificationDataForHistory] = useState<{ type: 'yangin' | 'acil'; data: any } | undefined>(undefined);
  const [isDoorbellModalVisible, setIsDoorbellModalVisible] = useState(false);
  const doorbellScaleAnim = useRef(new Animated.Value(0)).current;
  const [isFireGasModalVisible, setIsFireGasModalVisible] = useState(false);
  const fireGasScaleAnim = useRef(new Animated.Value(0)).current;
  const lastCheckedEventIdRef = useRef<number | null>(null); // Son kontrol edilen en yüksek olay ID'si (sadece yeni olaylar için modal göster)
  const [criticalEventData, setCriticalEventData] = useState<{ type: 'yangin' | 'gaz' | 'sicaklik'; message: string } | null>(null);
  
  // Sensör verileri - başlangıçta varsayılan değerler
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 0,
    humidity: 0,
    airQuality: 'good',
    fireDetected: false,
    motionDetected: false,
  });
  
  // Video stream ve kapı çağrısı (henüz mock - kamera aktif değil)
  const [videoStream, setVideoStream] = useState<VideoStreamType>(getMockVideoStream());
  const [doorCall, setDoorCall] = useState<DoorCall>(getMockDoorCall());

  // Ses kaydı için AudioRecorderPlayer instance (lazy initialization)
  const audioRecorderPlayer = useRef<AudioRecorderPlayer | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingPathRef = useRef<string | null>(null); // Kayıt dosyasının path'i
  
  // Pi'den gelen PCM verilerini buffer'da biriktir (fallback için)
  const pcmBufferRef = useRef<Uint8Array[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  
  // Pi'den gelen WAV chunk'larını buffer'da biriktir
  const wavChunksRef = useRef<string[]>([]);
  const isPlayingWAVRef = useRef<boolean>(false);
  const audioQueueRef = useRef<string[]>([]); // Çalınacak dosyaların queue'su (hazır WAV dosyaları)
  const isFirstPlayRef = useRef<boolean>(true); // İlk çalma mı? (dinamik threshold için)
  const nextAudioFilePathRef = useRef<string | null>(null); // Bir sonraki çalınacak dosya yolu (streaming için)

  // AudioRecorderPlayer'ı initialize et
  const getAudioRecorder = (): AudioRecorderPlayer => {
    if (!audioRecorderPlayer.current) {
      try {
        audioRecorderPlayer.current = new AudioRecorderPlayer();
        console.log('✅ AudioRecorderPlayer initialized');
      } catch (error) {
        console.error('❌ AudioRecorderPlayer initialization failed:', error);
        throw new Error('Ses kayıt modülü yüklenemedi. Lütfen uygulamayı rebuild edin.');
      }
    }
    return audioRecorderPlayer.current;
  };

  // Backend'den sensör verilerini çek
  const fetchSensorData = useCallback(async () => {
    try {
      const data = await apiService.getSensorData();
      if (data) {
        setSensorData(data);
        setIsBackendConnected(true);
      }
    } catch (error) {
      console.error('Sensör verisi çekilemedi:', error);
      setIsBackendConnected(false);
    }
  }, []);

  // Backend'den kapı durumunu çek
  const fetchDoorStatus = useCallback(async () => {
    try {
      const status = await apiService.getDoorStatus();
      if (status) {
        setIsDoorUnlocked(!status.isLocked);
        // Kapı zili çalıyorsa doorCall güncelle
        if (status.isRinging) {
          setDoorCall(prev => ({ ...prev, isActive: true }));
        }
      }
    } catch (error) {
      console.error('Kapı durumu çekilemedi:', error);
    }
  }, []);


  // Yangın ve gaz kaçağı kontrolü - Sadece yeni eklenen olaylar için modal göster
  const checkFireAndGasLeak = useCallback(async () => {
    try {
      // Son 50 olayı çek (yeni olayları yakalamak için yeterli sayı)
      const olaylar = await apiService.getOlaylar(50);
      
      if (olaylar.length === 0) {
        return;
      }

      // En yüksek ID'yi bul (tüm olaylar arasında)
      const maxId = Math.max(...olaylar.map((olay: any) => olay.id || 0));

      // İlk açılış: Sadece en yüksek ID'yi kaydet, modal gösterme
      if (lastCheckedEventIdRef.current === null) {
        lastCheckedEventIdRef.current = maxId;
        console.log('📝 İlk açılış: En yüksek olay ID kaydedildi:', maxId);
        return;
      }

      // Yeni olaylar var mı kontrol et (ID > lastCheckedEventIdRef)
      const newEvents = olaylar.filter((olay: any) => 
        olay.id && olay.id > lastCheckedEventIdRef.current!
      );

      if (newEvents.length === 0) {
        // Yeni olay yok, en yüksek ID'yi güncelle (eğer değiştiyse)
        if (maxId > lastCheckedEventIdRef.current) {
          lastCheckedEventIdRef.current = maxId;
        }
        return;
      }

      console.log(`🆕 ${newEvents.length} yeni olay tespit edildi`);

      // Yeni olaylar arasında yangın, gaz kaçağı veya yüksek sıcaklık var mı?
      const criticalEvent = newEvents.find((olay: any) => {
        // Yangın tespit edildi mi?
        if (olay.yangin_tespit_edildi === true) {
          return true;
        }
        // Gaz kaçağı var mı?
        if (olay.tip === 'GAZ_KACAGI') {
          return true;
        }
        // Yüksek sıcaklık var mı?
        if (olay.tip === 'YUKSEK_SICAKLIK') {
          return true;
        }
        return false;
      });

      // En yüksek ID'yi güncelle (yeni olaylar olsun ya da olmasın)
      lastCheckedEventIdRef.current = maxId;

      if (criticalEvent) {
        console.log('🚨 Yeni kritik olay tespit edildi!', {
          id: criticalEvent.id,
          tip: criticalEvent.tip,
          yangin_tespit_edildi: criticalEvent.yangin_tespit_edildi,
          deger: criticalEvent.deger
        });

        // Olay tipini belirle
        let eventType: 'yangin' | 'gaz' | 'sicaklik';
        let eventMessage: string;
        
        if (criticalEvent.yangin_tespit_edildi === true) {
          eventType = 'yangin';
          eventMessage = 'Yangın tespit edildi! Hemen güvenli bir yere çıkın ve itfaiyeyi arayın.';
        } else if (criticalEvent.tip === 'GAZ_KACAGI') {
          eventType = 'gaz';
          eventMessage = 'Gaz kaçağı tespit edildi! Hemen pencereleri açın, gazı kapatın ve güvenli bir yere çıkın.';
        } else if (criticalEvent.tip === 'YUKSEK_SICAKLIK') {
          eventType = 'sicaklik';
          const sicaklik = criticalEvent.deger ? `${criticalEvent.deger}°C` : 'yüksek';
          eventMessage = `Yüksek sıcaklık tespit edildi! (${sicaklik}) Ortamı havalandırın ve yangın riskine karşı dikkatli olun.`;
        } else {
          // Fallback (olması gerekmez ama TypeScript için)
          eventType = 'yangin';
          eventMessage = 'Kritik durum tespit edildi! Lütfen dikkatli olun.';
        }

        setCriticalEventData({ type: eventType, message: eventMessage });

        // Titreşim
        console.log('📳 Titreşim başlatılıyor...');
        Vibration.vibrate([500, 200, 500, 200, 500]); // Daha uzun titreşim
        console.log('✅ Titreşim başlatıldı');
        
        // Alarm sesi çal - Platform'a göre yükle
        console.log('🔊 Alarm sesi yükleniyor: alarm.wav');
        console.log('🔊 Platform:', Platform.OS);
        
        try {
          if (Platform.OS === 'ios') {
            // iOS: MAIN_BUNDLE kullan
            const alarmSound = new Sound('alarm.m4a', Sound.MAIN_BUNDLE, (error) => {
              if (error) {
                console.error('❌ Alarm sesi yüklenemedi:', error);
                console.error('❌ Hata mesajı:', error.message || error);
                return;
              }
              console.log('✅ Alarm sesi yüklendi, çalınıyor...');
              alarmSound.setVolume(1.0);
              alarmSound.play((success) => {
                if (success) {
                  console.log('✅ Alarm sesi başarıyla çalındı');
                } else {
                  console.error('❌ Alarm sesi çalma hatası (success=false)');
                }
                alarmSound.release();
                console.log('🧹 Alarm sesi serbest bırakıldı');
              });
            });
          } else {
            // Android: require() kullan
            try {
              const soundPath = require('../assets/sounds/alarm.wav');
              const alarmSound = new Sound(soundPath, (error) => {
                if (error) {
                  console.error('❌ Alarm sesi yüklenemedi:', error);
                  console.error('❌ Hata mesajı:', error.message || error);
                  return;
                }
                console.log('✅ Alarm sesi yüklendi, çalınıyor...');
                alarmSound.setVolume(1.0);
                alarmSound.play((success) => {
                  if (success) {
                    console.log('✅ Alarm sesi başarıyla çalındı');
                  } else {
                    console.error('❌ Alarm sesi çalma hatası (success=false)');
                  }
                  alarmSound.release();
                  console.log('🧹 Alarm sesi serbest bırakıldı');
                });
              });
            } catch (requireError) {
              console.error('❌ require() hatası:', requireError);
            }
          }
        } catch (error) {
          console.error('❌ Alarm sesi çalma hatası:', error);
        }
        
        // Modal göster
        console.log('📱 Yangın/Gaz kaçağı modalı gösteriliyor...');
        setIsFireGasModalVisible(true);
        console.log('✅ Modal state güncellendi');
      }
    } catch (error) {
      console.error('❌ Yangın/gaz kaçağı kontrolü hatası:', error);
    }
  }, []);

  // Base64 decode helper (React Native'de atob yok)
  const base64ToUint8Array = (base64: string): Uint8Array => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    base64 = base64.replace(/[^A-Za-z0-9\+\/]/g, '');
    
    while (i < base64.length) {
      const encoded1 = chars.indexOf(base64.charAt(i++));
      const encoded2 = chars.indexOf(base64.charAt(i++));
      const encoded3 = chars.indexOf(base64.charAt(i++));
      const encoded4 = chars.indexOf(base64.charAt(i++));
      
      const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
      
      result += String.fromCharCode((bitmap >> 16) & 255);
      if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
      if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
    }
    
    const bytes = new Uint8Array(result.length);
    for (let i = 0; i < result.length; i++) {
      bytes[i] = result.charCodeAt(i);
    }
    return bytes;
  };

  // WAV ses çalma fonksiyonu (Backend'den direkt WAV geliyor)
  // Buffer'a ekle ve biriktir, sonra çal - Dinamik threshold ile
  const playWAVAudio = async (base64WAV: string): Promise<void> => {
    try {
      // WAV chunk'ını buffer'a ekle
      wavChunksRef.current.push(base64WAV);
      
      // Eğer çalma işlemi devam ediyorsa, buffer'ı biriktirmeye devam et ve bir sonraki dosyayı hazırla
      if (isPlayingWAVRef.current) {
        // Buffer'da çok fazla chunk birikirse (40'tan fazla), eski chunk'ları temizle
        if (wavChunksRef.current.length > 40) {
          console.warn('⚠️ Buffer çok dolu, eski chunk\'lar temizleniyor...');
          wavChunksRef.current = wavChunksRef.current.slice(-35); // Son 35 chunk'ı tut
        }
        
        // Çalma devam ederken bir sonraki dosyayı hazırla (streaming queue) - 30 chunk ile
        if (wavChunksRef.current.length >= 30 && !nextAudioFilePathRef.current) {
          prepareNextAudioFile().catch((err) => {
            console.error('❌ Sonraki dosya hazırlama hatası:', err);
          });
        }
        return;
      }
      
      // Dinamik threshold: İlk çalma için 10 chunk (hızlı başlangıç), sonra 30 chunk (çok akıcı devam)
      const threshold = isFirstPlayRef.current ? 10 : 30;
      
      // Buffer'da yeterli chunk varsa çal
      if (wavChunksRef.current.length >= threshold) {
        isFirstPlayRef.current = false; // Artık ilk çalma değil
        await playBufferedWAV();
      }
      
    } catch (error) {
      console.error('WAV buffer ekleme hatası:', error);
    }
  };

  // Bir sonraki ses dosyasını hazırla (streaming queue için)
  const prepareNextAudioFile = async (): Promise<string | null> => {
    if (wavChunksRef.current.length < 30 || nextAudioFilePathRef.current) {
      return null; // Yeterli chunk yok veya zaten hazır
    }

    try {
      // Buffer'dan 30 chunk al (sonraki çalma için - daha büyük buffer = daha akıcı)
      const chunksToPrepare = wavChunksRef.current.slice(0, 30);
      
      // Chunk'ları birleştir ve dosyaya yaz
      const firstChunkBytes = base64ToUint8Array(chunksToPrepare[0]);
      
      // WAV header kontrolü
      const headerCheck = String.fromCharCode(firstChunkBytes[0], firstChunkBytes[1], firstChunkBytes[2], firstChunkBytes[3]);
      if (headerCheck !== 'RIFF') {
        return null;
      }
      
      // Data kısımlarını birleştir
      let totalDataLength = 0;
      const allDataChunks: Uint8Array[] = [];
      
      for (const chunk of chunksToPrepare) {
        const chunkBytes = base64ToUint8Array(chunk);
        const dataChunk = chunkBytes.slice(44);
        allDataChunks.push(dataChunk);
        totalDataLength += dataChunk.length;
      }
      
      // WAV header oluştur
      const sampleRate = (firstChunkBytes[24] | (firstChunkBytes[25] << 8) | (firstChunkBytes[26] << 16) | (firstChunkBytes[27] << 24)) >>> 0;
      const fileSize = 36 + totalDataLength;
      
      const header = new ArrayBuffer(44);
      const view = new DataView(header);
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, fileSize, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, totalDataLength, true);
      
      // WAV dosyasını oluştur
      const combinedWAV = new Uint8Array(44 + totalDataLength);
      combinedWAV.set(new Uint8Array(header), 0);
      
      let offset = 44;
      for (const dataChunk of allDataChunks) {
        combinedWAV.set(dataChunk, offset);
        offset += dataChunk.length;
      }
      
      // Base64'e çevir
      const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let base64 = '';
      for (let i = 0; i < combinedWAV.length; i += 3) {
        const byte1 = combinedWAV[i];
        const byte2 = combinedWAV[i + 1] || 0;
        const byte3 = combinedWAV[i + 2] || 0;
        const bitmap = (byte1 << 16) | (byte2 << 8) | byte3;
        base64 += base64Chars.charAt((bitmap >> 18) & 63);
        base64 += base64Chars.charAt((bitmap >> 12) & 63);
        base64 += i + 1 < combinedWAV.length ? base64Chars.charAt((bitmap >> 6) & 63) : '=';
        base64 += i + 2 < combinedWAV.length ? base64Chars.charAt(bitmap & 63) : '=';
      }
      
      // Dosyaya yaz
      const tempFilePath = `${RNFS.CachesDirectoryPath}/next_audio_${Date.now()}.wav`;
      await RNFS.writeFile(tempFilePath, base64, 'base64');
      
      nextAudioFilePathRef.current = tempFilePath;
      console.log('🎵 Sonraki ses dosyası hazırlandı:', tempFilePath);
      
      return tempFilePath;
    } catch (error) {
      console.error('❌ Sonraki dosya hazırlama hatası:', error);
      return null;
    }
  };

  // Buffer'daki WAV chunk'larını birleştirip çal - Streaming queue desteği ile
  const playBufferedWAV = async (): Promise<void> => {
    if (isPlayingWAVRef.current || wavChunksRef.current.length === 0) {
      return;
    }

      // Eğer bir sonraki dosya hazırsa, onu kullan (streaming queue)
      if (nextAudioFilePathRef.current) {
        const nextFilePath = nextAudioFilePathRef.current;
        nextAudioFilePathRef.current = null; // Queue'dan çıkar
        
        // Hazır dosyayı çal
        await playAudioFile(nextFilePath);
        
        // Buffer'dan hazırlanan chunk'ları sil (30 chunk)
        if (wavChunksRef.current.length >= 30) {
          wavChunksRef.current = wavChunksRef.current.slice(30);
        }
        
        return;
      }

    try {
      isPlayingWAVRef.current = true;
      
      // Dinamik chunk sayısı: İlk çalma için 10, sonra 30 (çok büyük buffer = çok akıcı)
      const chunkCount = isFirstPlayRef.current ? 10 : 30;
      const chunksToPlay = wavChunksRef.current.slice(0, chunkCount);
      
      if (chunksToPlay.length === 0) {
        isPlayingWAVRef.current = false;
        return;
      }
      
      // İlk chunk'tan WAV header'ı al
      const firstChunk = chunksToPlay[0];
      const firstChunkBytes = base64ToUint8Array(firstChunk);
      
      // WAV header kontrolü
      const headerCheck = String.fromCharCode(firstChunkBytes[0], firstChunkBytes[1], firstChunkBytes[2], firstChunkBytes[3]);
      const formatCheck = String.fromCharCode(firstChunkBytes[8], firstChunkBytes[9], firstChunkBytes[10], firstChunkBytes[11]);
      
      if (headerCheck !== 'RIFF' || formatCheck !== 'WAVE') {
        console.error('❌ Geçersiz WAV formatı:', headerCheck, formatCheck);
        wavChunksRef.current = [];
        isPlayingWAVRef.current = false;
        return;
      }
      
      // Seçilen chunk'ların data kısmını birleştir
      let totalDataLength = 0;
      const allDataChunks: Uint8Array[] = [];
      
      for (const chunk of chunksToPlay) {
        const chunkBytes = base64ToUint8Array(chunk);
        // Her chunk'tan data kısmını al (44 byte header'dan sonra)
        const dataChunk = chunkBytes.slice(44);
        allDataChunks.push(dataChunk);
        totalDataLength += dataChunk.length;
      }
      
      // Buffer'dan kullanılan chunk'ları sil
      wavChunksRef.current = wavChunksRef.current.slice(chunkCount);
      
      // Yeni WAV header oluştur (toplam data length ile)
      const sampleRate = (firstChunkBytes[24] | (firstChunkBytes[25] << 8) | (firstChunkBytes[26] << 16) | (firstChunkBytes[27] << 24)) >>> 0;
      const fileSize = 36 + totalDataLength;
      
      const header = new ArrayBuffer(44);
      const view = new DataView(header);
      
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, fileSize, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, totalDataLength, true);
      
      // WAV dosyasını oluştur
      const combinedWAV = new Uint8Array(44 + totalDataLength);
      combinedWAV.set(new Uint8Array(header), 0);
      
      let offset = 44;
      for (const dataChunk of allDataChunks) {
        combinedWAV.set(dataChunk, offset);
        offset += dataChunk.length;
      }
      
      // Base64'e çevir
      const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let base64 = '';
      for (let i = 0; i < combinedWAV.length; i += 3) {
        const byte1 = combinedWAV[i];
        const byte2 = combinedWAV[i + 1] || 0;
        const byte3 = combinedWAV[i + 2] || 0;
        const bitmap = (byte1 << 16) | (byte2 << 8) | byte3;
        base64 += base64Chars.charAt((bitmap >> 18) & 63);
        base64 += base64Chars.charAt((bitmap >> 12) & 63);
        base64 += i + 1 < combinedWAV.length ? base64Chars.charAt((bitmap >> 6) & 63) : '=';
        base64 += i + 2 < combinedWAV.length ? base64Chars.charAt(bitmap & 63) : '=';
      }
      
      console.log('🎵 Birleştirilmiş WAV oluşturuldu, çalınıyor...', totalDataLength, 'bytes, chunk sayısı:', chunkCount);
      
      // Base64 WAV'ı geçici dosyaya yaz ve çal
      const tempFilePath = `${RNFS.CachesDirectoryPath}/temp_audio_${Date.now()}.wav`;
      
      try {
        // Base64 string'i direkt dosyaya yaz
        await RNFS.writeFile(tempFilePath, base64, 'base64');
        
        console.log('✅ WAV dosyası geçici konuma yazıldı:', tempFilePath);
        
        // Dosyayı çal
        await playAudioFile(tempFilePath, totalDataLength, sampleRate);
        
      } catch (fileError: any) {
        console.error('❌ WAV dosyası yazma/çalma hatası:', fileError);
        // Hata durumunda da dosyayı temizlemeye çalış
        RNFS.unlink(tempFilePath).catch(() => {});
        isPlayingWAVRef.current = false;
      }
      
    } catch (error) {
      console.error('WAV buffer çalma hatası:', error);
      isPlayingWAVRef.current = false;
    }
  };

  // Ses dosyasını çal - streaming queue desteği ile
  const playAudioFile = async (filePath: string, totalDataLength?: number, sampleRate?: number): Promise<void> => {
    try {
      // iOS'ta file:// protokolü ekle, Android'de direkt path kullan
      const fileUri = Platform.OS === 'ios' 
        ? `file://${filePath}` 
        : filePath;
      
      console.log('📁 Çalınacak dosya URI:', fileUri);
      
      // Dosyayı çal
      const recorder = getAudioRecorder();
      const msg = await recorder.startPlayer(fileUri);
      console.log('✅ WAV çalınıyor...', msg);
      
      // Duration hesaplama - AudioRecorderPlayer'dan gelen değeri kullan, yoksa manuel hesapla
      let duration: number;
      if (msg && typeof msg === 'object' && 'duration' in msg) {
        const msgDuration = (msg as any).duration;
        // Duration saniye cinsinden geliyorsa milisaniyeye çevir
        duration = typeof msgDuration === 'number' && msgDuration < 1000 
          ? msgDuration * 1000 
          : (typeof msgDuration === 'number' ? msgDuration : 0);
        console.log('📊 AudioRecorderPlayer duration:', duration, 'ms');
      } else if (totalDataLength && sampleRate) {
        // Fallback: Manuel hesaplama (2 bytes per sample, 16-bit mono)
        duration = (totalDataLength / (sampleRate * 2)) * 1000;
        console.log('📊 Manuel hesaplanan duration:', duration, 'ms');
      } else {
        // En son fallback: Dosya boyutundan tahmin et
        try {
          const fileInfo = await RNFS.stat(filePath);
          const fileSize = fileInfo.size;
          duration = Math.max((fileSize / 100) * 1000, 500); // Kabaca tahmin
          console.log('📊 Dosya boyutundan tahmin edilen duration:', duration, 'ms');
        } catch (e) {
          duration = 1000; // Güvenli varsayılan
          console.log('📊 Varsayılan duration kullanıldı:', duration, 'ms');
        }
      }
      
      // Duration'a ek olarak 100ms buffer ekle (kesilmemesi için)
      const playDuration = Math.max(duration + 100, 200); // En az 200ms
      
      // Çalma sırasında bir sonraki dosyayı hazırla (streaming queue) - 30 chunk ile
      if (wavChunksRef.current.length >= 30 && !nextAudioFilePathRef.current) {
        prepareNextAudioFile().catch((err) => {
          console.error('❌ Sonraki dosya hazırlama hatası:', err);
        });
      }
      
      setTimeout(async () => {
        try {
          await recorder.stopPlayer();
          // Geçici dosyayı sil
          await RNFS.unlink(filePath).catch(() => {
            // Dosya silme hatası önemli değil
          });
          console.log('🔇 WAV çalma tamamlandı');
          
          // isPlayingWAVRef'i false yap ki bir sonraki buffer çalınsın
          isPlayingWAVRef.current = false;
          
          // Streaming queue: Bir sonraki dosya hazırsa direkt çal
          if (nextAudioFilePathRef.current) {
            const nextFile = nextAudioFilePathRef.current;
            nextAudioFilePathRef.current = null; // Queue'dan çıkar
            
            // Buffer'dan hazırlanan chunk'ları sil (30 chunk)
            if (wavChunksRef.current.length >= 30) {
              wavChunksRef.current = wavChunksRef.current.slice(30);
            }
            
            console.log('🔄 Streaming queue: Bir sonraki dosya çalınıyor...');
            playAudioFile(nextFile).catch((err) => {
              console.error('❌ Streaming queue çalma hatası:', err);
              isPlayingWAVRef.current = false;
            });
            return;
          }
          
          // Buffer'da yeni chunk'lar varsa tekrar çal (30 chunk threshold)
          const threshold = isFirstPlayRef.current ? 10 : 30;
          if (wavChunksRef.current.length >= threshold) {
            console.log('🔄 Buffer\'da yeni chunk\'lar var, çalınıyor...');
            playBufferedWAV();
          }
        } catch (e) {
          console.error('❌ WAV durdurma hatası:', e);
          // Sessizce geç ve dosyayı silmeye çalış
          RNFS.unlink(filePath).catch(() => {});
          isPlayingWAVRef.current = false;
        }
      }, playDuration);
    } catch (error) {
      console.error('❌ playAudioFile hatası:', error);
      RNFS.unlink(filePath).catch(() => {});
      isPlayingWAVRef.current = false;
      throw error;
    }
  };

  // PCM ses çalma fonksiyonu - Buffer'a ekle ve çal (fallback için)
  const playPCMAudio = async (base64PCM: string): Promise<void> => {
    try {
      // Base64'ü decode et
      const bytes = base64ToUint8Array(base64PCM);
      
      // Buffer'a ekle
      pcmBufferRef.current.push(bytes);
      
      // Eğer çalma işlemi devam ediyorsa, yeni chunk'ı bekle
      if (isPlayingRef.current) {
        return;
      }
      
      // Buffer'da yeterli veri varsa çal (örneğin 4 chunk = ~0.1 saniye)
      if (pcmBufferRef.current.length >= 4) {
        await playBufferedPCM();
      }
      
    } catch (error) {
      console.error('PCM buffer ekleme hatası:', error);
    }
  };

  // Buffer'daki PCM verilerini WAV'a çevirip çal
  const playBufferedPCM = async (): Promise<void> => {
    if (isPlayingRef.current || pcmBufferRef.current.length === 0) {
      return;
    }

    try {
      isPlayingRef.current = true;
      
      // Tüm chunk'ları birleştir
      const totalLength = pcmBufferRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
      const combinedPCM = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of pcmBufferRef.current) {
        combinedPCM.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Buffer'ı temizle
      pcmBufferRef.current = [];
      
      // WAV header oluştur
      const sampleRate = 44100; // Pi'den gelen rate
      const channels = 1; // Mono
      const bitsPerSample = 16;
      const dataLength = combinedPCM.length;
      const fileSize = 36 + dataLength;
      
      // WAV header buffer
      const header = new ArrayBuffer(44);
      const view = new DataView(header);
      
      // RIFF header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, fileSize, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM format
      view.setUint16(22, channels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * channels * (bitsPerSample / 8), true);
      view.setUint16(32, channels * (bitsPerSample / 8), true);
      view.setUint16(34, bitsPerSample, true);
      writeString(36, 'data');
      view.setUint32(40, dataLength, true);
      
      // WAV dosyasını oluştur (header + PCM data)
      const wavBytes = new Uint8Array(44 + dataLength);
      wavBytes.set(new Uint8Array(header), 0);
      wavBytes.set(combinedPCM, 44);
      
      // Base64'e çevir (React Native'de btoa yok, manuel encode)
      const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let base64 = '';
      for (let i = 0; i < wavBytes.length; i += 3) {
        const byte1 = wavBytes[i];
        const byte2 = wavBytes[i + 1] || 0;
        const byte3 = wavBytes[i + 2] || 0;
        
        const bitmap = (byte1 << 16) | (byte2 << 8) | byte3;
        
        base64 += base64Chars.charAt((bitmap >> 18) & 63);
        base64 += base64Chars.charAt((bitmap >> 12) & 63);
        base64 += i + 1 < wavBytes.length ? base64Chars.charAt((bitmap >> 6) & 63) : '=';
        base64 += i + 2 < wavBytes.length ? base64Chars.charAt(bitmap & 63) : '=';
      }
      const wavBase64 = base64;
      
      console.log('🎵 WAV oluşturuldu, boyut:', dataLength, 'bytes, sampleRate:', sampleRate);
      
      // Not: React Native'de raw PCM veya WAV çalmak için geçici dosyaya yazmak gerekiyor
      // react-native-fs native modül hatası verdiği için şimdilik log atıyoruz
      // 
      // ÇÖZÜM ÖNERİSİ:
      // 1. Backend'de (Node.js) PCM'yi WAV'a çevirip göndermek (ÖNERİLEN)
      // 2. Veya react-native-fs'i düzgün kurup geçici dosyaya yazmak
      // 3. Veya Web Audio API kullanmak (React Native'de sınırlı destek)
      
      console.log('⚠️ WAV çalma için geçici dosya yazma veya backend\'de format dönüşümü gerekli');
      console.log('💡 Backend\'de PCM\'yi WAV\'a çevirip göndermek daha verimli olur');
      
      // Debug: WAV verisinin ilk birkaç byte'ını logla
      console.log('🔍 WAV header kontrol:', 
        String.fromCharCode(wavBytes[0], wavBytes[1], wavBytes[2], wavBytes[3]),
        String.fromCharCode(wavBytes[8], wavBytes[9], wavBytes[10], wavBytes[11])
      );
      
    } catch (error) {
      console.error('PCM çalma hatası:', error);
    } finally {
      isPlayingRef.current = false;
    }
  };


  // Socket.IO bağlantısını başlat ve Pi ses verisi listener'ını ekle
  useEffect(() => {
    console.log('🔌 [HomeScreen] Socket.IO bağlantısı başlatılıyor...');
    socketService.connect();

    // Pi'den gelen ses verisini dinle (artık WAV formatında geliyor)
    const handlePiSesVerisi = async (sesVerisi: string | { audio: string; type: string; sampleRate?: number; channels?: number }) => {
      try {
        // Backend'den WAV formatında geliyor
        if (typeof sesVerisi === 'object' && sesVerisi.audio) {
          console.log('🎧 Pi\'den WAV ses verisi alındı, type:', sesVerisi.type);
          await playWAVAudio(sesVerisi.audio);
        } else if (typeof sesVerisi === 'string') {
          // Fallback: Eski format (PCM)
          console.log('⚠️ Eski format (PCM) algılandı, WAV\'a çevriliyor...');
          await playPCMAudio(sesVerisi);
        }
      } catch (error) {
        console.error('❌ Pi ses verisi işleme hatası:', error);
      }
    };

    socketService.onPiSesVerisi(handlePiSesVerisi);

    // Kapı zili eventini dinle
    const handleKapiZili = (data: { type: string; message: string; timestamp: string }) => {
      console.log('🔔 [HomeScreen] Kapı zili eventi alındı:', data);
      console.log('🔔 [HomeScreen] Event detayları:', JSON.stringify(data, null, 2));
      
      try {
        // Titreşim
        console.log('📳 Titreşim başlatılıyor...');
        Vibration.vibrate([500, 200, 500]); // 500ms titreşim, 200ms bekle, 500ms titreşim
        console.log('✅ Titreşim başlatıldı');
        
        // Ses çal - Platform'a göre yükle
        console.log('🔊 Ses dosyası yükleniyor: dingdong.wav');
        console.log('🔊 Platform:', Platform.OS);
        
        try {
          if (Platform.OS === 'ios') {
            // iOS: MAIN_BUNDLE kullan
            const dingdongSound = new Sound('dingdong.wav', Sound.MAIN_BUNDLE, (error) => {
              if (error) {
                console.error('❌ Ses dosyası yüklenemedi:', error);
                console.error('❌ Hata mesajı:', error.message || error);
                return;
              }
              console.log('✅ Ses dosyası yüklendi, çalınıyor...');
              dingdongSound.setVolume(1.0);
              dingdongSound.play((success) => {
                if (success) {
                  console.log('✅ Kapı zili sesi başarıyla çalındı');
                } else {
                  console.error('❌ Ses çalma hatası (success=false)');
                }
                dingdongSound.release();
                console.log('🧹 Ses dosyası serbest bırakıldı');
              });
            });
          } else {
            // Android: require() kullan
            try {
              const soundPath = require('../assets/sounds/dingdong.wav');
              const dingdongSound = new Sound(soundPath, (error) => {
                if (error) {
                  console.error('❌ Ses dosyası yüklenemedi:', error);
                  console.error('❌ Hata mesajı:', error.message || error);
                  return;
                }
                console.log('✅ Ses dosyası yüklendi, çalınıyor...');
                dingdongSound.setVolume(1.0);
                dingdongSound.play((success) => {
                  if (success) {
                    console.log('✅ Kapı zili sesi başarıyla çalındı');
                  } else {
                    console.error('❌ Ses çalma hatası (success=false)');
                  }
                  dingdongSound.release();
                  console.log('🧹 Ses dosyası serbest bırakıldı');
                });
              });
            } catch (requireError) {
              console.error('❌ require() hatası:', requireError);
            }
          }
        } catch (error) {
          console.error('❌ Ses çalma hatası:', error);
        }
        
        // Modal göster
        console.log('📱 Modal gösteriliyor...');
        setIsDoorbellModalVisible(true);
        console.log('✅ Modal state güncellendi');
      } catch (error) {
        console.error('❌ Kapı zili işleme hatası:', error);
      }
    };

    // Socket bağlantısı kurulduktan sonra listener'ı ekle
    // Kısa bir gecikme ile listener'ı ekle (socket bağlantısının tamamlanması için)
    const setupKapiZiliListener = () => {
      console.log('🔔 [HomeScreen] Kapı zili listener kuruluyor...');
      socketService.onKapiZili(handleKapiZili);
      console.log('✅ [HomeScreen] Kapı zili listener kuruldu');
    };

    // Hemen dene, eğer socket bağlı değilse socketService içinde bekletilecek
    setupKapiZiliListener();
    
    // Ayrıca bir timeout ile de tekrar dene (socket bağlantısı gecikirse)
    const timeoutId = setTimeout(() => {
      console.log('⏰ [HomeScreen] Timeout: Kapı zili listener tekrar kuruluyor...');
      setupKapiZiliListener();
    }, 2000);
    
    // Periyodik olarak buffer'daki WAV verilerini çal (eğer yeterli veri biriktiyse)
    // Dinamik threshold: İlk çalma için 10 chunk, sonra 30 chunk (çok büyük buffer)
    const wavBufferCheckInterval = setInterval(() => {
      if (!isPlayingWAVRef.current) {
        const threshold = isFirstPlayRef.current ? 10 : 30;
        if (wavChunksRef.current.length >= threshold) {
          playBufferedWAV();
        }
      }
    }, 200); // Her 200ms'de bir kontrol et (30 chunk için biraz daha uzun interval)
    
    // PCM buffer kontrolü (fallback için)
    const pcmBufferCheckInterval = setInterval(() => {
      if (pcmBufferRef.current.length >= 2 && !isPlayingRef.current) {
        playBufferedPCM();
      }
    }, 50);

    return () => {
      // Component unmount olduğunda listener'ı kaldır ve bağlantıyı kapat
      clearTimeout(timeoutId);
      socketService.offPiSesVerisi(handlePiSesVerisi);
      socketService.offKapiZili(handleKapiZili);
      if (wavBufferCheckInterval) {
        clearInterval(wavBufferCheckInterval);
      }
      if (pcmBufferCheckInterval) {
        clearInterval(pcmBufferCheckInterval);
      }
      wavChunksRef.current = []; // WAV buffer'ı temizle
      pcmBufferRef.current = []; // PCM buffer'ı temizle
      socketService.disconnect();
    };
  }, []);

  // Backend bağlantı kontrolü ve ilk veri çekme
  useEffect(() => {
    const checkBackendAndFetchData = async () => {
      const health = await apiService.checkHealth();
      if (health) {
        setIsBackendConnected(true);
        console.log('✅ Backend bağlantısı başarılı');
        // İlk verileri çek
        await fetchSensorData();
        await fetchDoorStatus();
      } else {
        setIsBackendConnected(false);
        console.log('❌ Backend bağlantısı başarısız');
      }
    };

    checkBackendAndFetchData();
  }, [fetchSensorData, fetchDoorStatus]);

  // Sensör verilerini periyodik güncelle (3 saniyede bir)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSensorData();
      fetchDoorStatus();
      setVideoStream(getMockVideoStream()); // Video timestamp güncelle
    }, 3000);

    return () => {
      clearInterval(interval);
      // Component unmount olduğunda kayıt interval'ini de temizle
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [fetchSensorData, fetchDoorStatus]);

  // Yangın ve gaz kaçağı kontrolü (3 saniyede bir)
  useEffect(() => {
    const interval = setInterval(() => {
      checkFireAndGasLeak();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [checkFireAndGasLeak]);

  // Kamera, Kişiler, Konum (ve Android CALL_PHONE) izinleri
  useEffect(() => {
    const ensureCorePermissions = async () => {
      try {
        // Kamera
        const cameraPermission = Platform.select({
          ios: PERMISSIONS.IOS.CAMERA,
          android: PERMISSIONS.ANDROID.CAMERA,
          default: undefined,
        });
        if (cameraPermission) {
          const s = await check(cameraPermission);
          if (s !== RESULTS.GRANTED) {
            await request(cameraPermission);
          }
        }

        // Kişiler
        const contactsPermission = Platform.select({
          ios: PERMISSIONS.IOS.CONTACTS,
          android: PERMISSIONS.ANDROID.READ_CONTACTS,
          default: undefined,
        });
        if (contactsPermission) {
          const s = await check(contactsPermission);
          if (s !== RESULTS.GRANTED) {
            await request(contactsPermission);
          }
        }

        // Konum (WhenInUse / Fine)
        const locationPermission = Platform.select({
          ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
          android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          default: undefined,
        });
        if (locationPermission) {
          const s = await check(locationPermission);
          if (s !== RESULTS.GRANTED) {
            await request(locationPermission);
          }
        }

        // Android: Acil durum araması için CALL_PHONE
        if (Platform.OS === 'android') {
          const phoneStatus = await check(PERMISSIONS.ANDROID.CALL_PHONE);
          if (phoneStatus !== RESULTS.GRANTED) {
            await request(PERMISSIONS.ANDROID.CALL_PHONE);
          }
        }
      } catch (e) {
        // sessizce geç
      }
    };

    ensureCorePermissions();
  }, []);

  // Uygulama açılışında Mikrofon iznini iste
  useEffect(() => {
    const ensureMicrophonePermission = async () => {
      try {
        const permission = Platform.select({
          ios: PERMISSIONS.IOS.MICROPHONE,
          android: PERMISSIONS.ANDROID.RECORD_AUDIO,
          default: undefined,
        });

        if (!permission) {
          console.log('⚠️ Mikrofon izni bu platformda desteklenmiyor');
          return;
        }

        const current = await check(permission);
        console.log('📱 Mikrofon izin durumu:', current);
        
        if (current === RESULTS.GRANTED) {
          console.log('✅ Mikrofon izni zaten verilmiş');
          return;
        }

        console.log('🔔 Mikrofon izni isteniyor...');
        const result = await request(permission);
        console.log('📱 Mikrofon izin sonucu:', result);
        
        if (result === RESULTS.GRANTED) {
          console.log('✅ Mikrofon izni verildi');
        } else {
          console.warn('⚠️ Mikrofon izni reddedildi:', result);
        }
      } catch (e) {
        console.error('❌ Mikrofon izni hatası:', e);
      }
    };

    ensureMicrophonePermission();
  }, []);

  // Bildirim izni (iOS ve Android 13+)
  useEffect(() => {
    const ensureNotificationPermission = async () => {
      try {
        const { status } = await checkNotifications();
        if (status !== RESULTS.GRANTED) {
          await requestNotifications(['alert', 'sound', 'badge']);
        }
      } catch (e) {
        // sessizce geç
      }
    };

    ensureNotificationPermission();
  }, []);

  // Event handlers
  const handleMenuPress = () => {
    setIsSidebarVisible(true);
  };

  const handleNotificationPress = () => {
    setIsNotificationsVisible(true);
  };

  const handleNotificationItemPress = (notificationId: string, notificationType: 'yangin' | 'acil', notificationData: any) => {
    console.log('📱 handleNotificationItemPress çağrıldı:', { notificationId, notificationType, hasData: !!notificationData });
    // Bildirim verisini kaydet ve geçmiş sayfasına yönlendir
    setNotificationDataForHistory({ type: notificationType, data: notificationData });
    setCurrentTab('history');
    console.log('✅ Geçmiş sayfasına yönlendiriliyor...');
    // Modal kapandıktan sonra veriyi temizle (bir sonraki açılışta kullanılmaması için)
    setTimeout(() => {
      setNotificationDataForHistory(undefined);
    }, 1000);
  };

  const handleSidebarClose = () => {
    setIsSidebarVisible(false);
  };

  const handleNotificationsClose = () => {
    setIsNotificationsVisible(false);
  };

  const handleUnreadCountChange = (count: number) => {
    setHasUnreadNotifications(count > 0);
  };

  const handleMenuItemPress = (menuItem: string) => {
    console.log('Menu item pressed:', menuItem);
    
    // Sidebar menü öğelerini BottomNavigation ile eşleştir
    switch (menuItem) {
      case 'dashboard':
        setCurrentTab('home');
        break;
      case 'history':
        setCurrentTab('history');
        break;
      case 'settings':
        setCurrentTab('settings');
        break;
      default:
        // Diğer menü öğeleri için console log
        console.log('Menu item not mapped:', menuItem);
        break;
    }
  };

  const handleTabPress = (tab: 'home' | 'history' | 'settings' | 'profile') => {
    setCurrentTab(tab);
    console.log('Tab pressed:', tab);
  };

  const handleProfileTabChange = (tab: 'home' | 'history' | 'settings' | 'profile') => {
    setCurrentTab(tab);
    console.log('Profile tab changed:', tab);
  };

  // Ekran render fonksiyonu
  const renderCurrentScreen = () => {
    switch (currentTab) {
      case 'settings':
        return <SettingsScreen onTabChange={handleTabPress} />;
      case 'history':
        return <HistoryScreen onTabChange={handleTabPress} initialNotificationData={notificationDataForHistory} />;
      case 'profile':
        return <ProfileScreen onTabChange={handleProfileTabChange} />;
      default:
        return renderHomeContent();
    }
  };

  const renderHomeContent = () => (
    <>
      {/* Header */}
      <Header
        onMenuPress={handleMenuPress}
        onNotificationPress={handleNotificationPress}
        hasUnreadNotifications={hasUnreadNotifications}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Video Stream */}
        <VideoStream
          stream={videoStream}
          onPress={handleVideoPress}
        />

        {/* Etkileşim Butonları - Full-Duplex Konuşma (Hem konuş hem dinle) */}
        <ActionButtons
          onSpeakPress={handleSpeakPress}
          onUnlockPress={handleUnlockPress}
          isMicrophoneActive={isMicrophoneActive}
          isDoorUnlocked={isDoorUnlocked}
        />
        <View style={[styles.fullDuplexInfo, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.fullDuplexText, { color: theme.colors.textSecondary }]}>
            💬 {isMicrophoneActive ? 'Aktif: Hem konuşuyor hem dinliyorsunuz' : 'Butona tıklayarak hem konuşabilir hem misafiri dinleyebilirsiniz'}
          </Text>
        </View>

        {/* Sensör Paneli */}
        <SensorPanel sensorData={sensorData} />

        {/* Durum Bilgileri */}
        <View style={[styles.statusContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statusTitle, { color: theme.colors.textSecondary }]}>SİSTEM DURUMU</Text>
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: theme.colors.text }]}>Sistem Durumu:</Text>
            <Text style={[styles.statusValue, { color: isBackendConnected ? theme.colors.success : theme.colors.danger }]}>
              {isBackendConnected ? '● Aktif' : '○ Bağlantı Yok'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: theme.colors.text }]}>Mikrofon:</Text>
            <Text style={[styles.statusValue, { color: isMicrophoneActive ? theme.colors.success : theme.colors.textMuted }]}>
              {isMicrophoneActive ? 'Aktif' : 'Pasif'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: theme.colors.text }]}>Kapı Kilidi:</Text>
            <Text style={[styles.statusValue, { color: isDoorUnlocked ? theme.colors.warning : theme.colors.success }]}>
              {isDoorUnlocked ? 'Açık' : 'Kilitli'}
            </Text>
          </View>
          {sensorData.fireDetected && (
            <View style={[styles.statusItem, { backgroundColor: theme.colors.danger, borderRadius: 8, padding: 8, marginTop: 8 }]}>
              <Text style={[styles.statusLabel, { color: '#FFFFFF', fontWeight: 'bold' }]}>🔥 YANGIN ALARMI!</Text>
            </View>
          )}
          {sensorData.motionDetected && (
            <View style={styles.statusItem}>
              <Text style={[styles.statusLabel, { color: theme.colors.text }]}>Hareket:</Text>
              <Text style={[styles.statusValue, { color: theme.colors.warning }]}>
                Algılandı
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sidebar Navbar */}
      <SidebarNavbar
        isVisible={isSidebarVisible}
        onClose={handleSidebarClose}
        onMenuItemPress={handleMenuItemPress}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isVisible={isNotificationsVisible}
        onClose={handleNotificationsClose}
        onNotificationPress={handleNotificationItemPress}
        onUnreadCountChange={handleUnreadCountChange}
      />

      {/* Kapı Zili Modal - Güzel Bildirim */}
      <Modal
        visible={isDoorbellModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDoorbellModalVisible(false)}
        onShow={() => {
          // Modal açıldığında animasyon başlat
          Animated.spring(doorbellScaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        }}
      >
        <View style={styles.doorbellModalOverlay}>
          <Animated.View
            style={[
              styles.doorbellModalContentWrapper,
              {
                transform: [{ scale: doorbellScaleAnim }],
                opacity: doorbellScaleAnim,
              },
            ]}
          >
            <View style={[styles.doorbellModalContent, { backgroundColor: theme.colors.surface }]}>
              {/* İkon Container */}
              <View style={styles.doorbellIconContainer}>
                <View style={[styles.doorbellIconCircle, { backgroundColor: theme.colors.info + '25' }]}>
                  <Text style={styles.doorbellIcon}>🔔</Text>
                </View>
              </View>

              {/* Başlık */}
              <Text style={[styles.doorbellModalTitle, { color: theme.colors.text }]}>
                Kapı Zili Çalıyor!
              </Text>
              
              {/* Mesaj */}
              <Text style={[styles.doorbellModalMessage, { color: theme.colors.textSecondary }]}>
                Kapınızda biri var. Görüntüyü görmek veya konuşmak için butonları kullanabilirsiniz.
              </Text>

              {/* Butonlar */}
              <View style={styles.doorbellModalButtons}>
                <TouchableOpacity
                  style={[styles.doorbellModalButton, styles.doorbellModalButtonSecondary, { borderColor: theme.colors.textMuted }]}
                  onPress={() => {
                    Animated.spring(doorbellScaleAnim, {
                      toValue: 0,
                      useNativeDriver: true,
                    }).start(() => {
                      doorbellScaleAnim.setValue(0);
                      setIsDoorbellModalVisible(false);
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.doorbellModalButtonText, { color: theme.colors.text }]}>
                    Kapat
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.doorbellModalButton, styles.doorbellModalButtonPrimary, { backgroundColor: theme.colors.info }]}
                  onPress={() => {
                    console.log('📷 Kamera görüntüsü açılıyor...');
                    Animated.spring(doorbellScaleAnim, {
                      toValue: 0,
                      useNativeDriver: true,
                    }).start(() => {
                      doorbellScaleAnim.setValue(0);
                      setIsDoorbellModalVisible(false);
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.doorbellModalButtonText, { color: '#FFFFFF' }]}>
                    Görüntüle
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Yangın/Gaz Kaçağı Modal - Acil Durum Uyarısı */}
      <Modal
        visible={isFireGasModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFireGasModalVisible(false)}
        onShow={() => {
          // Modal açıldığında animasyon başlat
          Animated.spring(fireGasScaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        }}
      >
        <View style={styles.doorbellModalOverlay}>
          <Animated.View
            style={[
              styles.doorbellModalContentWrapper,
              {
                transform: [{ scale: fireGasScaleAnim }],
                opacity: fireGasScaleAnim,
              },
            ]}
          >
            <View style={[styles.doorbellModalContent, { backgroundColor: theme.colors.surface }]}>
              {/* İkon Container */}
              <View style={styles.doorbellIconContainer}>
                <View style={[styles.doorbellIconCircle, { backgroundColor: theme.colors.danger + '25' }]}>
                  <Text style={styles.doorbellIcon}>
                    {criticalEventData?.type === 'yangin' ? '🔥' : criticalEventData?.type === 'sicaklik' ? '🌡️' : '⚠️'}
                  </Text>
                </View>
              </View>

              {/* Başlık */}
              <Text style={[styles.doorbellModalTitle, { color: theme.colors.danger }]}>
                {criticalEventData?.type === 'yangin' ? 'YANGIN ALARMI!' : criticalEventData?.type === 'sicaklik' ? 'YÜKSEK SICAKLIK UYARISI!' : 'GAZ KAÇAĞI UYARISI!'}
              </Text>
              
              {/* Mesaj */}
              <Text style={[styles.doorbellModalMessage, { color: theme.colors.textSecondary }]}>
                {criticalEventData?.message || 'Acil durum tespit edildi!'}
              </Text>

              {/* Butonlar */}
              <View style={styles.doorbellModalButtons}>
                <TouchableOpacity
                  style={[styles.doorbellModalButton, styles.doorbellModalButtonPrimary, { backgroundColor: theme.colors.danger }]}
                  onPress={() => {
                    Animated.spring(fireGasScaleAnim, {
                      toValue: 0,
                      useNativeDriver: true,
                    }).start(() => {
                      fireGasScaleAnim.setValue(0);
                      setIsFireGasModalVisible(false);
                      setCriticalEventData(null);
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.doorbellModalButtonText, { color: '#FFFFFF' }]}>
                    Anladım
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );

  // Full-Duplex Konuşma: Aç/Kapat modu (Tıklayınca aç, tekrar tıklayınca kapat)
  const handleSpeakPress = async () => {
    try {
      // Eğer mikrofon aktifse, kapat
      if (isMicrophoneActive) {
        // 1. Uygulama kaydını durdur ve gönder
        try {
          const recorder = getAudioRecorder();
          const result = await recorder.stopRecorder();
          recorder.removeRecordBackListener();
          
          // Interval'i temizle
          if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
          }

          setIsMicrophoneActive(false);
          console.log('✅ Uygulama mikrofonu kapatıldı');

          // Kaydedilen ses dosyasını gönder
          const filePathToRead = recordingPathRef.current || result;
          
          if (filePathToRead) {
            try {
              console.log('📁 Ses dosyası okunuyor - Kaydedilen path:', recordingPathRef.current);
              console.log('📁 Ses dosyası okunuyor - StopRecorder result:', result);
              console.log('📁 Kullanılacak path:', filePathToRead);
              
              // file:// protokolünü kaldır (RNFS için gerekli)
              let filePath = filePathToRead;
              if (filePath.startsWith('file://')) {
                filePath = filePath.replace('file://', '');
              }
              
              // Dosyanın varlığını kontrol et
              const fileExists = await RNFS.exists(filePath);
              console.log('📂 Dosya var mı?', fileExists, '- Path:', filePath);
              
              if (!fileExists) {
                throw new Error(`Dosya bulunamadı: ${filePath}`);
              }
              
              // RNFS ile dosyayı base64 olarak oku
              const base64Audio = await RNFS.readFile(filePath, 'base64');
              console.log('✅ Ses dosyası base64 formatına çevrildi, boyut:', base64Audio.length, 'karakter');
              
              // Dosya uzantısını belirle (m4a veya aac)
              const fileExtension = filePath.split('.').pop()?.toLowerCase() || 'm4a';
              const audioType = fileExtension === 'm4a' ? 'm4a' : 'aac';
              
              // Backend'e base64 formatında gönder
              const audioData = {
                audio: base64Audio,
                type: audioType
              };
              
              socketService.sendAudio(audioData);
              console.log('✅ Ses kaydı Pi\'ye gönderildi (base64 formatında, type:', audioType, ', boyut:', base64Audio.length, 'karakter)');
              
              // Geçici dosyayı sil
              await RNFS.unlink(filePath).catch(() => {
                // Dosya silme hatası önemli değil
              });
              
              // Path'i temizle
              recordingPathRef.current = null;
              
            } catch (fileError: any) {
              console.error('❌ Ses dosyası okuma hatası:', fileError);
              console.error('❌ Dosya path:', filePathToRead);
              Alert.alert(
                'Dosya Okuma Hatası',
                `Ses dosyası okunamadı: ${fileError.message || 'Bilinmeyen hata'}\n\nDosya yolu: ${filePathToRead}`
              );
              recordingPathRef.current = null;
            }
          } else {
            console.warn('⚠️ Kayıt path\'i bulunamadı - ses gönderilemedi');
          }

        } catch (error) {
          console.error('Ses kaydı durdurma hatası:', error);
          setIsMicrophoneActive(false);
        }

        // 2. Pi mikrofonunu kapat
        socketService.setMisafirKonussun(false);
        console.log('🔇 Pi mikrofonu kapatıldı');

        // 3. Buffer'ı temizle
        wavChunksRef.current = [];
        nextAudioFilePathRef.current = null;
        isFirstPlayRef.current = true;
        console.log('🧹 Buffer ve queue temizlendi - full-duplex konuşma durduruldu');
        return;
      }

      // Mikrofon aktif değilse, aç
      // Bağlantı kontrolü
      if (!socketService.getConnectionStatus()) {
        Alert.alert('Bağlantı Hatası', 'Backend ile bağlantı kurulamadı');
        return;
      }

      // Mikrofon iznini kontrol et
      const permission = Platform.select({
        ios: PERMISSIONS.IOS.MICROPHONE,
        android: PERMISSIONS.ANDROID.RECORD_AUDIO,
        default: undefined,
      });

      if (!permission) {
        Alert.alert('Hata', 'Mikrofon izni alınamadı');
        return;
      }

      const permissionStatus = await check(permission);
      if (permissionStatus !== RESULTS.GRANTED) {
        const requestResult = await request(permission);
        if (requestResult !== RESULTS.GRANTED) {
          Alert.alert('İzin Gerekli', 'Mikrofon izni olmadan konuşma özelliği kullanılamaz');
          return;
        }
      }

      // Backend bağlantı kontrolü
      const healthCheck = await apiService.checkHealth();
      if (!healthCheck) {
        Alert.alert(
          'Backend Bağlantı Hatası',
          'Backend sunucusuna bağlanılamadı.\n\n' +
          'Lütfen kontrol edin:\n' +
          '• Backend sunucusu çalışıyor mu?\n' +
          '• IP adresi doğru mu?\n' +
          '• Aynı ağda mısınız?'
        );
        return;
      }

      // 1. Uygulama mikrofonunu başlat (konuşma kaydı)
      try {
        const recorder = getAudioRecorder();
        const audioSet: any = {
          AudioEncoderAndroid: 3, // AAC
          AudioSourceAndroid: 1, // MIC
          AVEncoderAudioQualityKeyIOS: 'high',
          AVNumberOfChannelsKeyIOS: 2,
          AVFormatIDKeyIOS: 'aac',
        };

        console.log('🎙️ Uygulama mikrofonu açılıyor...');
        const uri = await recorder.startRecorder(undefined, audioSet);
        console.log('✅ Ses kaydı başlatıldı:', uri);
        
        // Kayıt path'ini kaydet
        recordingPathRef.current = uri;
        console.log('📝 Kayıt path\'i kaydedildi:', recordingPathRef.current);

        setIsMicrophoneActive(true);

        // Ses kaydı listener'ı ekle
        recorder.addRecordBackListener((e: any) => {
          console.log('Kayıt durumu:', e.currentPosition, e.currentMetering);
        });

        // 2. Pi mikrofonunu aç (misafiri dinleme)
        socketService.setMisafirKonussun(true);
        console.log('👂 Pi mikrofonu açıldı - Misafir dinleniyor');
        console.log('🎤 Full-Duplex aktif: Hem konuşuyor hem dinliyorsunuz');

      } catch (error: any) {
        console.error('Ses kaydı başlatma hatası:', error);
        let errorMessage = 'Mikrofon başlatılamadı.';
        if (error?.message?.includes('null') || error?.message?.includes('undefined')) {
          errorMessage = 'Ses kayıt modülü yüklenemedi.\n\n' +
            'Lütfen uygulamayı rebuild edin.';
        } else if (error?.message) {
          errorMessage = `Mikrofon hatası: ${error.message}`;
        }
        Alert.alert('Hata', errorMessage);
        setIsMicrophoneActive(false);
        socketService.setMisafirKonussun(false);
      }

    } catch (error) {
      console.error('Speak press hatası:', error);
      Alert.alert('Hata', 'Bir şeyler yanlış gitti');
      setIsMicrophoneActive(false);
      socketService.setMisafirKonussun(false);
    }
  };

  // Kapı kilidi kontrolü - Backend'e istek at
  const handleUnlockPress = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      let success: boolean;
      
      if (isDoorUnlocked) {
        // Kapıyı kilitle
        success = await apiService.lockDoor();
        if (success) {
          setIsDoorUnlocked(false);
          console.log('✅ Kapı kilitlendi');
        } else {
          Alert.alert('Hata', 'Kapı kilitlenemedi. Lütfen tekrar deneyin.');
        }
      } else {
        // Kapıyı aç
        success = await apiService.unlockDoor();
        if (success) {
          setIsDoorUnlocked(true);
          console.log('✅ Kapı açıldı');
        } else {
          Alert.alert('Hata', 'Kapı açılamadı. Lütfen tekrar deneyin.');
        }
      }
    } catch (error) {
      console.error('Kapı kontrolü hatası:', error);
      Alert.alert('Bağlantı Hatası', 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoPress = () => {
    console.log('Video stream pressed');
  };


  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Mevcut Ekran */}
      {renderCurrentScreen()}

      {/* Alt Navigasyon - sadece home ekranında göster */}
      {currentTab === 'home' && (
        <BottomNavigation
          currentTab={currentTab}
          onTabPress={handleTabPress}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  welcomeContainer: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    marginBottom: Spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.md,
  },
  welcomeDescription: {
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  statusContainer: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: 12,
  },
  statusTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.md,
    textAlign: 'center',
    letterSpacing: 1,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statusLabel: {
    fontSize: Typography.base,
  },
  statusValue: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  fullDuplexInfo: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  fullDuplexText: {
    fontSize: Typography.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  doorbellModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doorbellModalContentWrapper: {
    width: '85%',
    maxWidth: 400,
  },
  doorbellModalContent: {
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  doorbellIconContainer: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  doorbellIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doorbellIcon: {
    fontSize: 40,
  },
  doorbellModalTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  doorbellModalMessage: {
    fontSize: Typography.base,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
    paddingHorizontal: Spacing.xs,
  },
  doorbellModalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.md,
  },
  doorbellModalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  doorbellModalButtonPrimary: {
    // Primary button background set inline
  },
  doorbellModalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  doorbellModalButtonText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
});

export default HomeScreen;
