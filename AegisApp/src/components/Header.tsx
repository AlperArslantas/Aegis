/**
 * AegisApp - Header Bileşeni
 * Üst kısımda logo, menü butonları ve bildirimler
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Typography, Spacing } from '../constants/theme';
import { useTheme } from '../utils/themeContext';

interface HeaderProps {
  onMenuPress: () => void;
  onNotificationPress: () => void;
}

export default function Header({ onMenuPress, onNotificationPress }: HeaderProps) {
  const { theme } = useTheme();
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Sol menü butonu */}
        <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
          <View style={styles.menuIcon}>
            <View style={[styles.menuLine, { backgroundColor: theme.colors.text }]} />
            <View style={[styles.menuLine, { backgroundColor: theme.colors.text }]} />
            <View style={[styles.menuLine, { backgroundColor: theme.colors.text }]} />
          </View>
        </TouchableOpacity>

        {/* Logo ve uygulama adı */}
        <View style={styles.logoContainer}>
          <View style={[styles.logoIcon, { backgroundColor: theme.colors.orange }]}>
            <Text style={styles.logoSymbol}>🛡️</Text>
          </View>
          <Text style={[styles.appTitle, { color: theme.colors.text }]}>AegisApp</Text>
        </View>

        {/* Sağ bildirim butonu */}
        <TouchableOpacity style={styles.notificationButton} onPress={onNotificationPress}>
          <View style={styles.notificationIcon}>
            <View style={[styles.notificationDot, { backgroundColor: theme.colors.danger }]} />
            <View style={[styles.notificationBell, { borderColor: theme.colors.text }]} />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    // backgroundColor will be set dynamically
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    width: 20,
    height: 16,
    justifyContent: 'space-between',
  },
  menuLine: {
    height: 2,
    borderRadius: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  logoSymbol: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },
  appTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
  },
  notificationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationBell: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
});

// keep default export above
