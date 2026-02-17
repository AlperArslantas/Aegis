/**
 * AegisApp - History Detail Modal Bileşeni
 * Geçmiş kayıtlarının detaylarını gösteren modal
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../utils/themeContext';

interface HistoryDetailData {
  id: string;
  type: 'door' | 'motion' | 'fire' | 'sensor';
  title: string;
  description: string;
  timestamp: string;
  fullTimestamp?: string;
  imageUrl?: string;
  status: 'success' | 'warning' | 'danger';
  // Ek detaylar
  confidence?: number;
  value?: number;
  source?: string;
  rawData?: any; // Orijinal backend verisi
}

interface HistoryDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  data: HistoryDetailData | null;
}

const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({
  isVisible,
  onClose,
  data,
}) => {
  const { theme } = useTheme();
  const [isImageViewerVisible, setIsImageViewerVisible] = React.useState(false);

  if (!data || !isVisible) return null;

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'door':
        return '🚪';
      case 'motion':
        return '🚶';
      case 'fire':
        return '🔥';
      case 'sensor':
        return '🌡️';
      default:
        return '📋';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'danger':
        return theme.colors.danger;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'door':
        return 'Kapı';
      case 'motion':
        return 'Hareket';
      case 'fire':
        return 'Yangın Tespiti';
      case 'sensor':
        return 'Sensör';
      default:
        return 'Bilinmeyen';
    }
  };

  // RawData'dan ek bilgileri çıkar
  const rawData = data.rawData || {};
  const isYanginTespiti = data.type === 'fire';
  const isAcilDurum = data.type === 'sensor' && rawData.tip;
  const eventType = isYanginTespiti ? 'Yangın Tespiti' : isAcilDurum ? rawData.tip || 'Acil Durum' : getTypeLabel(data.type);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.modal,
            {
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.secondary }]}>
            <View style={[styles.iconContainer, { backgroundColor: getStatusColor(data.status) }]}>
              <Text style={styles.iconText}>{getTypeIcon(data.type)}</Text>
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: theme.colors.text }]}>{data.title}</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                {data.fullTimestamp || data.timestamp}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.colors.secondary }]}
              onPress={onClose}
            >
              <Text style={[styles.closeIcon, { color: theme.colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Fotoğraf */}
            {data.imageUrl && (
              <TouchableOpacity
                style={styles.imageContainer}
                activeOpacity={0.9}
                onPress={() => setIsImageViewerVisible(true)}
              >
                <Image
                  source={{ uri: data.imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={(error) => {
                    console.error(`❌ Detay modalında fotoğraf yüklenemedi: ${data.imageUrl}`, error.nativeEvent.error);
                  }}
                />
                <View style={styles.imageOverlay}>
                  <Text style={styles.zoomHint}>🔍 Büyütmek için dokunun</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Detaylar */}
            <View style={styles.detailsContainer}>
              {/* Olay Tipi Bölümü */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>OLAY TİPİ</Text>
                <View style={[styles.sectionContent, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.sectionValue, { color: theme.colors.text }]}>{eventType}</Text>
                </View>
              </View>

              {/* Açıklama Bölümü */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>AÇIKLAMA</Text>
                <View style={[styles.sectionContent, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.descriptionText, { color: theme.colors.text }]}>{data.description}</Text>
                </View>
              </View>

              {/* Güven Seviyesi (Yangın Tespiti için) */}
              {isYanginTespiti && data.confidence !== undefined && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>GÜVEN SEVİYESİ</Text>
                    <Text style={[styles.percentageText, { color: getStatusColor(data.status) }]}>
                      {(data.confidence * 100).toFixed(2)}%
                    </Text>
                  </View>
                  <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.background }]}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${data.confidence * 100}%`,
                          backgroundColor: getStatusColor(data.status),
                        },
                      ]}
                    />
                  </View>
                </View>
              )}

              {/* Sensör Değeri (Acil Durum için) */}
              {isAcilDurum && data.value !== undefined && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>SENSÖR DEĞERİ</Text>
                  <View style={[styles.sectionContent, { backgroundColor: theme.colors.background }]}>
                    <Text style={[styles.sectionValue, { color: theme.colors.text }]}>
                      {data.value.toFixed(2)}
                      {rawData.tip === 'YUKSEK_SICAKLIK' ? '°C' : rawData.tip === 'GAZ_KACAGI' ? ' ppm' : ''}
                    </Text>
                  </View>
                </View>
              )}

              {/* Durum Bölümü */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>DURUM</Text>
                <View style={[styles.sectionContent, { backgroundColor: theme.colors.background }]}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(data.status) }]}>
                    <Text style={styles.statusText}>
                      {data.status === 'danger' ? 'Tehlikeli' : data.status === 'warning' ? 'Uyarı' : 'Normal'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Ek Bilgiler */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>EK BİLGİLER</Text>
                <View style={[styles.infoContainer, { backgroundColor: theme.colors.background }]}>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Kayıt ID</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.text }]}>#{data.id}</Text>
                  </View>
                  {isYanginTespiti && rawData.yangin_tespit_edildi !== undefined && (
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Yangın Tespit Edildi</Text>
                      <Text style={[styles.infoValue, { color: rawData.yangin_tespit_edildi ? theme.colors.danger : theme.colors.success }]}>
                        {rawData.yangin_tespit_edildi ? 'Evet' : 'Hayır'}
                      </Text>
                    </View>
                  )}
                  {isAcilDurum && rawData.tip && (
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Acil Durum Tipi</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                        {rawData.tip === 'YANGIN_TESPITI' && (rawData.yangin_tespit_edildi === false || rawData.yangin_tespit_edildi === null) 
                          ? 'Sıcaklık Artışı' :
                         rawData.tip === 'YUKSEK_SICAKLIK' ? 'Yüksek Sıcaklık' : 
                         rawData.tip === 'GAZ_KACAGI' ? 'Gaz Kaçağı' : 
                         rawData.tip === 'HAREKET' ? 'Hareket' : rawData.tip}
                      </Text>
                    </View>
                  )}
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Tarih/Saat</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.textMuted }]}>
                      {data.fullTimestamp || data.timestamp}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Fullscreen Image Viewer */}
      {data.imageUrl && (
        <Modal
          visible={isImageViewerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsImageViewerVisible(false)}
        >
          <View style={styles.fullscreenContainer}>
            <TouchableOpacity
              style={styles.fullscreenCloseButton}
              onPress={() => setIsImageViewerVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.fullscreenCloseIcon}>✕</Text>
            </TouchableOpacity>
            <Image
              source={{ uri: data.imageUrl }}
              style={styles.fullscreenImage}
              resizeMode="contain"
              onError={(error) => {
                console.error(`❌ Fullscreen fotoğraf yüklenemedi: ${data.imageUrl}`, error.nativeEvent.error);
              }}
            />
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    height: '92%',
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconText: {
    fontSize: 24,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sm,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    fontWeight: Typography.bold,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 350,
    backgroundColor: '#000',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: Spacing.sm,
    alignItems: 'center',
  },
  zoomHint: {
    color: '#fff',
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fullscreenCloseIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: Typography.bold,
  },
  detailsContainer: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  sectionContent: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  sectionValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  descriptionText: {
    fontSize: Typography.base,
    lineHeight: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  percentageText: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  infoContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  infoValue: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
});

export default HistoryDetailModal;
