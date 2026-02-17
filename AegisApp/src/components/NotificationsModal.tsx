/**
 * AegisApp - Bildirimler Modal Bileşeni
 * Sağ üst bildirim ikonundan açılan modal
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../utils/themeContext';
import apiService from '../utils/apiService';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'door' | 'sensor' | 'system' | 'alert' | 'fire';
  isRead: boolean;
  rawData?: any; // Orijinal backend verisi (yangın tespiti veya acil durum)
  notificationType?: 'yangin' | 'acil'; // Bildirim tipi
}

interface NotificationsModalProps {
  isVisible: boolean;
  onClose: () => void;
  onNotificationPress?: (notificationId: string, notificationType: 'yangin' | 'acil', notificationData: any) => void;
  onUnreadCountChange?: (count: number) => void; // Görülmemiş bildirim sayısı değiştiğinde çağrılır
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isVisible,
  onClose,
  onNotificationPress,
  onUnreadCountChange,
}) => {
  const { theme } = useTheme();
  const translateY = new Animated.Value(isVisible ? 0 : -300);
  const opacity = new Animated.Value(isVisible ? 1 : 0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Backend'den bildirimleri çek
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Birleşik olaylar tablosundan tüm kayıtları çek
      const olaylar = await apiService.getOlaylar(40);

      // Tüm olayları Notification formatına dönüştür
      const notificationList: Notification[] = [];

      // Olayları ekle
      olaylar.forEach((olay: any) => {
        const date = new Date(olay.olusturulma_tarihi);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let timeStr = '';
        if (diffMins < 1) {
          timeStr = 'Az önce';
        } else if (diffMins < 60) {
          timeStr = `${diffMins} dakika önce`;
        } else if (diffHours < 24) {
          timeStr = `${diffHours} saat önce`;
        } else if (diffDays === 1) {
          timeStr = 'Dün';
        } else if (diffDays < 7) {
          timeStr = `${diffDays} gün önce`;
        } else {
          timeStr = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
        }

        // Tip'e göre notification type belirle
        let notificationType: 'yangin' | 'acil' = 'acil';
        let notifType: 'fire' | 'sensor' | 'door' | 'motion' | 'system' | 'alert' = 'alert';
        let title = '';
        
        if (olay.tip === 'YANGIN_TESPITI') {
          notificationType = 'yangin';
          notifType = 'fire';
          title = olay.yangin_tespit_edildi ? '🔥 Yangın Tespit Edildi!' : 'Yangın Tespiti (Negatif)';
        } else if (olay.tip === 'YUKSEK_SICAKLIK') {
          notifType = 'sensor';
          title = '🌡️ Yüksek Sıcaklık Uyarısı';
        } else if (olay.tip === 'GAZ_KACAGI') {
          notifType = 'alert';
          title = '⚠️ Gaz Kaçağı Tespiti';
        } else {
          notifType = 'alert';
          title = olay.tip || 'Acil Durum';
        }

        notificationList.push({
          id: `${notificationType}-${olay.id}`,
          title,
          message: olay.aciklama || (olay.tip === 'YANGIN_TESPITI' && olay.guven_seviyesi ? `Güven seviyesi: ${(parseFloat(olay.guven_seviyesi) * 100).toFixed(2)}%` : ''),
          time: timeStr,
          type: notifType,
          isRead: false,
          rawData: olay,
          notificationType,
        });
      });

      // Tarihe göre sırala (en yeni önce)
      notificationList.sort((a, b) => {
        // Basit sıralama - time string'ine göre değil, kayıt ID'sine göre (en yeni önce)
        return parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1]);
      });

      const finalNotifications = notificationList.slice(0, 20); // En son 20 bildirimi göster
      setNotifications(finalNotifications);
      
      // Görülmemiş bildirim sayısını hesapla ve parent'a bildir (modal açık değilse)
      if (!isVisible && onUnreadCountChange) {
        const unreadCount = finalNotifications.filter(n => !n.isRead).length;
        onUnreadCountChange(unreadCount);
      }
    } catch (error) {
      console.error('Bildirimler getirilemedi:', error);
      setNotifications([]);
      if (onUnreadCountChange) {
        onUnreadCountChange(0);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [onUnreadCountChange]);

  // Modal açıldığında bildirimleri çek
  useEffect(() => {
    if (isVisible) {
      fetchNotifications();
    }
  }, [isVisible, fetchNotifications]);

  // Modal açıldığında tüm bildirimleri görüldü olarak işaretle
  useEffect(() => {
    if (isVisible && onUnreadCountChange) {
      // Modal açıldığında tüm bildirimleri görüldü say
      onUnreadCountChange(0);
      // Mevcut bildirimleri de görüldü olarak işaretle
      setNotifications(prevNotifications => 
        prevNotifications.map(n => ({ ...n, isRead: true }))
      );
    }
  }, [isVisible, onUnreadCountChange]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: isVisible ? 0 : -300,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: isVisible ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isVisible]);

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'door':
        return '🚪';
      case 'sensor':
        return '🌡️';
      case 'system':
        return '⚙️';
      case 'alert':
        return '🚨';
      case 'fire':
        return '🔥';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'door':
        return theme.colors.orange;
      case 'sensor':
        return theme.colors.warning;
      case 'system':
        return theme.colors.info;
      case 'alert':
        return theme.colors.danger;
      default:
        return theme.colors.textSecondary;
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { backgroundColor: theme.colors.overlay, opacity }]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Modal */}
      <Animated.View
        style={[
          styles.modal,
          {
            backgroundColor: theme.colors.surface,
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.secondary }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Bildirimler</Text>
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.colors.secondary }]} onPress={onClose}>
            <Text style={[styles.closeIcon, { color: theme.colors.text }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        <ScrollView 
          style={styles.notificationsList} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {isLoading && notifications.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Bildirimler yükleniyor...
              </Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Bildirim bulunamadı
              </Text>
            </View>
          ) : (
            notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                { borderBottomColor: theme.colors.secondary },
                !notification.isRead && styles.unreadNotification,
              ]}
              onPress={() => {
                console.log('🔔 Bildirim tıklandı:', notification.id, notification.notificationType, notification.rawData ? 'Veri var' : 'Veri yok');
                if (onNotificationPress && notification.rawData && notification.notificationType) {
                  console.log('✅ onNotificationPress çağrılıyor...');
                  onNotificationPress(notification.id, notification.notificationType, notification.rawData);
                  onClose();
                } else {
                  console.log('⚠️ onNotificationPress eksik veya veri eksik:', {
                    hasOnNotificationPress: !!onNotificationPress,
                    hasRawData: !!notification.rawData,
                    hasNotificationType: !!notification.notificationType
                  });
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.notificationIcon, { backgroundColor: getNotificationColor(notification.type) }]}>
                <Text style={styles.iconText}>
                  {getNotificationIcon(notification.type)}
                </Text>
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>{notification.title}</Text>
                <Text style={[styles.notificationMessage, { color: theme.colors.textSecondary }]}>{notification.message}</Text>
                <Text style={[styles.notificationTime, { color: theme.colors.textMuted }]}>{notification.time}</Text>
              </View>
              {!notification.isRead && (
                <View
                  style={[
                    styles.unreadDot,
                    { backgroundColor: getNotificationColor(notification.type) },
                  ]}
                />
              )}
            </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: theme.colors.secondary }]}>
          <TouchableOpacity style={styles.clearAllButton}>
            <Text style={[styles.clearAllText, { color: theme.colors.orange }]}>Tümünü Temizle</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  overlayTouchable: {
    flex: 1,
  },
  modal: {
    position: 'absolute',
    top: 60,
    right: Spacing.md,
    left: Spacing.md,
    borderRadius: BorderRadius.lg,
    maxHeight: 400,
    zIndex: 1000,
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
  notificationsList: {
    maxHeight: 300,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  unreadNotification: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconText: {
    fontSize: Typography.lg,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: Typography.sm,
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: Typography.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  clearAllButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  clearAllText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.sm,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: Typography.sm,
  },
});

export default NotificationsModal;
