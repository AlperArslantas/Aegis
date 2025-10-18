/**
 * AegisApp - Settings Bileşenleri
 * Switch, Slider, Button gibi ayar bileşenleri
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../utils/themeContext';

// Switch Bileşeni
interface SettingsSwitchProps {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon?: string;
}

export const SettingsSwitch: React.FC<SettingsSwitchProps> = ({
  title,
  description,
  value,
  onValueChange,
  icon,
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.settingItem, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.secondary }]}>
      <View style={styles.settingContent}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.orange }]}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
          {description && (
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>{description}</Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.secondary, true: theme.colors.orange }}
        thumbColor={value ? theme.colors.text : theme.colors.textMuted}
        ios_backgroundColor={theme.colors.secondary}
      />
    </View>
  );
};

// Button Bileşeni
interface SettingsButtonProps {
  title: string;
  description?: string;
  onPress: () => void;
  icon?: string;
  variant?: 'default' | 'danger';
}

export const SettingsButton: React.FC<SettingsButtonProps> = ({
  title,
  description,
  onPress,
  icon,
  variant = 'default',
}) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.settingItem,
        styles.buttonItem,
        { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.secondary },
        variant === 'danger' && { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingContent}>
        {icon && (
          <View style={[
            styles.iconContainer,
            { backgroundColor: theme.colors.orange },
            variant === 'danger' && { backgroundColor: theme.colors.danger },
          ]}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={[
            styles.settingTitle,
            { color: theme.colors.text },
            variant === 'danger' && { color: theme.colors.danger },
          ]}>
            {title}
          </Text>
          {description && (
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>{description}</Text>
          )}
        </View>
      </View>
      <Text style={[styles.arrowIcon, { color: theme.colors.textMuted }]}>›</Text>
    </TouchableOpacity>
  );
};

// Section Header Bileşeni
interface SettingsSectionHeaderProps {
  title: string;
  icon?: string;
}

export const SettingsSectionHeader: React.FC<SettingsSectionHeaderProps> = ({
  title,
  icon,
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.secondary }]}>
      {icon && (
        <Text style={styles.sectionIcon}>{icon}</Text>
      )}
      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  buttonItem: {
    // backgroundColor will be set dynamically
  },
  settingContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
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
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: Typography.sm,
  },
  arrowIcon: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  sectionIcon: {
    fontSize: Typography.base,
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
