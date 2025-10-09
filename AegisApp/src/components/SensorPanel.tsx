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
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { SensorData } from '../types';
import { getAirQualityColor, getAirQualityText } from '../utils/mockData';

interface SensorPanelProps {
  sensorData: SensorData;
}

const SensorPanel: React.FC<SensorPanelProps> = ({ sensorData }) => {
  const airQualityColor = getAirQualityColor(sensorData.airQuality);
  const airQualityText = getAirQualityText(sensorData.airQuality);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ÇEVRESEL SENSÖRLER</Text>
      
      <View style={styles.sensorsContainer}>
        {/* Sıcaklık Sensörü */}
        <View style={styles.sensorItem}>
          <View style={styles.sensorIcon}>
            <Text style={styles.temperatureIcon}>🔥</Text>
          </View>
          <View style={styles.sensorInfo}>
            <Text style={styles.sensorLabel}>SICAKLIK</Text>
            <Text style={styles.sensorValue}>{sensorData.temperature}°C</Text>
          </View>
        </View>

        {/* Nem Sensörü */}
        <View style={styles.sensorItem}>
          <View style={styles.sensorIcon}>
            <Text style={styles.humidityIcon}>💧</Text>
          </View>
          <View style={styles.sensorInfo}>
            <Text style={styles.sensorLabel}>NEM</Text>
            <Text style={styles.sensorValue}>{sensorData.humidity}%</Text>
          </View>
        </View>

        {/* Hava Kalitesi Sensörü */}
        <View style={styles.sensorItem}>
          <View style={[styles.sensorIcon, { backgroundColor: airQualityColor }]}>
            <Text style={styles.airQualityIcon}>🌿</Text>
          </View>
          <View style={styles.sensorInfo}>
            <Text style={styles.sensorLabel}>HAVA KALİTESİ</Text>
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
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.orange,
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
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  sensorValue: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
});

export default SensorPanel;
