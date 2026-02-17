-- Acil Durumlar Tablosu
-- Bu tablo genel acil durum bilgilerini tutar (sıcaklık, gaz kaçağı, vb.)
CREATE TABLE IF NOT EXISTS acil_durumlar (
    id SERIAL PRIMARY KEY,
    tip VARCHAR(50) NOT NULL,              -- Örn: 'YUKSEK_SICAKLIK', 'GAZ_KACAGI', 'HAREKET'
    deger DECIMAL(10,2),                    -- Örn: 35.5 (Sıcaklık) veya 100 (Gaz var)
    aciklama TEXT,                          -- Detaylı açıklama
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler (performans için)
CREATE INDEX IF NOT EXISTS idx_acil_durumlar_tip ON acil_durumlar(tip);
CREATE INDEX IF NOT EXISTS idx_acil_durumlar_tarih ON acil_durumlar(olusturulma_tarihi DESC);

-- Açıklama
COMMENT ON TABLE acil_durumlar IS 'Genel acil durum kayıtları (sıcaklık, gaz kaçağı, vb.)';
COMMENT ON COLUMN acil_durumlar.tip IS 'Acil durum tipi (YUKSEK_SICAKLIK, GAZ_KACAGI, HAREKET, vb.)';
COMMENT ON COLUMN acil_durumlar.deger IS 'Acil durum değeri (ör. sıcaklık: 35.5, gaz: 100)';
