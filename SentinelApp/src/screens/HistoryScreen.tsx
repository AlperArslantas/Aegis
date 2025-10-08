/**
 * Sentinel App - History Sayfası
 * Geçmiş kayıtları ve olayları görüntüleme
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import {
  HistoryItem,
  FilterButton,
  SearchBar,
  EmptyState,
} from '../components/HistoryComponents';
import BottomNavigation from '../components/BottomNavigation';

interface HistoryScreenProps {
  onTabChange?: (tab: 'home' | 'history' | 'settings') => void;
}

interface HistoryRecord {
  id: string;
  type: 'door' | 'motion' | 'fire' | 'sensor';
  title: string;
  description: string;
  timestamp: string;
  imageUrl?: string;
  status: 'success' | 'warning' | 'danger';
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ onTabChange }) => {
  // State yönetimi
  const [currentTab, setCurrentTab] = useState<'home' | 'history' | 'settings'>('history');
  const [activeFilter, setActiveFilter] = useState<'all' | 'door' | 'motion' | 'fire' | 'sensor'>('all');
  const [searchText, setSearchText] = useState('');

  // Mock geçmiş verileri
  const [historyData] = useState<HistoryRecord[]>([
    {
      id: '1',
      type: 'door',
      title: 'Kapı Zili Çağrısı',
      description: 'Ön kapıdan gelen çağrı',
      timestamp: 'Bugün, 14:30',
      imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&w=400&q=80',
      status: 'success',
    },
    {
      id: '2',
      type: 'motion',
      title: 'Hareket Algılandı',
      description: 'Bahçede hareket tespit edildi',
      timestamp: 'Bugün, 12:15',
      imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&w=400&q=80',
      status: 'warning',
    },
    {
      id: '3',
      type: 'fire',
      title: 'Yangın Tespit Uyarısı',
      description: 'Mutfakta duman algılandı',
      timestamp: 'Dün, 18:45',
      status: 'danger',
    },
    {
      id: '4',
      type: 'sensor',
      title: 'Sıcaklık Uyarısı',
      description: 'Sıcaklık 30°C üzerine çıktı',
      timestamp: 'Dün, 16:20',
      status: 'warning',
    },
    {
      id: '5',
      type: 'door',
      title: 'Kapı Açıldı',
      description: 'Ön kapı uzaktan açıldı',
      timestamp: 'Dün, 15:30',
      imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&w=400&q=80',
      status: 'success',
    },
    {
      id: '6',
      type: 'motion',
      title: 'Hareket Algılandı',
      description: 'Garajda hareket tespit edildi',
      timestamp: '2 gün önce, 22:10',
      imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&w=400&q=80',
      status: 'success',
    },
    {
      id: '7',
      type: 'sensor',
      title: 'Nem Uyarısı',
      description: 'Nem seviyesi %70 üzerine çıktı',
      timestamp: '3 gün önce, 14:00',
      status: 'warning',
    },
    {
      id: '8',
      type: 'fire',
      title: 'Yangın Tespit Testi',
      description: 'Otomatik yangın tespit testi başarılı',
      timestamp: '3 gün önce, 10:00',
      status: 'success',
    },
  ]);

  // Event handlers
  const handleTabPress = (tab: 'home' | 'history' | 'settings') => {
    setCurrentTab(tab);
    onTabChange?.(tab);
    console.log('Tab pressed:', tab);
  };

  const handleFilterPress = (filter: 'all' | 'door' | 'motion' | 'fire' | 'sensor') => {
    setActiveFilter(filter);
  };

  const handleHistoryItemPress = (item: HistoryRecord) => {
    console.log('History item pressed:', item);
  };

  // Filtrelenmiş veri
  const filteredData = historyData.filter(item => {
    const matchesFilter = activeFilter === 'all' || item.type === activeFilter;
    const matchesSearch = searchText === '' || 
      item.title.toLowerCase().includes(searchText.toLowerCase()) ||
      item.description.toLowerCase().includes(searchText.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Geçmiş</Text>
        <Text style={styles.headerSubtitle}>Tüm olaylar ve kayıtlar</Text>
      </View>

      {/* Arama Çubuğu */}
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Olayları ara..."
      />

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
          title="Hareket"
          isActive={activeFilter === 'motion'}
          onPress={() => handleFilterPress('motion')}
          icon="🚶"
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
      {filteredData.length > 0 ? (
        <FlatList
          data={filteredData}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          style={styles.historyList}
          contentContainerStyle={styles.historyContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState
          title="Kayıt Bulunamadı"
          description="Seçilen filtreye uygun kayıt bulunamadı. Farklı bir filtre deneyin."
          icon="📭"
        />
      )}

      {/* Alt Navigasyon */}
      <BottomNavigation
        currentTab={currentTab}
        onTabPress={handleTabPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary,
  },
  headerTitle: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
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
    flex: 1,
  },
  historyContent: {
    paddingTop: Spacing.xs,
    paddingBottom: 20,
  },
});

export default HistoryScreen;
