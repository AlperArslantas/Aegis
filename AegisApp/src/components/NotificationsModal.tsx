/**
 * AegisApp - Bildirimler Modal Bileşeni
 * Sağ üst bildirim ikonundan açılan modal
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'door' | 'sensor' | 'system' | 'alert';
  isRead: boolean;
}

interface NotificationsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isVisible,
  onClose,
}) => {
  const translateY = new Animated.Value(isVisible ? 0 : -300);
  const opacity = new Animated.Value(isVisible ? 1 : 0);

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

  // Mock bildirimler
  const notifications: Notification[] = [
    {
      id: '1',
      title: 'Kapı Çağrısı',
      message: 'Ön kapıdan gelen çağrı',
      time: '2 dakika önce',
      type: 'door',
      isRead: false,
    },
    {
      id: '2',
      title: 'Sıcaklık Uyarısı',
      message: 'Sıcaklık 30°C üzerine çıktı',
      time: '15 dakika önce',
      type: 'sensor',
      isRead: true,
    },
    {
      id: '3',
      title: 'Sistem Güncellemesi',
      message: 'Yeni güvenlik güncellemesi mevcut',
      time: '1 saat önce',
      type: 'system',
      isRead: true,
    },
    {
      id: '4',
      title: 'Güvenlik Uyarısı',
      message: 'Gece saatlerinde hareket tespit edildi',
      time: '2 saat önce',
      type: 'alert',
      isRead: false,
    },
  ];

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
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'door':
        return Colors.orange;
      case 'sensor':
        return Colors.warning;
      case 'system':
        return Colors.info;
      case 'alert':
        return Colors.danger;
      default:
        return Colors.textSecondary;
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity }]}>
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
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Bildirimler</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
          {notifications.map((notification) => (
            <View
              key={notification.id}
              style={[
                styles.notificationItem,
                !notification.isRead && styles.unreadNotification,
              ]}
            >
              <View style={styles.notificationIcon}>
                <Text style={styles.iconText}>
                  {getNotificationIcon(notification.type)}
                </Text>
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
              {!notification.isRead && (
                <View
                  style={[
                    styles.unreadDot,
                    { backgroundColor: getNotificationColor(notification.type) },
                  ]}
                />
              )}
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.clearAllButton}>
            <Text style={styles.clearAllText}>Tümünü Temizle</Text>
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
    backgroundColor: Colors.overlay,
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
    backgroundColor: Colors.surface,
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
    borderBottomColor: Colors.secondary,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: Typography.base,
    color: Colors.text,
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
    borderBottomColor: Colors.secondary,
  },
  unreadNotification: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary,
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
    color: Colors.text,
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
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
    borderTopColor: Colors.secondary,
  },
  clearAllButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  clearAllText: {
    fontSize: Typography.sm,
    color: Colors.orange,
    fontWeight: Typography.medium,
  },
});

export default NotificationsModal;
