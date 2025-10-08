/**
 * Sentinel App - Ana Ekran
 * Akıllı kapı zili ve yangın tespit sistemi ana arayüzü
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Colors } from '../constants/theme';
import { SensorData, DoorCall, VideoStream } from '../types';
import { getMockSensorData, getMockDoorCall, getMockVideoStream } from '../utils/mockData';

// Bileşenler
import Header from '../components/Header';
import IncomingCallBanner from '../components/IncomingCallBanner';
import VideoStreamComponent from '../components/VideoStream';
import ActionButtons from '../components/ActionButtons';
import SensorPanel from '../components/SensorPanel';
import BottomNavigation from '../components/BottomNavigation';
import SidebarNavbar from '../components/SidebarNavbar';
import NotificationsModal from '../components/NotificationsModal';

const HomeScreen: React.FC = () => {
  // State yönetimi
  const [currentTab, setCurrentTab] = useState<'home' | 'history' | 'settings'>('home');
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [isDoorUnlocked, setIsDoorUnlocked] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);
  
  // Mock veriler
  const [sensorData, setSensorData] = useState<SensorData>(getMockSensorData());
  const [doorCall, setDoorCall] = useState<DoorCall>(getMockDoorCall());
  const [videoStream, setVideoStream] = useState<VideoStream>(getMockVideoStream());

  // Sensör verilerini güncelle (simülasyon)
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData(getMockSensorData());
      setVideoStream(getMockVideoStream());
    }, 5000); // 5 saniyede bir güncelle

    return () => clearInterval(interval);
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
    // Burada farklı menü öğelerine göre navigasyon yapılabilir
  };

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

  const handleTabPress = (tab: 'home' | 'history' | 'settings') => {
    setCurrentTab(tab);
    console.log('Tab pressed:', tab);
  };

  return (
    <View style={styles.container}>
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
        <VideoStreamComponent
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
      </ScrollView>

      {/* Alt Navigasyon */}
      <BottomNavigation
        currentTab={currentTab}
        onTabPress={handleTabPress}
      />

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default HomeScreen;
