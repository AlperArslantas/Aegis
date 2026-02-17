/**
 * AegisApp - History Sayfası
 * Geçmiş kayıtları ve olayları görüntüleme
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Typography, Spacing, BorderRadius } from '../constants/theme';
import { useTheme } from '../utils/themeContext';
import {
  HistoryItem,
  FilterButton,
  EmptyState,
} from '../components/HistoryComponents';
import BottomNavigation from '../components/BottomNavigation';
import HistoryDetailModal from '../components/HistoryDetailModal';
import apiService from '../utils/apiService';

const API_BASE_URL = 'http://172.20.10.3:3000';

interface HistoryScreenProps {
  onTabChange?: (tab: 'home' | 'history' | 'settings') => void;
  initialNotificationData?: {
    type: 'yangin' | 'acil';
    data: any;
  };
}

interface HistoryRecord {
  id: string;
  type: 'door' | 'motion' | 'fire' | 'sensor';
  types?: ('door' | 'motion' | 'fire' | 'sensor')[]; // Çoklu kategori için (birleştirilmiş kayıtlar)
  title: string;
  description: string;
  timestamp: string;
  fullTimestamp?: string; // Tam tarih/saat için
  imageUrl?: string;
  status: 'success' | 'warning' | 'danger';
  // Modal için ek detaylar
  confidence?: number;
  value?: number;
  rawData?: any; // Orijinal backend verisi
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ onTabChange, initialNotificationData }) => {
  // Tema context
  const { theme } = useTheme();
  
  // State yönetimi
  const [currentTab, setCurrentTab] = useState<'home' | 'history' | 'settings'>('history');
  const [activeFilter, setActiveFilter] = useState<'all' | 'door' | 'fire' | 'sensor'>('all');
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoryRecord | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Backend'den gelen birleşik olay verisini HistoryRecord formatına dönüştür
  const convertOlayToHistoryRecord = (olay: any): HistoryRecord | null => {
    try {
      // Tip'ten type'a dönüştür
      let type: 'door' | 'motion' | 'fire' | 'sensor' = 'sensor';
      let title = '';
      let status: 'success' | 'warning' | 'danger' = 'warning';

      // Önce yangın tespiti kontrolü yap
      // Eğer yangin_tespit_edildi === true ise, başlık her zaman "Yangın Tespit Edildi!" olur
      if (olay.yangin_tespit_edildi === true) {
        type = 'fire';
        title = 'Yangın Tespit Edildi!';
        status = 'danger';
      } else {
        // Yangın yoksa (false veya null), tip değerine göre başlık belirle
        switch (olay.tip) {
          case 'YUKSEK_SICAKLIK':
            type = 'sensor';
            title = 'Yüksek Sıcaklık Uyarısı';
            status = 'warning';
            break;
          case 'GAZ_KACAGI':
            type = 'sensor';
            title = 'Gaz Kaçağı Tespiti';
            status = 'danger';
            break;
          case 'YANGIN_TESPITI':
            type = 'sensor';
            title = 'Sıcaklık Seviyesi Aşıldı';
            status = 'warning';
            break;
          case 'GORUNTU_ANALIZI':
            type = 'sensor';
            title = 'Görüntü Analizi';
            status = 'warning';
            break;
          case 'HAREKET':
            type = 'motion';
            title = 'Hareket Algılandı';
            status = 'warning';
            break;
          case 'KAPI_ZILI':
            type = 'door';
            title = 'Kapı Zili Çalındı';
            status = 'success';
            break;
          default:
            type = 'sensor';
            title = olay.tip || 'Acil Durum';
            status = 'warning';
        }
      }

      // Tarihi formatla
      const date = new Date(olay.olusturulma_tarihi);
      // Tam tarih/saat formatı
      const fullTimestamp = date.toLocaleString('tr-TR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      // Kısa format (göreceli)
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let timestamp = '';
      if (diffMins < 1) {
        timestamp = 'Az önce';
      } else if (diffMins < 60) {
        timestamp = `${diffMins} dakika önce`;
      } else if (diffHours < 24) {
        timestamp = `${diffHours} saat önce`;
      } else if (diffDays === 1) {
        timestamp = 'Dün, ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays < 7) {
        timestamp = `${diffDays} gün önce, ` + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      } else {
        timestamp = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + 
                   ', ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      }

      // Fotoğraf URL'i oluştur
      let imageUrl: string | undefined = undefined;
      if (olay.goruntu_yolu) {
        // Göreceli yol varsa, tam URL oluştur
        let cleanPath = olay.goruntu_yolu;
        
        // Eğer tam yol ise, sadece uploads/... kısmını al
        if (cleanPath.includes('uploads/')) {
          const uploadsIndex = cleanPath.indexOf('uploads/');
          cleanPath = cleanPath.substring(uploadsIndex);
        }
        
        // Başındaki / varsa temizle
        cleanPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
        
        imageUrl = `${API_BASE_URL}/${cleanPath}`;
        console.log(`📷 Fotoğraf URL oluşturuldu: ${imageUrl} (Orijinal yol: ${olay.goruntu_yolu})`);
      } else {
        console.log(`⚠️ Olay ${olay.id} için fotoğraf yolu yok`);
      }

      // Açıklama oluştur
      let description = olay.aciklama || '';
      if (olay.tip === 'YANGIN_TESPITI' && olay.guven_seviyesi !== null && olay.guven_seviyesi !== undefined) {
        description = olay.aciklama || `Güven seviyesi: ${(parseFloat(olay.guven_seviyesi) * 100).toFixed(2)}%`;
      }

      // Yangın tespit edildiyse, hem yangın hem sensör filtresinde görünsün
      let types: ('door' | 'motion' | 'fire' | 'sensor')[] = [type];
      if (olay.yangin_tespit_edildi === true) {
        types = ['fire', 'sensor'];
      }

      return {
        id: olay.id.toString(),
        type,
        title,
        description,
        timestamp,
        fullTimestamp,
        imageUrl,
        status,
        value: olay.deger ? parseFloat(olay.deger) : undefined,
        confidence: olay.guven_seviyesi ? parseFloat(olay.guven_seviyesi) : undefined,
        rawData: olay,
        types, // Filtreleme için types array'i
      };
    } catch (error) {
      console.error('Acil durum dönüştürme hatası:', error);
      return null;
    }
  };

  // Backend'den birleşik olayları çek
  const fetchAllHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Birleşik olaylar tablosundan tüm kayıtları çek
      const olaylar = await apiService.getOlaylar(200);
      
      console.log(`📥 Backend'den ${olaylar.length} olay kaydı alındı`);
      console.log(`📋 Olaylar detayı:`, olaylar.map(o => ({ id: o.id, tip: o.tip, deger: o.deger, yangin_tespit_edildi: o.yangin_tespit_edildi })));
      
      // Tüm olayları HistoryRecord formatına dönüştür
      const allRecords = olaylar
        .map((olay, index) => {
          const converted = convertOlayToHistoryRecord(olay);
          if (!converted) {
            console.error(`❌ Olay dönüştürülemedi:`, olay);
          } else {
            console.log(`✅ Olay dönüştürüldü [${index}]:`, { id: converted.id, type: converted.type, title: converted.title, tip: olay.tip });
          }
          return converted;
        })
        .filter((item): item is HistoryRecord => item !== null);
      
      console.log(`✅ Dönüştürülen kayıtlar: ${allRecords.length} olay`);
      
      // Her kayıt için types array'ini set et (birleştirme yok, her kayıt ayrı)
      const recordsWithTypes = allRecords.map(record => ({
        ...record,
        types: record.types || [record.type],
      }));
      
      // Tarihe göre sırala (en yeni önce)
      const sortedData = recordsWithTypes.sort((a, b) => {
        const dateA = a.rawData?.olusturulma_tarihi ? new Date(a.rawData.olusturulma_tarihi).getTime() : 0;
        const dateB = b.rawData?.olusturulma_tarihi ? new Date(b.rawData.olusturulma_tarihi).getTime() : 0;
        return dateB - dateA; // En yeni önce
      });
      
      console.log(`✅ ${sortedData.length} kayıt gösterilecek`);
      console.log(`📋 Kayıtlar detayı:`, sortedData.map(r => ({ id: r.id, type: r.type, title: r.title, types: r.types, status: r.status })));
      const withImageUrls = sortedData.filter(item => item.imageUrl);
      console.log(`📷 ${withImageUrls.length} kayıtta imageUrl var`);
      
      setHistoryData(sortedData);
    } catch (error) {
      console.error('Geçmiş verileri çekilemedi:', error);
      setHistoryData([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Sayfa yüklendiğinde verileri çek
  useEffect(() => {
    fetchAllHistory();
  }, [fetchAllHistory]);

  // Bildirimden gelen veriyi işle
  useEffect(() => {
      if (initialNotificationData) {
      let record: HistoryRecord | null = null;
      
      // Artık tek bir convert fonksiyonu kullanıyoruz
      if (initialNotificationData.data) {
        record = convertOlayToHistoryRecord(initialNotificationData.data);
      }
      
      if (record) {
        // Veriler yüklendikten sonra modalı aç
        fetchAllHistory().then(() => {
          setTimeout(() => {
            setSelectedItem(record);
            setIsModalVisible(true);
          }, 300); // Geçmiş sayfasının yüklenmesi için kısa bir bekleme
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNotificationData]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchAllHistory();
  }, [fetchAllHistory]);

  // Event handlers
  const handleTabPress = (tab: 'home' | 'history' | 'settings') => {
    setCurrentTab(tab);
    onTabChange?.(tab);
    console.log('Tab pressed:', tab);
  };

  const handleFilterPress = (filter: 'all' | 'door' | 'fire' | 'sensor') => {
    setActiveFilter(filter);
  };

  const handleHistoryItemPress = (item: HistoryRecord) => {
    console.log('History item pressed:', item);
    setSelectedItem(item);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedItem(null);
  };

  // Filtrelenmiş veri
  const filteredData = historyData.filter(item => {
    // Çoklu kategorili kayıtlar için types array'i kontrol et
    const matchesFilter = activeFilter === 'all' || 
      item.type === activeFilter || 
      (item.types && item.types.includes(activeFilter));
    
    if (!matchesFilter) {
      console.log(`🔍 Filtreleme: ${item.title} (type: ${item.type}, types: ${JSON.stringify(item.types)}, filter: ${activeFilter}) -> ELENENDİ`);
    }
    
    return matchesFilter;
  });
  
  console.log(`🔍 Filtre: ${activeFilter}, Toplam: ${historyData.length}, Filtrelenmiş: ${filteredData.length}`);

  // Render item
  const renderHistoryItem = ({ item }: { item: HistoryRecord }) => (
    <HistoryItem
      id={item.id}
      type={item.type}
      title={item.title}
      description={item.description}
      timestamp={item.timestamp}
      imageUrl={item.imageUrl}
      status={item.status}
      onPress={() => handleHistoryItemPress(item)}
    />
  );


  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.secondary }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Geçmiş</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Tüm olaylar ve kayıtlar</Text>
      </View>

      {/* İçerik Alanı */}
      <View style={styles.contentContainer}>
        {/* Filtre Butonları */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <FilterButton
            title="Tümü"
            isActive={activeFilter === 'all'}
            onPress={() => handleFilterPress('all')}
            icon="📋"
          />
          <FilterButton
            title="Kapı"
            isActive={activeFilter === 'door'}
            onPress={() => handleFilterPress('door')}
            icon="🚪"
          />
          <FilterButton
            title="Yangın"
            isActive={activeFilter === 'fire'}
            onPress={() => handleFilterPress('fire')}
            icon="🔥"
          />
          <FilterButton
            title="Sensör"
            isActive={activeFilter === 'sensor'}
            onPress={() => handleFilterPress('sensor')}
            icon="🌡️"
          />
        </ScrollView>

        {/* Geçmiş Listesi */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Veriler yükleniyor...
            </Text>
          </View>
        ) : filteredData.length > 0 ? (
          <FlatList
            data={filteredData}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            style={styles.historyList}
            contentContainerStyle={styles.historyContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          />
        ) : (
          <EmptyState
            title="Kayıt Bulunamadı"
            description="Seçilen filtreye uygun kayıt bulunamadı. Farklı bir filtre deneyin."
            icon="📭"
          />
        )}
      </View>

      {/* Alt Navigasyon */}
      <BottomNavigation
        currentTab={currentTab}
        onTabPress={handleTabPress}
      />

      {/* Detay Modal */}
      <HistoryDetailModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        data={selectedItem || null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.bold,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.base,
  },
  contentContainer: {
    flex: 1,
  },
  filterContainer: {
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  filterContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  historyList: {
    height: 550,
  },
  historyContent: {
    paddingTop: Spacing.xs,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.base,
  },
});

export default HistoryScreen;
