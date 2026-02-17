/**
 * Database Configuration
 * Neon PostgreSQL veritabanı bağlantı havuzu
 */

import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Neon PostgreSQL veritabanı bağlantı havuzu
 * SSL bağlantısı zorunlu
 */
let pool: Pool | null = null;

export const getDbPool = (): Pool => {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Connection string'den config objesi oluştur
    const config: PoolConfig = {
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false, // Neon için gerekli
      },
      max: 20, // Maksimum pool bağlantı sayısı
      idleTimeoutMillis: 30000, // Boşta kalan bağlantıları kapatma süresi (30 saniye)
      connectionTimeoutMillis: 5000, // Bağlantı timeout süresi (5 saniye)
    };

    pool = new Pool(config);

    // Bağlantı hatası dinleyicisi
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    // Bağlantı testi
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.error('Database connection test failed:', err);
      } else {
        console.log('Neon database connection established successfully');
      }
    });
  }

  return pool;
};

/**
 * Veritabanı bağlantısını kapat
 */
export const closeDbPool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
};

/**
 * Acil durum kaydı ekle
 * Asenkron olarak çalışır, hata olsa bile ana akışı engellemez
 */
export const insertAcilDurum = async (
  tip: string,
  deger: number,
  aciklama: string,
  goruntuYolu?: string
): Promise<void> => {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📝 Acil durum kaydı başlatılıyor...`);
    console.log(`Tip: ${tip}`);
    console.log(`Değer: ${deger}`);
    console.log(`Açıklama: ${aciklama}`);
    console.log(`Görüntü Yolu: ${goruntuYolu || 'Yok'}`);
    console.log(`${'='.repeat(60)}\n`);
    
    const dbPool = getDbPool();
    const query = `
      INSERT INTO acil_durumlar (tip, deger, aciklama, goruntu_yolu)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    
    const result = await dbPool.query(query, [tip, deger, aciklama, goruntuYolu || null]);
    console.log(`✅✅✅ Acil durum başarıyla kaydedildi: ${tip} - ${aciklama} (ID: ${result.rows[0]?.id}) ✅✅✅`);
  } catch (error: any) {
    // Hata olsa bile ana akışı engelleme - sadece logla
    console.error(`\n${'='.repeat(60)}`);
    console.error('❌❌❌ Acil durum kaydedilirken hata oluştu:');
    console.error('Hata mesajı:', error.message);
    console.error('SQL hatası kodu:', error.code);
    console.error('Hata detayı:', error);
    console.error(`${'='.repeat(60)}\n`);
    throw error; // Hata fırlat ki üstteki catch bloğu yakalayabilsin
  }
};

/**
 * Acil durum kayıtlarını getir
 */
export const getAcilDurumlar = async (
  limit: number = 100,
  tip?: string
): Promise<any[]> => {
  try {
    const dbPool = getDbPool();
    let query = `
      SELECT id, tip, deger, aciklama, goruntu_yolu, 
             (olusturulma_tarihi AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul')::TIMESTAMP AS olusturulma_tarihi
      FROM acil_durumlar
    `;
    const params: any[] = [];
    
    if (tip) {
      query += ` WHERE tip = $1`;
      params.push(tip);
    }
    
    query += ` ORDER BY (olusturulma_tarihi AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul') DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await dbPool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Acil durumlar getirilirken hata oluştu:', error);
    return [];
  }
};

/**
 * Yangın tespiti kaydı ekle (yeni yangin_tespiti tablosuna)
 * Asenkron olarak çalışır, hata olsa bile ana akışı engellemez
 */
export const insertYanginTespiti = async (
  yangin_tespit_edildi: boolean,
  guven_seviyesi: number,
  aciklama: string,
  goruntu_yolu?: string
): Promise<void> => {
  try {
    const dbPool = getDbPool();
    const query = `
      INSERT INTO yangin_tespiti (yangin_tespit_edildi, guven_seviyesi, aciklama, goruntu_yolu)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    
    const result = await dbPool.query(query, [
      yangin_tespit_edildi,
      guven_seviyesi,
      aciklama,
      goruntu_yolu || null
    ]);
    console.log(`✅ Yangın tespiti kaydedildi: ${yangin_tespit_edildi ? 'YANGIN VAR' : 'Yangın yok'} - Güven: ${(guven_seviyesi * 100).toFixed(2)}% (ID: ${result.rows[0]?.id})`);
  } catch (error: any) {
    // Hata olsa bile ana akışı engelleme - sadece logla
    console.error('❌ Yangın tespiti kaydedilirken hata oluştu:', error);
    console.error('Hata detayı:', error.message);
    console.error('SQL hatası:', error.code);
    throw error;
  }
};

/**
 * Yangın tespiti kayıtlarını getir
 */
export const getYanginTespitleri = async (
  limit: number = 50,
  sadece_yangin?: boolean
): Promise<any[]> => {
  try {
    const dbPool = getDbPool();
    let query = `
      SELECT id, yangin_tespit_edildi, guven_seviyesi, aciklama, goruntu_yolu,
             (olusturulma_tarihi AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul')::TIMESTAMP AS olusturulma_tarihi
      FROM yangin_tespiti
    `;
    const params: any[] = [];
    
    if (sadece_yangin === true) {
      query += ` WHERE yangin_tespit_edildi = true`;
    }
    
    query += ` ORDER BY (olusturulma_tarihi AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul') DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await dbPool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Yangın tespitleri getirilirken hata oluştu:', error);
    return [];
  }
};

/**
 * Yangın analiz sonuçlarını getir (eski fonksiyon - geriye uyumluluk için)
 * @deprecated Artık yangin_tespiti tablosunu kullanın
 */
export const getYanginAnalizSonuclari = async (
  limit: number = 50
): Promise<any[]> => {
  return getYanginTespitleri(limit);
};

/**
 * Birleşik olay kaydı ekle (yeni birleşik olaylar tablosuna)
 * Tüm acil durum ve yangın tespiti kayıtları bu tabloya yazılır
 */
export const insertOlay = async (
  tip: string,
  deger?: number,
  yangin_tespit_edildi?: boolean,
  guven_seviyesi?: number,
  aciklama?: string,
  goruntu_yolu?: string
): Promise<number> => {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📝 Olay kaydı başlatılıyor...`);
    console.log(`Tip: ${tip}`);
    console.log(`Değer: ${deger || 'Yok'}`);
    console.log(`Yangın Tespit Edildi: ${yangin_tespit_edildi !== undefined ? yangin_tespit_edildi : 'Yok'}`);
    console.log(`Güven Seviyesi: ${guven_seviyesi !== undefined ? `${(guven_seviyesi * 100).toFixed(2)}%` : 'Yok'}`);
    console.log(`Açıklama: ${aciklama || 'Yok'}`);
    console.log(`Görüntü Yolu: ${goruntu_yolu || 'Yok'}`);
    console.log(`${'='.repeat(60)}\n`);
    
    const dbPool = getDbPool();
    const query = `
      INSERT INTO olaylar (tip, deger, yangin_tespit_edildi, guven_seviyesi, aciklama, goruntu_yolu)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    
    const result = await dbPool.query(query, [
      tip,
      deger || null,
      yangin_tespit_edildi !== undefined ? yangin_tespit_edildi : null,
      guven_seviyesi !== undefined ? guven_seviyesi : null,
      aciklama || null,
      goruntu_yolu || null
    ]);
    
    const insertedId = result.rows[0]?.id;
    console.log(`✅✅✅ Olay başarıyla kaydedildi: ${tip} (ID: ${insertedId}) ✅✅✅`);
    return insertedId;
  } catch (error: any) {
    console.error(`\n${'='.repeat(60)}`);
    console.error('❌❌❌ Olay kaydedilirken hata oluştu:');
    console.error('Hata mesajı:', error.message);
    console.error('SQL hatası kodu:', error.code);
    console.error('Hata detayı:', error);
    console.error(`${'='.repeat(60)}\n`);
    throw error;
  }
};

/**
 * Birleşik olay kayıtlarını getir
 * Tüm acil durum ve yangın tespiti kayıtlarını döndürür
 */
export const getOlaylar = async (
  limit: number = 100,
  tip?: string,
  sadece_yangin?: boolean
): Promise<any[]> => {
  try {
    const dbPool = getDbPool();
    let query = `
      SELECT id, tip, deger, yangin_tespit_edildi, guven_seviyesi, aciklama, goruntu_yolu,
             (olusturulma_tarihi AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul')::TIMESTAMP AS olusturulma_tarihi
      FROM olaylar
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (tip) {
      query += ` AND tip = $${paramIndex}`;
      params.push(tip);
      paramIndex++;
    }
    
    if (sadece_yangin === true) {
      query += ` AND yangin_tespit_edildi = true`;
    }
    
    query += ` ORDER BY (olusturulma_tarihi AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul') DESC LIMIT $${paramIndex}`;
    params.push(limit);
    
    const result = await dbPool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Olaylar getirilirken hata oluştu:', error);
    return [];
  }
};

export default getDbPool;
