/**
 * AegisApp - History Bileşenleri
 * Geçmiş kayıtları için bileşenler
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../utils/themeContext';

// History Item Bileşeni
interface HistoryItemProps {
  id: string;
  type: 'door' | 'motion' | 'fire' | 'sensor';
  title: string;
  description: string;
  timestamp: string;
  imageUrl?: string;
  status: 'success' | 'warning' | 'danger';
  onPress: () => void;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({
  type,
  title,
  description,
  timestamp,
  imageUrl,
  status,
  onPress,
}) => {
  const { theme } = useTheme();
  
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

  return (
    <TouchableOpacity style={[styles.historyItem, { backgroundColor: theme.colors.surface }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.orange }]}>
            <Text style={styles.typeIcon}>{getTypeIcon(type)}</Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{title}</Text>
            <Text style={[styles.itemDescription, { color: theme.colors.textSecondary }]}>{description}</Text>
            <Text style={[styles.itemTimestamp, { color: theme.colors.textMuted }]}>{timestamp}</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
        </View>
        {imageUrl && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Filter Button Bileşeni
interface FilterButtonProps {
  title: string;
  isActive: boolean;
  onPress: () => void;
  icon?: string;
}

export const FilterButton: React.FC<FilterButtonProps> = ({
  title,
  isActive,
  onPress,
  icon,
}) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.filterButton,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.secondary },
        isActive && { backgroundColor: theme.colors.orange, borderColor: theme.colors.orange }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <Text style={styles.filterIcon}>{icon}</Text>}
      <Text style={[
        styles.filterText,
        { color: isActive ? theme.colors.text : theme.colors.textSecondary },
        isActive && { fontWeight: Typography.bold }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

// Search Bar Bileşeni
interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Ara...',
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.secondary }]}>
      <Text style={[styles.searchIcon, { color: theme.colors.textMuted }]}>🔍</Text>
      <Text style={[styles.searchPlaceholder, { color: theme.colors.textMuted }]}>{placeholder}</Text>
    </View>
  );
};

// Empty State Bileşeni
interface EmptyStateProps {
  title: string;
  description: string;
  icon: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  historyItem: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  itemContent: {
    padding: Spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  typeIcon: {
    fontSize: Typography.lg,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: Typography.sm,
    marginBottom: 4,
  },
  itemTimestamp: {
    fontSize: Typography.xs,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: Spacing.sm,
  },
  imageContainer: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.sm,
    borderWidth: 1.5,
    minWidth: 70,
    height: 40,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterIcon: {
    fontSize: Typography.sm,
    marginRight: Spacing.xs,
  },
  filterText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: Typography.base,
    marginRight: Spacing.sm,
  },
  searchPlaceholder: {
    fontSize: Typography.base,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: 24,
  },
});
