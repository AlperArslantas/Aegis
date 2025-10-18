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
import { getAirQualityColor, getAirQualityText } from '../utils/mockData';

interface SensorPanelProps {
  sensorData: SensorData;
}

const SensorPanel: React.FC<SensorPanelProps> = ({ sensorData }) => {
  const { theme } = useTheme();
  const airQualityColor = getAirQualityColor(sensorData.airQuality);
  const airQualityText = getAirQualityText(sensorData.airQuality);

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

        {/* Hava Kalitesi Sensörü */}
        <View style={styles.sensorItem}>
          <View style={[styles.sensorIcon, { backgroundColor: airQualityColor }]}>
            <Text style={styles.airQualityIcon}>🌿</Text>
          </View>
          <View style={styles.sensorInfo}>
            <Text style={[styles.sensorLabel, { color: theme.colors.textSecondary }]}>HAVA KALİTESİ</Text>
            <Text style={[styles.sensorValue, { color: airQualityColor }]}>
              {airQualityText}
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
