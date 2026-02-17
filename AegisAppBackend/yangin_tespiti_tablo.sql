-- Yangın Tespiti Tablosu
-- Bu tablo sadece yangın tespit işlemlerini tutar
CREATE TABLE IF NOT EXISTS yangin_tespiti (
    id SERIAL PRIMARY KEY,
    yangin_tespit_edildi BOOLEAN NOT NULL,  -- true: yangın var, false: yangın yok
    guven_seviyesi DECIMAL(5,4) NOT NULL,   -- 0.0000 - 1.0000 arası güven seviyesi
    aciklama TEXT,                           -- Detaylı açıklama
    goruntu_yolu VARCHAR(500),               -- Analiz edilen görüntünün yolu (opsiyonel)
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler (performans için)
CREATE INDEX IF NOT EXISTS idx_yangin_tespiti_tarih ON yangin_tespiti(olusturulma_tarihi DESC);
CREATE INDEX IF NOT EXISTS idx_yangin_tespiti_durum ON yangin_tespiti(yangin_tespit_edildi);
CREATE INDEX IF NOT EXISTS idx_yangin_tespiti_guven ON yangin_tespiti(guven_seviyesi DESC);

-- Açıklama
COMMENT ON TABLE yangin_tespiti IS 'Yangın tespiti analiz sonuçları - YOLO görüntü analizi sonuçları';
COMMENT ON COLUMN yangin_tespiti.yangin_tespit_edildi IS 'Yangın tespit edildi mi? (true/false)';
COMMENT ON COLUMN yangin_tespiti.guven_seviyesi IS 'Tespit güven seviyesi (0.0 - 1.0 arası)';
COMMENT ON COLUMN yangin_tespiti.goruntu_yolu IS 'Analiz edilen görüntünün dosya yolu (geçici dosya olabilir)';
