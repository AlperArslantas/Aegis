/**
 * AegisApp - Socket.IO Servis Modülü
 * Backend ile gerçek zamanlı iletişim için Socket.IO bağlantısı
 */

import { io, Socket } from 'socket.io-client';

// Backend URL - API servisi ile aynı
const SOCKET_URL = 'http://172.20.10.3:3000';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private pendingKapiZiliCallback: ((data: { type: string; message: string; timestamp: string }) => void) | undefined = undefined;

  /**
   * Socket.IO bağlantısını başlat
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('Socket zaten bağlı');
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO bağlantısı başarılı:', this.socket?.id);
      this.isConnected = true;
      
      // Mobil uygulama olarak kayıt ol
      this.socket?.emit('mobil-baglandi');
      console.log('📤 mobil-baglandi eventi gönderildi');
      
      // Bağlantı kurulduktan sonra bekleyen listener'ları ekle
      if (this.pendingKapiZiliCallback) {
        console.log('🔔 Bekleyen kapı zili listener\'ı ekleniyor...');
        this.socket.on('kapi-zili', this.pendingKapiZiliCallback);
        this.pendingKapiZiliCallback = undefined;
      }
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket.IO bağlantısı kesildi');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket.IO bağlantı hatası:', error);
      this.isConnected = false;
    });
  }

  /**
   * Socket.IO bağlantısını kapat
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket.IO bağlantısı kapatıldı');
    }
  }

  /**
   * Ses verisini backend'e gönder
   * audioData formatı: { audio: string (base64), type: string (m4a/aac) }
   */
  sendAudio(audioData: string | ArrayBuffer | Blob | { uri: string; type?: string } | { audio: string; type: string }): void {
    if (!this.socket || !this.isConnected) {
      console.error('Socket bağlı değil, ses gönderilemiyor');
      return;
    }

    // Ses verisini gönder
    this.socket.emit('ses-gonder', audioData);
    console.log('📤 Ses verisi Socket.IO ile gönderildi');
    
    // Debug: Gönderilen veri formatını logla
    if (typeof audioData === 'object' && 'audio' in audioData) {
      console.log(`📊 Gönderilen veri: type=${audioData.type}, base64_length=${audioData.audio.length}`);
    }
  }

  /**
   * Bağlantı durumunu kontrol et
   */
  getConnectionStatus(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Bağlantıyı yeniden dene
   */
  reconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.connect();
  }

  /**
   * Misafir konuşma modunu aç/kapa (Pi'ye mikrofon kontrolü gönder)
   */
  setMisafirKonussun(aktif: boolean): void {
    if (!this.socket || !this.isConnected) {
      console.error('Socket bağlı değil, mikrofon kontrolü gönderilemiyor');
      return;
    }

    this.socket.emit('misafir-konussun', aktif);
    console.log(`📤 Misafir konuşma modu: ${aktif ? 'Açık' : 'Kapalı'}`);
  }

  /**
   * Pi'den gelen ses verisini dinlemek için listener ekle
   * Artık WAV formatında geliyor: { audio: base64, type: 'wav', sampleRate: number, channels: number }
   */
  onPiSesVerisi(callback: (sesVerisi: string | { audio: string; type: string; sampleRate?: number; channels?: number }) => void): void {
    if (!this.socket) {
      console.error('Socket bağlı değil, listener eklenemedi');
      return;
    }

    this.socket.on('pi-den-ses-geliyor', callback);
    console.log('👂 Pi ses verisi listener eklendi');
  }

  /**
   * Pi ses verisi listener'ını kaldır
   */
  offPiSesVerisi(callback?: (sesVerisi: string | { audio: string; type: string; sampleRate?: number; channels?: number }) => void): void {
    if (!this.socket) return;
    
    if (callback) {
      this.socket.off('pi-den-ses-geliyor', callback);
    } else {
      this.socket.off('pi-den-ses-geliyor');
    }
    console.log('🔇 Pi ses verisi listener kaldırıldı');
  }

  /**
   * Kapı zili eventini dinlemek için listener ekle
   */
  onKapiZili(callback: (data: { type: string; message: string; timestamp: string }) => void): void {
    console.log('🔔 [SocketService] Kapı zili listener ekleniyor...');
    console.log('🔔 [SocketService] Socket durumu:', {
      socketExists: !!this.socket,
      isConnected: this.isConnected,
      socketConnected: this.socket?.connected
    });

    if (!this.socket) {
      console.warn('⚠️ Socket henüz oluşturulmamış, callback bekletiliyor...');
      this.pendingKapiZiliCallback = callback;
      return;
    }

    if (!this.socket.connected) {
      console.warn('⚠️ Socket henüz bağlı değil, callback bekletiliyor...');
      this.pendingKapiZiliCallback = callback;
      return;
    }

    console.log('🔔 [SocketService] Listener doğrudan ekleniyor...');
    this.socket.on('kapi-zili', (data) => {
      console.log('🔔 [SocketService] Kapı zili eventi alındı:', data);
      console.log('🔔 [SocketService] Event detayları:', JSON.stringify(data, null, 2));
      callback(data);
    });
    console.log('✅ [SocketService] Kapı zili listener başarıyla eklendi');
  }

  /**
   * Kapı zili listener'ını kaldır
   */
  offKapiZili(callback?: (data: { type: string; message: string; timestamp: string }) => void): void {
    if (!this.socket) return;
    
    if (callback) {
      this.socket.off('kapi-zili', callback);
    } else {
      this.socket.off('kapi-zili');
    }
    console.log('🔇 Kapı zili listener kaldırıldı');
  }

  /**
   * Socket instance'ını al (gerekirse)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Singleton instance
export const socketService = new SocketService();
export default socketService;
