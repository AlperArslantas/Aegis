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
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

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
  return (
    <View style={styles.settingItem}>
      <View style={styles.settingContent}>
        {icon && (
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && (
            <Text style={styles.settingDescription}>{description}</Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.secondary, true: Colors.orange }}
        thumbColor={value ? Colors.text : Colors.textMuted}
        ios_backgroundColor={Colors.secondary}
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
  return (
    <TouchableOpacity
      style={[
        styles.settingItem,
        styles.buttonItem,
        variant === 'danger' && styles.dangerButton,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingContent}>
        {icon && (
          <View style={[
            styles.iconContainer,
            variant === 'danger' && styles.dangerIcon,
          ]}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={[
            styles.settingTitle,
            variant === 'danger' && styles.dangerText,
          ]}>
            {title}
          </Text>
          {description && (
            <Text style={styles.settingDescription}>{description}</Text>
          )}
        </View>
      </View>
      <Text style={styles.arrowIcon}>›</Text>
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
  return (
    <View style={styles.sectionHeader}>
      {icon && (
        <Text style={styles.sectionIcon}>{icon}</Text>
      )}
      <Text style={styles.sectionTitle}>{title}</Text>
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
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary,
  },
  buttonItem: {
    backgroundColor: Colors.surface,
  },
  dangerButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
    backgroundColor: Colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  dangerIcon: {
    backgroundColor: Colors.danger,
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
    color: Colors.text,
    marginBottom: 2,
  },
  dangerText: {
    color: Colors.danger,
  },
  settingDescription: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  arrowIcon: {
    fontSize: Typography.xl,
    color: Colors.textMuted,
    fontWeight: Typography.bold,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary,
  },
  sectionIcon: {
    fontSize: Typography.base,
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
