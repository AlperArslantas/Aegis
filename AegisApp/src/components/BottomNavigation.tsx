/**
 * AegisApp - Alt Navigasyon Bileşeni
 * Home, History, Settings tabları
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface BottomNavigationProps {
  currentTab: 'home' | 'history' | 'settings';
  onTabPress: (tab: 'home' | 'history' | 'settings') => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onTabPress,
}) => {
  const tabs = [
    { key: 'home', label: 'HOME', icon: '🏠' },
    { key: 'history', label: 'HISTORY', icon: '📹' },
    { key: 'settings', label: 'SETTINGS', icon: '⚙️' },
  ] as const;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIcon, isActive && styles.activeTabIcon]}>
                <Text style={styles.iconText}>{tab.icon}</Text>
              </View>
              <Text style={[
                styles.tabLabel,
                isActive && styles.activeTabLabel,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.surface,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  tabIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: 'transparent',
  },
  activeTabIcon: {
    backgroundColor: Colors.orange,
  },
  iconText: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: Colors.text,
    fontWeight: Typography.semibold,
  },
});

export default BottomNavigation;
