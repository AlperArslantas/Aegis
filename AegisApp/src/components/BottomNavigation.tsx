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
import { Typography, Spacing, BorderRadius } from '../constants/theme';
import { useTheme } from '../utils/themeContext';

interface BottomNavigationProps {
  currentTab: 'home' | 'history' | 'settings';
  onTabPress: (tab: 'home' | 'history' | 'settings') => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onTabPress,
}) => {
  const { theme } = useTheme();
  
  const tabs = [
    { key: 'home', label: 'HOME', icon: '🏠' },
    { key: 'history', label: 'HISTORY', icon: '📹' },
    { key: 'settings', label: 'SETTINGS', icon: '⚙️' },
  ] as const;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.secondary }]}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.tabIcon,
                isActive && { backgroundColor: theme.colors.orange }
              ]}>
                <Text style={styles.iconText}>{tab.icon}</Text>
              </View>
              <Text style={[
                styles.tabLabel,
                { color: isActive ? theme.colors.text : theme.colors.textMuted },
                isActive && { fontWeight: Typography.semibold }
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
    // backgroundColor will be set dynamically
  },
  container: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
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
  iconText: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    textAlign: 'center',
  },
});

export default BottomNavigation;
