-- Acil Durumlar Tablosuna Fotoğraf Yolu Ekleme
-- Bu migration, acil_durumlar tablosuna goruntu_yolu kolonu ekler

ALTER TABLE acil_durumlar 
ADD COLUMN IF NOT EXISTS goruntu_yolu VARCHAR(500);

-- İndeks (opsiyonel - performans için)
-- CREATE INDEX IF NOT EXISTS idx_acil_durumlar_goruntu ON acil_durumlar(goruntu_yolu) WHERE goruntu_yolu IS NOT NULL;

-- Açıklama
COMMENT ON COLUMN acil_durumlar.goruntu_yolu IS 'Acil durum anındaki görüntü yolu (opsiyonel)';
