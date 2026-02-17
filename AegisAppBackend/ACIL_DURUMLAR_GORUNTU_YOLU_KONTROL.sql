-- Acil Durumlar Tablosunda goruntu_yolu Kolonunu Kontrol Et
-- Bu script, acil_durumlar tablosunda goruntu_yolu kolonunun olup olmadığını kontrol eder

-- 1. Tablo yapısını kontrol et
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'acil_durumlar' 
    AND column_name = 'goruntu_yolu';

-- 2. Eğer kolon yoksa ekle
ALTER TABLE acil_durumlar 
ADD COLUMN IF NOT EXISTS goruntu_yolu VARCHAR(500);

-- 3. Kontrol: Kolon eklendi mi?
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'acil_durumlar' 
    AND column_name = 'goruntu_yolu';
