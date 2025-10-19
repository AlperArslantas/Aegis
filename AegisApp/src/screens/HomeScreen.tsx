/**
 * AegisApp - Ana Ekran
 * Güvenlik uygulaması ana arayüzü
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { check, request, PERMISSIONS, RESULTS, checkNotifications, requestNotifications } from 'react-native-permissions';
import { Typography, Spacing } from '../constants/theme';
import { useTheme } from '../utils/themeContext';
import { SensorData, VideoStream as VideoStreamType, DoorCall } from '../types';
import { getMockSensorData, getMockVideoStream, getMockDoorCall } from '../utils/mockData';

// Bileşenler
import Header from '../components/Header.tsx';
import SensorPanel from '../components/SensorPanel';
import VideoStream from '../components/VideoStream';
import ActionButtons from '../components/ActionButtons';
import IncomingCallBanner from '../components/IncomingCallBanner';
import BottomNavigation from '../components/BottomNavigation';
import SidebarNavbar from '../components/SidebarNavbar';
import NotificationsModal from '../components/NotificationsModal';
import HistoryScreen from './HistoryScreen';
import SettingsScreen from './SettingsScreen';
import ProfileScreen from '../components/ProfileScreen';

const HomeScreen: React.FC = () => {
  // Tema context
  const { theme } = useTheme();
  
  // State yönetimi
  const [currentTab, setCurrentTab] = useState<'home' | 'history' | 'settings' | 'profile'>('home');
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [isDoorUnlocked, setIsDoorUnlocked] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);
  
  // Mock veriler
  const [sensorData, setSensorData] = useState<SensorData>(getMockSensorData());
  const [videoStream, setVideoStream] = useState<VideoStreamType>(getMockVideoStream());
  const [doorCall, setDoorCall] = useState<DoorCall>(getMockDoorCall());

  // Sensör verilerini güncelle (simülasyon)
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData(getMockSensorData());
      setVideoStream(getMockVideoStream());
    }, 5000); // 5 saniyede bir güncelle

    return () => clearInterval(interval);
  }, []);

  // Uygulama açılışında Mikrofon iznini iste
  useEffect(() => {
    const ensureMicrophonePermission = async () => {
      try {
        const permission = Platform.select({
          ios: PERMISSIONS.IOS.MICROPHONE,
          android: PERMISSIONS.ANDROID.RECORD_AUDIO,
          default: undefined,
        });

        if (!permission) return;

        const current = await check(permission);
        if (current === RESULTS.GRANTED) {
          return;
        }

        await request(permission);
      } catch (e) {
        // sessizce geç
      }
    };

    ensureMicrophonePermission();
  }, []);

  // Bildirim izni (iOS ve Android 13+)
  useEffect(() => {
    const ensureNotificationPermission = async () => {
      try {
        const { status } = await checkNotifications();
        if (status !== RESULTS.GRANTED) {
          await requestNotifications(['alert', 'sound', 'badge']);
        }
      } catch (e) {
        // sessizce geç
      }
    };

    ensureNotificationPermission();
  }, []);

  // Event handlers
  const handleMenuPress = () => {
    setIsSidebarVisible(true);
  };

  const handleNotificationPress = () => {
    setIsNotificationsVisible(true);
  };

  const handleSidebarClose = () => {
    setIsSidebarVisible(false);
  };

  const handleNotificationsClose = () => {
    setIsNotificationsVisible(false);
  };

  const handleMenuItemPress = (menuItem: string) => {
    console.log('Menu item pressed:', menuItem);
    
    // Sidebar menü öğelerini BottomNavigation ile eşleştir
    switch (menuItem) {
      case 'dashboard':
        setCurrentTab('home');
        break;
      case 'history':
        setCurrentTab('history');
        break;
      case 'settings':
        setCurrentTab('settings');
        break;
      default:
        // Diğer menü öğeleri için console log
        console.log('Menu item not mapped:', menuItem);
        break;
    }
  };

  const handleTabPress = (tab: 'home' | 'history' | 'settings' | 'profile') => {
    setCurrentTab(tab);
    console.log('Tab pressed:', tab);
  };

  const handleProfileTabChange = (tab: 'home' | 'history' | 'settings' | 'profile') => {
    setCurrentTab(tab);
    console.log('Profile tab changed:', tab);
  };

  // Ekran render fonksiyonu
  const renderCurrentScreen = () => {
    switch (currentTab) {
      case 'settings':
        return <SettingsScreen onTabChange={handleTabPress} />;
      case 'history':
        return <HistoryScreen onTabChange={handleTabPress} />;
      case 'profile':
        return <ProfileScreen onTabChange={handleProfileTabChange} />;
      default:
        return renderHomeContent();
    }
  };

  const renderHomeContent = () => (
    <>
      {/* Header */}
      <Header
        onMenuPress={handleMenuPress}
        onNotificationPress={handleNotificationPress}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Gelen Çağrı Banner */}
        <IncomingCallBanner
          caller={doorCall.caller}
          isVisible={doorCall.isActive}
        />

        {/* Video Stream */}
        <VideoStream
          stream={videoStream}
          onPress={handleVideoPress}
        />

        {/* Etkileşim Butonları */}
        <ActionButtons
          onSpeakPress={handleSpeakPress}
          onUnlockPress={handleUnlockPress}
          isMicrophoneActive={isMicrophoneActive}
          isDoorUnlocked={isDoorUnlocked}
        />

        {/* Sensör Paneli */}
        <SensorPanel sensorData={sensorData} />

        {/* Durum Bilgileri */}
        <View style={[styles.statusContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statusTitle, { color: theme.colors.textSecondary }]}>SİSTEM DURUMU</Text>
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: theme.colors.text }]}>Mikrofon:</Text>
            <Text style={[styles.statusValue, { color: isMicrophoneActive ? theme.colors.success : theme.colors.textMuted }]}>
              {isMicrophoneActive ? 'Aktif' : 'Pasif'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: theme.colors.text }]}>Kapı Kilidi:</Text>
            <Text style={[styles.statusValue, { color: isDoorUnlocked ? theme.colors.warning : theme.colors.success }]}>
              {isDoorUnlocked ? 'Açık' : 'Kilitli'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sidebar Navbar */}
      <SidebarNavbar
        isVisible={isSidebarVisible}
        onClose={handleSidebarClose}
        onMenuItemPress={handleMenuItemPress}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isVisible={isNotificationsVisible}
        onClose={handleNotificationsClose}
      />
    </>
  );

  const handleSpeakPress = () => {
    setIsMicrophoneActive(!isMicrophoneActive);
    console.log('Speak pressed:', !isMicrophoneActive);
  };

  const handleUnlockPress = () => {
    setIsDoorUnlocked(!isDoorUnlocked);
    console.log('Unlock pressed:', !isDoorUnlocked);
  };

  const handleVideoPress = () => {
    console.log('Video stream pressed');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Mevcut Ekran */}
      {renderCurrentScreen()}

      {/* Alt Navigasyon - sadece home ekranında göster */}
      {currentTab === 'home' && (
        <BottomNavigation
          currentTab={currentTab}
          onTabPress={handleTabPress}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  welcomeContainer: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    marginBottom: Spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.md,
  },
  welcomeDescription: {
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  statusContainer: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: 12,
  },
  statusTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.md,
    textAlign: 'center',
    letterSpacing: 1,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statusLabel: {
    fontSize: Typography.base,
  },
  statusValue: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
});

export default HomeScreen;
