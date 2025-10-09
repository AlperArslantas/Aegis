/**
 * AegisApp - Gelen Çağrı Banner Bileşeni
 * Turuncu banner ile gelen çağrı bildirimi
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface IncomingCallBannerProps {
  caller: string;
  isVisible: boolean;
}

const IncomingCallBanner: React.FC<IncomingCallBannerProps> = ({
  caller,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <Animated.View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.bellIcon}>🔔</Text>
      </View>
      <Text style={styles.callText}>
        GELEN ÇAĞRI: {caller}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.orange,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  bellIcon: {
    fontSize: 20,
  },
  callText: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.text,
    textAlign: 'center',
  },
});

export default IncomingCallBanner;
