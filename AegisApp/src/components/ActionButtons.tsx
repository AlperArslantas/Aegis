/**
 * AegisApp - Etkileşim Butonları Bileşeni
 * SPEAK ve UNLOCK DOOR butonları
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface ActionButtonsProps {
  onSpeakPress: () => void;
  onUnlockPress: () => void;
  isMicrophoneActive: boolean;
  isDoorUnlocked: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onSpeakPress,
  onUnlockPress,
  isMicrophoneActive,
  isDoorUnlocked,
}) => {
  return (
    <View style={styles.container}>
      {/* SPEAK Butonu - Full-Duplex (Hem konuş hem dinle) - Aç/Kapat modu */}
      <TouchableOpacity
        style={[
          styles.button,
          styles.speakButton,
          isMicrophoneActive && styles.activeButton,
        ]}
        onPress={onSpeakPress}
        activeOpacity={0.8}
      >
        <View style={styles.buttonIcon}>
          <Text style={styles.microphoneIcon}>
            {isMicrophoneActive ? '🎙️' : '🎤'}
          </Text>
        </View>
        <Text style={styles.buttonText}>
          {isMicrophoneActive ? 'DURDUR' : 'KONUŞ'}
        </Text>
      </TouchableOpacity>

      {/* UNLOCK DOOR Butonu */}
      <TouchableOpacity
        style={[
          styles.button,
          styles.unlockButton,
          isDoorUnlocked && styles.activeButton,
        ]}
        onPress={onUnlockPress}
        activeOpacity={0.8}
      >
        <View style={styles.buttonIcon}>
          <Text style={styles.unlockIcon}>
            {isDoorUnlocked ? '🔓' : '🔒'}
          </Text>
        </View>
        <Text style={styles.buttonText}>
          {isDoorUnlocked ? 'KAPİYİ KİLİTLE' : 'KAPİYİ AÇ'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    height: 80,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  speakButton: {
    backgroundColor: Colors.success,
  },
  unlockButton: {
    backgroundColor: Colors.orange,
  },
  activeButton: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  buttonIcon: {
    marginBottom: Spacing.xs,
  },
  microphoneIcon: {
    fontSize: 24,
  },
  unlockIcon: {
    fontSize: 24,
  },
  buttonText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.text,
    textAlign: 'center',
  },
});

export default ActionButtons;
