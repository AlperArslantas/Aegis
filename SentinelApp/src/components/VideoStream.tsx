/**
 * Sentinel App - Video Stream Bileşeni
 * Canlı video yayını ve overlay bilgileri
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { VideoStream as VideoStreamType } from '../types';

interface VideoStreamProps {
  stream: VideoStreamType;
  onPress?: () => void;
}

const VideoStream: React.FC<VideoStreamProps> = ({ stream, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        }}
        style={styles.videoBackground}
        resizeMode="cover"
      >
        {/* Video overlay gradient */}
        <View style={styles.overlay} />
        
        {/* Sol alt - Zaman bilgisi */}
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{stream.timestamp}</Text>
        </View>

        {/* Sağ alt - LIVE etiketi */}
        <View style={styles.liveContainer}>
          <View style={styles.liveIndicator} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* Orta - Oynat butonu (video için) */}
        <View style={styles.playButtonContainer}>
          <View style={styles.playButton}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Colors.Shadows?.md,
  },
  videoBackground: {
    width: '100%',
    height: 250,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  timeContainer: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.overlay,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  timeText: {
    fontSize: Typography.sm,
    color: Colors.text,
    fontWeight: Typography.medium,
  },
  liveContainer: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.text,
    marginRight: Spacing.xs,
  },
  liveText: {
    fontSize: Typography.sm,
    color: Colors.text,
    fontWeight: Typography.bold,
  },
  playButtonContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.text,
  },
  playIcon: {
    fontSize: Typography.xl,
    color: Colors.text,
    marginLeft: 4,
  },
});

export default VideoStream;
