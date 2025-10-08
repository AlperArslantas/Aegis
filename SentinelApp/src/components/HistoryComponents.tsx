/**
 * Sentinel App - History Bileşenleri
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
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

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
        return Colors.success;
      case 'warning':
        return Colors.warning;
      case 'danger':
        return Colors.danger;
      default:
        return Colors.textSecondary;
    }
  };

  return (
    <TouchableOpacity style={styles.historyItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={styles.iconContainer}>
            <Text style={styles.typeIcon}>{getTypeIcon(type)}</Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{title}</Text>
            <Text style={styles.itemDescription}>{description}</Text>
            <Text style={styles.itemTimestamp}>{timestamp}</Text>
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
  return (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.activeFilterButton]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <Text style={styles.filterIcon}>{icon}</Text>}
      <Text style={[
        styles.filterText,
        isActive && styles.activeFilterText,
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
  return (
    <View style={styles.searchContainer}>
      <Text style={styles.searchIcon}>🔍</Text>
      <Text style={styles.searchPlaceholder}>{placeholder}</Text>
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
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  historyItem: {
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.orange,
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
    color: Colors.text,
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  itemTimestamp: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
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
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    minWidth: 70,
    height: 40,
    shadowColor: Colors.background,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activeFilterButton: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
    shadowColor: Colors.orange,
    shadowOpacity: 0.3,
  },
  filterIcon: {
    fontSize: Typography.sm,
    marginRight: Spacing.xs,
  },
  filterText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    textAlign: 'center',
  },
  activeFilterText: {
    color: Colors.text,
    fontWeight: Typography.bold,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  searchIcon: {
    fontSize: Typography.base,
    marginRight: Spacing.sm,
    color: Colors.textMuted,
  },
  searchPlaceholder: {
    fontSize: Typography.base,
    color: Colors.textMuted,
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
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
