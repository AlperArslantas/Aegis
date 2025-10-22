# Aegis App Backend

Akıllı kapı zili ve yangın tespit sistemi için Node.js backend uygulaması. Raspberry Pi üzerinde çalışacak şekilde tasarlanmıştır.

## 🏗️ Mimari

Bu proje **Layered Architecture + Unit of Work + Repository Pattern** kullanarak SOLID prensiplerine uygun olarak geliştirilmiştir.

### Katmanlar

- **Controllers**: HTTP request/response handling
- **Services**: Business logic ve use case implementations
- **Repositories**: Data access layer
- **Infrastructure**: External services (GPIO, Database, etc.)
- **Interfaces**: Contract definitions

### Design Patterns

- **Dependency Injection**: Bağımlılık yönetimi için IoC Container
- **Unit of Work**: Transaction yönetimi
- **Repository Pattern**: Data access abstraction
- **Factory Pattern**: Object creation
- **Observer Pattern**: Event handling (Socket.IO)

## 🚀 Özellikler

### Sensör Yönetimi
- Sıcaklık, nem, hava kalitesi sensörleri
- Yangın tespit sistemi
- Hareket sensörü
- Gerçek zamanlı veri akışı
- Sensör kalibrasyonu

### Kapı Kontrolü
- Kapı kilidi kontrolü
- Kapı zili yönetimi
- Çağrı geçmişi
- Güvenlik durumu kontrolü

### Video Yönetimi
- Canlı video stream
- Video kayıt sistemi
- Kayıt arşivleme

### Güvenlik
- JWT tabanlı authentication
- CORS koruması
- Rate limiting
- Input validation

## 🛠️ Teknolojiler

- **Node.js** + **TypeScript**
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **SQLite** - Database (development)
- **Winston** - Logging
- **Joi** - Validation
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT tokens

## 📦 Kurulum

### Gereksinimler
- Node.js >= 18.0.0
- npm veya yarn

### Adımlar

1. **Bağımlılıkları yükle:**
```bash
npm install
```

2. **Environment variables ayarla:**
```bash
cp env.example .env
# .env dosyasını düzenle
```

3. **TypeScript'i derle:**
```bash
npm run build
```

4. **Uygulamayı başlat:**
```bash
# Development
npm run dev

# Production
npm start
```

## 🔧 Konfigürasyon

### Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_TYPE=sqlite
DB_DATABASE=./data/aegis.db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# GPIO (Mock mode for development)
GPIO_MODE=mock
GPIO_SENSOR_PIN=18
GPIO_DOOR_LOCK_PIN=23
GPIO_DOOR_BELL_PIN=24

# Video
VIDEO_STREAM_URL=rtsp://localhost:8554/stream
VIDEO_RECORDING_PATH=./recordings

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:8081
```

## 📡 API Endpoints

### Sensör API'leri

```http
GET    /api/sensors/current          # Güncel sensör verileri
POST   /api/sensors/read             # Yeni sensör verisi oku
GET    /api/sensors/history          # Sensör geçmişi
POST   /api/sensors/calibrate        # Sensör kalibrasyonu
GET    /api/sensors/health           # Sensör sağlık durumu
```

### Kapı API'leri

```http
GET    /api/door/status              # Kapı durumu
POST   /api/door/unlock              # Kapıyı aç
POST   /api/door/lock                # Kapıyı kilitle
POST   /api/door/ring                # Kapı zilini çal
GET    /api/door/calls               # Cevaplanmamış çağrılar
POST   /api/door/calls/:id/answer    # Çağrıyı cevapla
GET    /api/door/events              # Kapı olayları
GET    /api/door/security            # Güvenlik durumu
```

### Health Check

```http
GET    /health                       # Sistem durumu
```

## 🔌 WebSocket Events

### Client → Server
```javascript
socket.emit('subscribe-sensors');    // Sensör güncellemelerini dinle
socket.emit('subscribe-door');       // Kapı olaylarını dinle
```

### Server → Client
```javascript
socket.on('sensor-update', (data) => {
  // Sensör verisi güncellemesi
});

socket.on('door-event', (data) => {
  // Kapı olayı (zil, kilit, vb.)
});

socket.on('fire-alarm', (data) => {
  // Yangın alarmı
});
```

## 🧪 Test

```bash
# Tüm testleri çalıştır
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 📝 Development

### Mock Mode

Raspberry Pi gelmeden önce mock servislerle development yapabilirsiniz:

```typescript
// Mock GPIO Service
const mockGPIO = new MockGPIOService();
await mockGPIO.readPin(18); // Rastgele değer döndürür
```

### Real Hardware Integration

Raspberry Pi geldiğinde mock servisleri gerçek implementasyonlarla değiştirin:

```typescript
// Real GPIO Service
const realGPIO = new RealGPIOService();
await realGPIO.readPin(18); // Gerçek GPIO okuma
```

## 🚀 Deployment

### Raspberry Pi'de Çalıştırma

1. **Node.js yükle:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **GPIO kütüphaneleri:**
```bash
npm install rpi-gpio johnny-five
```

3. **PM2 ile çalıştır:**
```bash
npm install -g pm2
pm2 start dist/index.js --name aegis-backend
pm2 startup
pm2 save
```

## 📊 Monitoring

### Logs
```bash
# PM2 logs
pm2 logs aegis-backend

# File logs
tail -f logs/combined.log
```

### Health Check
```bash
curl http://localhost:3000/health
```

## 🔒 Güvenlik

- HTTPS kullanın (Let's Encrypt)
- JWT secret'ı güçlü tutun
- Rate limiting aktif
- Input validation
- CORS ayarları

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🆘 Destek

Sorunlar için [Issues](https://github.com/your-repo/issues) sayfasını kullanın.

## 📚 Ek Kaynaklar

- [Raspberry Pi GPIO Documentation](https://www.raspberrypi.org/documentation/usage/gpio/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
