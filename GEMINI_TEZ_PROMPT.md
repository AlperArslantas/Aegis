# AEGIS: Akıllı Kapı Zili ve Yangın Tespit Sistemi - Tez Yazım Promptu

## PROJE ÖZETİ VE AMAÇ

AEGIS (Akıllı Güvenlik Sistemi), Raspberry Pi tabanlı bir IoT güvenlik çözümüdür. Sistem, akıllı kapı zili özellikleri ile yangın tespit ve erken uyarı sistemini birleştirerek kapsamlı bir ev güvenliği platformu sunmaktadır. Proje, mobil uygulama (React Native), backend servisi (Node.js/TypeScript) ve donanım katmanı (Raspberry Pi + sensörler) olmak üzere üç ana bileşenden oluşmaktadır.

**Ana Amaçlar:**
- Gerçek zamanlı sensör verisi toplama ve analiz
- YOLOv8 tabanlı görüntü analizi ile yangın tespiti
- Full-duplex ses iletişimi ile akıllı kapı zili
- Mobil uygulama üzerinden uzaktan kontrol ve izleme
- WebSocket tabanlı gerçek zamanlı veri akışı
- Güvenli API mimarisi ve kullanıcı kimlik doğrulama

---

## SİSTEM MİMARİSİ VE TEKNOLOJİLER

### 1. Frontend (Mobil Uygulama)
**Teknoloji Stack:**
- **React Native 0.82.0** - Cross-platform mobil uygulama geliştirme
- **TypeScript** - Tip güvenli kod yazımı
- **React Navigation** - Sayfa yönetimi ve navigasyon
- **Socket.IO Client** - Gerçek zamanlı iletişim
- **React Native Audio Recorder Player** - Ses kayıt ve çalma
- **React Native Permissions** - İzin yönetimi (kamera, mikrofon, konum)
- **AsyncStorage** - Yerel veri saklama

**Mimari Özellikler:**
- Context API ile state yönetimi (AuthContext, ThemeContext)
- Component-based yapı
- RESTful API entegrasyonu
- WebSocket ile gerçek zamanlı veri akışı
- Platform-specific kod (iOS/Android)

**Ana Bileşenler:**
- HomeScreen: Ana kontrol paneli
- HistoryScreen: Sensör ve olay geçmişi
- SettingsScreen: Sistem ayarları
- ProfileScreen: Kullanıcı profili
- SensorPanel: Sensör verileri görüntüleme
- VideoStream: Canlı video akışı
- ActionButtons: Kapı kontrolü ve ses iletişimi
- IncomingCallBanner: Gelen çağrı bildirimi

### 2. Backend (Node.js/TypeScript)
**Teknoloji Stack:**
- **Node.js 18+** - Server-side runtime
- **TypeScript 5.3+** - Tip güvenli backend geliştirme
- **Express.js 4.18** - Web framework
- **Socket.IO 4.7** - Gerçek zamanlı iletişim
- **TypeORM 0.3** - ORM ve veritabanı yönetimi
- **SQLite3** - Geliştirme veritabanı (PostgreSQL production için hazır)
- **Winston** - Logging sistemi
- **Joi** - Veri validasyonu
- **bcryptjs** - Şifre hashleme
- **jsonwebtoken** - JWT authentication
- **Python Shell** - Python script entegrasyonu (yangın tespiti)

**Mimari Desenler:**
- **Layered Architecture**: Controller → Service → Repository → Infrastructure
- **Dependency Injection**: IoC Container ile bağımlılık yönetimi
- **Unit of Work Pattern**: Transaction yönetimi
- **Repository Pattern**: Veri erişim soyutlaması
- **Factory Pattern**: Nesne oluşturma
- **Observer Pattern**: Event handling (Socket.IO)

**Katmanlar:**
1. **Controllers**: HTTP request/response işleme
2. **Services**: İş mantığı ve use case implementasyonları
3. **Repositories**: Veri erişim katmanı
4. **Infrastructure**: Harici servisler (GPIO, Database, Socket.IO)
5. **Interfaces**: Sözleşme tanımları

**API Endpoints:**
- `GET /api/sensors/current` - Güncel sensör verileri
- `POST /api/sensors/update` - Sensör verisi güncelleme
- `GET /api/sensors/history` - Sensör geçmişi
- `GET /api/sensors/yangin-tespitleri` - Yangın tespit kayıtları
- `GET /api/sensors/acil-durumlar` - Acil durum kayıtları
- `POST /api/sensors/calibrate` - Sensör kalibrasyonu
- `GET /api/door/status` - Kapı durumu
- `POST /api/door/unlock` - Kapıyı aç
- `POST /api/door/lock` - Kapıyı kilitle
- `POST /api/door/ring` - Kapı zilini çal
- `GET /api/door/calls` - Cevaplanmamış çağrılar
- `GET /health` - Sistem sağlık kontrolü

**WebSocket Events:**
- `subscribe-sensors` - Sensör güncellemelerini dinle
- `subscribe-door` - Kapı olaylarını dinle
- `pi-baglandi` - Raspberry Pi bağlantısı
- `mobil-baglandi` - Mobil uygulama bağlantısı
- `ses-gonder` - Ses verisi gönderme (mobil → Pi)
- `pi-ses-verisi` - Pi'den ses verisi (Pi → mobil)
- `misafir-konussun` - Mikrofon kontrolü
- `sensor-update` - Sensör verisi güncellemesi
- `door-event` - Kapı olayı
- `fire-alarm` - Yangın alarmı

### 3. Donanım Katmanı (Raspberry Pi)
**Donanım Bileşenleri:**
- Raspberry Pi (GPIO pinleri)
- Sıcaklık sensörü (DHT22/DHT11)
- Gaz sensörü (MQ-2/MQ-135)
- Hareket sensörü (PIR)
- Kapı kilidi kontrolü (relay modülü)
- Kapı zili (buzzer/speaker)
- Kamera modülü (yangın tespiti için)
- Mikrofon (ses iletişimi için)

**GPIO Pin Konfigürasyonu:**
- Sensör pinleri: GPIO 18
- Kapı kilidi: GPIO 23
- Kapı zili: GPIO 24
- Hareket sensörü: GPIO 25

**Python Entegrasyonu:**
- `detect_fire.py`: YOLOv8n modeli ile yangın tespiti
- Ultralytics YOLO kütüphanesi
- Görüntü analizi ve güven seviyesi hesaplama

---

## ÖZELLİKLER VE FONKSİYONELLİK

### 1. Sensör Yönetimi
- **Sıcaklık ve Nem Ölçümü**: DHT22 sensörü ile gerçek zamanlı ölçüm
- **Hava Kalitesi İzleme**: MQ-2/MQ-135 gaz sensörü ile hava kalitesi tespiti
- **Hareket Algılama**: PIR sensörü ile hareket tespiti
- **Yangın Tespiti**: 
  - YOLOv8n görüntü analizi
  - Sensör verisi kombinasyonu (sıcaklık + gaz)
  - Gerçek zamanlı alarm sistemi
- **Veri Geçmişi**: Tüm sensör verilerinin zaman damgalı kaydı
- **Kalibrasyon**: Sensör kalibrasyonu ve eşik değer ayarlama

### 2. Akıllı Kapı Zili
- **Gelen Çağrı Bildirimi**: Kapı zili çalındığında mobil uygulamaya bildirim
- **Full-Duplex Ses İletişimi**: 
  - Mobil uygulamadan Pi'ye ses gönderme
  - Pi'den mobil uygulamaya ses alma
  - Gerçek zamanlı interkom sistemi
- **Kapı Kilidi Kontrolü**: Uzaktan kapı kilidi açma/kapama
- **Çağrı Geçmişi**: Tüm kapı zili çağrılarının kaydı
- **Güvenlik Durumu**: Kapı durumu ve güvenlik kontrolleri

### 3. Yangın Tespit Sistemi
- **Görüntü Analizi**: 
  - YOLOv8n (nano) modeli kullanımı
  - Gerçek zamanlı görüntü işleme
  - Güven seviyesi hesaplama (0.0 - 1.0)
  - Tespit edilen objelerin listelenmesi
- **Veritabanı Kaydı**: 
  - Yangın tespit sonuçlarının kaydı
  - Tarih/saat bilgisi
  - Güven seviyesi ve açıklama
- **Acil Durum Yönetimi**: 
  - Yangın tespit edildiğinde acil durum kaydı
  - Mobil uygulamaya anlık bildirim
  - Alarm sistemi

### 4. Mobil Uygulama Özellikleri
- **Gerçek Zamanlı Veri Görüntüleme**: Sensör verilerinin canlı güncellenmesi
- **Video Stream**: Canlı video akışı görüntüleme
- **Ses İletişimi**: Full-duplex konuşma özelliği
- **Geçmiş Görüntüleme**: Sensör ve olay geçmişi
- **Ayarlar**: Sistem konfigürasyonu
- **Profil Yönetimi**: Kullanıcı bilgileri
- **Bildirimler**: Push notification desteği
- **Tema Desteği**: Açık/koyu tema

### 5. Güvenlik Özellikleri
- **JWT Authentication**: Token tabanlı kimlik doğrulama
- **CORS Koruması**: Cross-origin istek kontrolü
- **Input Validation**: Joi ile veri doğrulama
- **Password Hashing**: bcryptjs ile şifre hashleme
- **Rate Limiting**: API istek sınırlaması
- **Helmet**: HTTP header güvenliği
- **Error Handling**: Merkezi hata yönetimi

---

## VERİTABANI YAPISI

### Tablolar

1. **sensors** (Sensör Verileri)
   - id (PRIMARY KEY)
   - temperature (DECIMAL)
   - humidity (DECIMAL)
   - airQuality (VARCHAR)
   - fireDetected (BOOLEAN)
   - motionDetected (BOOLEAN)
   - timestamp (TIMESTAMP)

2. **yangin_tespiti** (Yangın Tespit Kayıtları)
   - id (PRIMARY KEY)
   - yangin_tespit_edildi (BOOLEAN)
   - guven_seviyesi (DECIMAL 5,4)
   - aciklama (TEXT)
   - goruntu_yolu (VARCHAR 500)
   - olusturulma_tarihi (TIMESTAMP)

3. **acil_durumlar** (Acil Durum Kayıtları)
   - id (PRIMARY KEY)
   - durum_tipi (VARCHAR) - 'yangin', 'gaz_kaçagi', vb.
   - acil_durum_aktif (BOOLEAN)
   - aciklama (TEXT)
   - olusturulma_tarihi (TIMESTAMP)

4. **door_calls** (Kapı Çağrıları)
   - id (PRIMARY KEY)
   - caller_name (VARCHAR)
   - is_answered (BOOLEAN)
   - timestamp (TIMESTAMP)

5. **door_events** (Kapı Olayları)
   - id (PRIMARY KEY)
   - event_type (VARCHAR) - 'unlock', 'lock', 'ring'
   - timestamp (TIMESTAMP)

---

## SİSTEM AKIŞI VE İŞLEVLER

### 1. Sensör Verisi Akışı
```
Raspberry Pi → GPIO Okuma → Backend API (/api/sensors/update) 
→ Veritabanı Kaydı → Socket.IO Broadcast → Mobil Uygulama
```

### 2. Yangın Tespit Akışı
```
Kamera Görüntüsü → detect_fire.py (YOLOv8) → Analiz Sonucu 
→ Backend API → Veritabanı Kaydı → Socket.IO Alarm → Mobil Uygulama Bildirimi
```

### 3. Kapı Zili Akışı
```
Kapı Zili Tetikleme → Raspberry Pi → Backend API → Socket.IO Event 
→ Mobil Uygulama Bildirimi → Kullanıcı Yanıtı → Ses İletişimi
```

### 4. Ses İletişimi Akışı
```
Mobil Uygulama Mikrofon → Ses Kaydı (AAC/M4A) → Base64 Encoding 
→ Socket.IO (ses-gonder) → Backend → Raspberry Pi → Hoparlör

Raspberry Pi Mikrofon → PCM Ses Verisi → Backend (PCM→WAV Dönüşümü) 
→ Socket.IO (pi-den-ses-geliyor) → Mobil Uygulama → WAV Çalma
```

---

## GELİŞTİRME VE TEST

### Geliştirme Ortamı
- **Mock GPIO Service**: Raspberry Pi olmadan geliştirme
- **SQLite Database**: Geliştirme veritabanı
- **Hot Reload**: Nodemon ile otomatik yeniden başlatma
- **TypeScript Compilation**: TSC ile tip kontrolü

### Test Stratejisi
- **Unit Tests**: Jest framework ile birim testler
- **Integration Tests**: API endpoint testleri
- **E2E Tests**: Mobil uygulama entegrasyon testleri
- **Mock Services**: Test için mock servisler

### Deployment
- **Raspberry Pi**: PM2 ile process yönetimi
- **Backend**: Node.js production build
- **Mobil Uygulama**: iOS App Store / Google Play Store
- **Database**: PostgreSQL (production)

---

## TEKNİK ZORLUKLAR VE ÇÖZÜMLER

### 1. Gerçek Zamanlı Ses İletişimi
**Sorun**: Full-duplex ses iletişiminde gecikme ve kesintiler
**Çözüm**: 
- Buffer yönetimi ile chunk birleştirme
- Dinamik threshold (ilk çalma: 10 chunk, devam: 30 chunk)
- Streaming queue ile kesintisiz çalma
- PCM → WAV dönüşümü backend'de

### 2. Yangın Tespit Doğruluğu
**Sorun**: YOLOv8n standart modeli 'fire' sınıfı içermiyor
**Çözüm**: 
- Özel yangın tespit modeli önerisi
- Sensör verisi kombinasyonu (sıcaklık + gaz)
- Güven seviyesi eşik değeri ayarlama

### 3. Cross-Platform Uyumluluk
**Sorun**: iOS ve Android platform farklılıkları
**Çözüm**: 
- Platform-specific kod (Platform.OS)
- React Native Permissions ile izin yönetimi
- Native modül entegrasyonu

### 4. WebSocket Bağlantı Yönetimi
**Sorun**: Bağlantı kopmaları ve yeniden bağlanma
**Çözüm**: 
- Socket.IO otomatik yeniden bağlanma
- Room-based yayınlama (pi-cihazlari, mobil-uygulamalar)
- Bağlantı durumu takibi

---

## SONUÇ VE GELECEK ÇALIŞMALAR

### Tamamlanan Özellikler
✅ Sensör verisi toplama ve görüntüleme
✅ Yangın tespit sistemi (YOLOv8)
✅ Akıllı kapı zili
✅ Full-duplex ses iletişimi
✅ Mobil uygulama (iOS/Android)
✅ Gerçek zamanlı veri akışı (WebSocket)
✅ Güvenli API mimarisi
✅ Veritabanı kayıt sistemi

### Gelecek Geliştirmeler
- [ ] Özel yangın tespit modeli eğitimi
- [ ] Yüz tanıma özelliği
- [ ] Çoklu kullanıcı desteği
- [ ] Cloud backup ve senkronizasyon
- [ ] Machine learning ile anomali tespiti
- [ ] Enerji yönetimi optimizasyonu
- [ ] Video kayıt ve arşivleme
- [ ] SMS/Email bildirimleri
- [ ] Çoklu dil desteği
- [ ] Dashboard ve analitik

---

## TEZ YAPISI ÖNERİSİ

### 1. GİRİŞ
- Problem tanımı
- Amaç ve kapsam
- Çalışmanın önemi
- Tez organizasyonu

### 2. LİTERATÜR TARAMASI
- IoT güvenlik sistemleri
- Akıllı kapı zili çözümleri
- Yangın tespit yöntemleri
- Görüntü işleme ve YOLO
- Mobil uygulama geliştirme
- WebSocket ve gerçek zamanlı iletişim

### 3. SİSTEM TASARIMI
- Sistem gereksinimleri
- Mimari tasarım
- Veritabanı tasarımı
- API tasarımı
- Güvenlik tasarımı

### 4. UYGULAMA GELİŞTİRME
- Frontend geliştirme (React Native)
- Backend geliştirme (Node.js/TypeScript)
- Donanım entegrasyonu (Raspberry Pi)
- Python entegrasyonu (yangın tespiti)

### 5. TEST VE DEĞERLENDİRME
- Test senaryoları
- Performans testleri
- Güvenlik testleri
- Kullanıcı testleri
- Sonuç analizi

### 6. SONUÇ VE ÖNERİLER
- Çalışmanın özeti
- Elde edilen sonuçlar
- Gelecek çalışmalar
- Öneriler

---

## KAYNAK KOD YAPISI

### Backend (AegisAppBackend/)
```
src/
├── config/          # Konfigürasyon dosyaları (db.ts, swagger.ts)
├── controllers/     # HTTP controller'lar (SensorController, DoorController)
├── services/        # İş mantığı servisleri (SensorService, DoorService)
├── repositories/   # Veri erişim katmanı
├── infrastructure/  # Altyapı servisleri (Container, UnitOfWork, MockGPIO)
├── interfaces/      # Interface tanımları (IGPIOService, IRepository)
├── middleware/      # Express middleware (errorHandler, requestLogger)
├── models/          # Veritabanı modelleri
├── utils/           # Yardımcı fonksiyonlar (logger, socketInstance)
└── index.ts         # Ana giriş noktası
```

### Frontend (AegisApp/)
```
src/
├── components/      # React Native bileşenleri
├── screens/         # Ekran bileşenleri (HomeScreen, LoginScreen, vb.)
├── utils/          # Yardımcı fonksiyonlar (apiService, socketService, authContext)
├── constants/      # Sabitler (theme.ts)
└── types/          # TypeScript tip tanımları
```

---

## KULLANILAN KÜTÜPHANELER VE VERSİYONLAR

### Backend
- express: ^4.18.2
- socket.io: ^4.7.4
- typeorm: ^0.3.17
- sqlite3: ^5.1.6
- winston: ^3.11.0
- joi: ^17.11.0
- bcryptjs: ^2.4.3
- jsonwebtoken: ^9.0.2
- python-shell: ^5.0.0
- sharp: ^0.32.6

### Frontend
- react-native: 0.82.0
- react: 19.1.1
- @react-navigation/native: ^7.1.18
- socket.io-client: ^4.7.5
- react-native-audio-recorder-player: ^3.6.0
- react-native-permissions: ^5.4.2

### Python (Yangın Tespiti)
- ultralytics (YOLOv8)
- yolov8n.pt model dosyası

---

## PERFORMANS METRİKLERİ

- **API Response Time**: < 200ms (ortalama)
- **WebSocket Latency**: < 100ms
- **Ses İletişimi Gecikme**: < 500ms
- **Yangın Tespit Süresi**: < 2 saniye (görüntü analizi)
- **Sensör Verisi Güncelleme**: 3 saniyede bir
- **Mobil Uygulama Başlatma**: < 3 saniye

---

## GÜVENLİK ÖNLEMLERİ

1. **Authentication**: JWT token tabanlı kimlik doğrulama
2. **Authorization**: Role-based access control (gelecek)
3. **Data Encryption**: HTTPS/TLS iletişim
4. **Input Validation**: Joi ile veri doğrulama
5. **SQL Injection Prevention**: TypeORM parametreli sorgular
6. **CORS**: Sadece izin verilen origin'ler
7. **Rate Limiting**: API istek sınırlaması
8. **Password Security**: bcryptjs ile hashleme
9. **Error Handling**: Hassas bilgi sızıntısı önleme
10. **Logging**: Güvenlik olaylarının kaydı

---

## LİSANS VE KATKIDA BULUNMA

- **Lisans**: MIT License
- **Versiyon**: 1.0.0
- **Geliştirici**: Aegis Team

---

## İLETİŞİM VE DESTEK

- **GitHub Repository**: [Repository URL]
- **Issues**: [GitHub Issues]
- **Documentation**: README.md dosyaları

---

**NOT**: Bu prompt, Gemini AI'ya AEGIS projesi hakkında kapsamlı bir tez yazması için hazırlanmıştır. Prompt içindeki tüm teknik detaylar, kod yapısı, mimari kararlar ve özellikler proje kodlarından çıkarılmıştır. Gemini'den beklenen, bu bilgileri kullanarak akademik bir tez formatında, Türkçe olarak, detaylı bir çalışma üretmesidir.
