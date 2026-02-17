/**
 * AegisApp - Sensör Paneli Bileşeni
 * Çevresel sensör verilerini gösterir
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../utils/themeContext';
import { SensorData } from '../types';

interface SensorPanelProps {
  sensorData: SensorData;
}

const SensorPanel: React.FC<SensorPanelProps> = ({ sensorData }) => {
  const { theme } = useTheme();
  
  // Gaz kaçağı kontrolü: airQuality 'good' ise gaz yok, diğer durumlar gaz var demektir
  const hasGasLeak = sensorData.airQuality !== 'good' && sensorData.airQuality !== 'excellent';
  const gasLeakColor = hasGasLeak ? theme.colors.danger : theme.colors.success;
  const gasLeakText = hasGasLeak ? 'Uyarı!' : 'Gaz Kaçağı Tespiti Yok';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.title, { color: theme.colors.textSecondary }]}>ÇEVRESEL SENSÖRLER</Text>
      
      <View style={styles.sensorsContainer}>
        {/* Sıcaklık Sensörü */}
        <View style={styles.sensorItem}>
          <View style={[styles.sensorIcon, { backgroundColor: theme.colors.orange }]}>
            <Text style={styles.temperatureIcon}>🔥</Text>
          </View>
          <View style={styles.sensorInfo}>
            <Text style={[styles.sensorLabel, { color: theme.colors.textSecondary }]}>SICAKLIK</Text>
            <Text style={[styles.sensorValue, { color: theme.colors.text }]}>{sensorData.temperature}°C</Text>
          </View>
        </View>

        {/* Nem Sensörü */}
        <View style={styles.sensorItem}>
          <View style={[styles.sensorIcon, { backgroundColor: theme.colors.teal }]}>
            <Text style={styles.humidityIcon}>💧</Text>
          </View>
          <View style={styles.sensorInfo}>
            <Text style={[styles.sensorLabel, { color: theme.colors.textSecondary }]}>NEM</Text>
            <Text style={[styles.sensorValue, { color: theme.colors.text }]}>{sensorData.humidity}%</Text>
          </View>
        </View>

        {/* Gaz Kaçağı Sensörü */}
        <View style={styles.sensorItem}>
          <View style={[styles.sensorIcon, { backgroundColor: gasLeakColor }]}>
            <Text style={styles.airQualityIcon}>🌿</Text>
          </View>
          <View style={styles.sensorInfo}>
            <Text style={[styles.sensorLabel, { color: theme.colors.textSecondary }]}>GAZ KAÇAĞI</Text>
            <Text style={[styles.sensorValue, { color: gasLeakColor }]}>
              {gasLeakText}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.md,
    textAlign: 'center',
    letterSpacing: 1,
  },
  sensorsContainer: {
    gap: Spacing.md,
  },
  sensorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  sensorIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  temperatureIcon: {
    fontSize: 20,
  },
  humidityIcon: {
    fontSize: 20,
  },
  airQualityIcon: {
    fontSize: 20,
  },
  sensorInfo: {
    flex: 1,
  },
  sensorLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    marginBottom: 2,
  },
  sensorValue: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
});

export default SensorPanel;
