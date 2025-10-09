/**
 * AegisApp - Yan Sidebar Navbar Bileşeni
 * Sol üst hamburger menüden açılan yan navbar
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface SidebarNavbarProps {
  isVisible: boolean;
  onClose: () => void;
  onMenuItemPress: (menuItem: string) => void;
}

const { width } = Dimensions.get('window');

const SidebarNavbar: React.FC<SidebarNavbarProps> = ({
  isVisible,
  onClose,
  onMenuItemPress,
}) => {
  // Menü öğeleri
  const menuItems = [
    { id: 'dashboard', title: 'Ana Panel', icon: '🏠' },
    { id: 'cameras', title: 'Kameralar', icon: '📹' },
    { id: 'sensors', title: 'Sensörler', icon: '🌡️' },
    { id: 'history', title: 'Geçmiş', icon: '📋' },
    { id: 'alerts', title: 'Uyarılar', icon: '🚨' },
    { id: 'users', title: 'Kullanıcılar', icon: '👥' },
    { id: 'settings', title: 'Ayarlar', icon: '⚙️' },
    { id: 'profile', title: 'Profil', icon: '👤' },
    { id: 'help', title: 'Yardım', icon: '❓' },
  ];

  // Performans odaklı animasyon değerleri
  const translateX = new Animated.Value(-width * 0.7);
  const overlayOpacity = new Animated.Value(0);
  const contentOpacity = new Animated.Value(0);
  
  // Menü öğeleri için basit fade animasyonları
  const menuItemOpacities = menuItems.map(() => new Animated.Value(0));

  React.useEffect(() => {
    if (isVisible) {
      // Basit ve performanslı açılma animasyonu
      Animated.parallel([
        // Sidebar kayarak açılır
        Animated.timing(translateX, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        // Overlay fade-in
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Sidebar açıldıktan sonra içerik fade-in
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          // Menü öğeleri teker teker fade-in (performanslı staggered)
          const staggerDelay = 100; // 100ms gecikme
          menuItemOpacities.forEach((opacity, index) => {
            Animated.timing(opacity, {
              toValue: 1,
              duration: 200,
              delay: index * staggerDelay,
              useNativeDriver: true,
            }).start();
          });
        });
      });
    } else {
      // Kapanma animasyonu - hızlı ve basit
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -width * 0.7,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        // Menü öğelerini hızla gizle
        Animated.parallel(menuItemOpacities.map(opacity =>
          Animated.timing(opacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          })
        )),
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <Animated.View style={{ opacity: contentOpacity, flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoSymbol}>🛡️</Text>
              </View>
              <Text style={styles.appTitle}>AegisApp</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <Animated.View
                key={item.id}
                style={{ opacity: menuItemOpacities[index] }}
              >
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onMenuItemPress(item.id);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuText}>{item.title}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.versionText}>v1.0.0</Text>
            <Text style={styles.copyrightText}>© 2024 AegisApp</Text>
          </View>
        </Animated.View>
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
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.7, // Daha dar genişlik
    backgroundColor: Colors.surface,
    zIndex: 1000,
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  logoSymbol: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  appTitle: {
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
  menuContainer: {
    flex: 1,
    paddingTop: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary,
  },
  menuIcon: {
    fontSize: Typography.lg,
    marginRight: Spacing.md,
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    fontSize: Typography.base,
    color: Colors.text,
    fontWeight: Typography.medium,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary,
  },
  versionText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  copyrightText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

export default SidebarNavbar;
