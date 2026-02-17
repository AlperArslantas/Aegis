-- Birleşik Olaylar Tablosu
-- Bu tablo tüm acil durum ve yangın tespiti kayıtlarını tutar
CREATE TABLE IF NOT EXISTS olaylar (
    id SERIAL PRIMARY KEY,
    tip VARCHAR(50) NOT NULL,                      -- Örn: 'YUKSEK_SICAKLIK', 'GAZ_KACAGI', 'YANGIN_TESPITI', 'HAREKET'
    deger DECIMAL(10,2),                          -- Örn: 35.5 (Sıcaklık) veya 100 (Gaz var) - NULL olabilir
    yangin_tespit_edildi BOOLEAN,                 -- NULL olabilir, sadece yangın tespiti için true/false
    guven_seviyesi DECIMAL(5,4),                  -- 0.0000 - 1.0000 arası güven seviyesi - NULL olabilir, sadece yangın tespiti için
    aciklama TEXT,                                -- Detaylı açıklama
    goruntu_yolu VARCHAR(500),                    -- Analiz edilen görüntünün yolu (opsiyonel)
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler (performans için)
CREATE INDEX IF NOT EXISTS idx_olaylar_tip ON olaylar(tip);
CREATE INDEX IF NOT EXISTS idx_olaylar_tarih ON olaylar(olusturulma_tarihi DESC);
CREATE INDEX IF NOT EXISTS idx_olaylar_yangin ON olaylar(yangin_tespit_edildi) WHERE yangin_tespit_edildi IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_olaylar_guven ON olaylar(guven_seviyesi DESC) WHERE guven_seviyesi IS NOT NULL;

-- Açıklama
COMMENT ON TABLE olaylar IS 'Tüm acil durum ve yangın tespiti kayıtları - Birleşik tablo';
COMMENT ON COLUMN olaylar.tip IS 'Olay tipi (YUKSEK_SICAKLIK, GAZ_KACAGI, YANGIN_TESPITI, HAREKET, vb.)';
COMMENT ON COLUMN olaylar.deger IS 'Olay değeri (ör. sıcaklık: 35.5, gaz: 100) - NULL olabilir';
COMMENT ON COLUMN olaylar.yangin_tespit_edildi IS 'Yangın tespit edildi mi? (true/false) - NULL olabilir, sadece yangın tespiti için';
COMMENT ON COLUMN olaylar.guven_seviyesi IS 'Tespit güven seviyesi (0.0 - 1.0 arası) - NULL olabilir, sadece yangın tespiti için';
COMMENT ON COLUMN olaylar.goruntu_yolu IS 'Analiz edilen görüntünün dosya yolu';
