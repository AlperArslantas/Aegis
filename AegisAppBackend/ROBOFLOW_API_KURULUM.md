# 🔥 Roboflow API Kurulum Rehberi

## Önemli

Roboflow API kullanarak yangın tespiti yapıyoruz. Model indirmeye gerek yok, API üzerinden çalışıyor.

## Kurulum

### 1. Python Paketi Yükleme

```bash
pip install inference-sdk
```

veya

```bash
pip3 install inference-sdk
```

### 2. API Ayarları

API key ve model ID zaten kodda tanımlı. Eğer kendi Roboflow hesabınızı kullanmak isterseniz:

`.env` dosyasına ekleyin:

```env
USE_ROBOFLOW_API=true
ROBOFLOW_API_KEY=your_api_key_here
ROBOFLOW_MODEL_ID=your_model_id_here
```

**Mevcut Ayarlar:**
- API Key: `1hiCMEo32b7WdVqwKGV8`
- Model ID: `fire-detection-n4dzj/1`
- API URL: `https://serverless.roboflow.com`

### 3. Test

```bash
python3 detect_fire.py test_image.jpg
```

## Avantajlar

✅ Model indirmeye gerek yok
✅ Her zaman güncel model kullanılıyor
✅ Sunucu tarafında işlem yapılıyor
✅ Daha hızlı başlangıç

## Dezavantajlar

⚠️ İnternet bağlantısı gerekiyor
⚠️ API limitleri olabilir (ücretsiz hesaplarda)
⚠️ Görüntü API'ye gönderiliyor (privacy dikkat)

## Kendi API Key'inizi Kullanmak İsterseniz

1. https://roboflow.com adresine gidin
2. Hesap oluşturun veya giriş yapın
3. Settings → API Keys bölümünden API key'inizi kopyalayın
4. Model sayfasından Model ID'nizi kopyalayın
5. `.env` dosyasına ekleyin

## Sorun Giderme

- **Import hatası**: `pip install inference-sdk` komutunu çalıştırın
- **API hatası**: API key'in doğru olduğundan emin olun
- **Bağlantı hatası**: İnternet bağlantınızı kontrol edin
