/**
 * AegisApp - Settings Sayfası
 * Modern ve profesyonel ayarlar arayüzü
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Typography, Spacing, BorderRadius } from '../constants/theme';
import { useTheme } from '../utils/themeContext';
import { SettingsSwitch, SettingsButton, SettingsSectionHeader } from '../components/SettingsComponents';
import BottomNavigation from '../components/BottomNavigation';

interface SettingsScreenProps {
  onTabChange?: (tab: 'home' | 'history' | 'settings') => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onTabChange }) => {
  // Tema context
  const { theme, toggleTheme } = useTheme();
  
  // State yönetimi
  const [currentTab, setCurrentTab] = useState<'home' | 'history' | 'settings'>('settings');
  
  // Ayar durumları
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [autoLockEnabled, setAutoLockEnabled] = useState(false);
  const [motionDetectionEnabled, setMotionDetectionEnabled] = useState(true);
  const [doorbellEnabled, setDoorbellEnabled] = useState(true);
  const [fireDetectionEnabled, setFireDetectionEnabled] = useState(true);

  // Event handlers
  const handleTabPress = (tab: 'home' | 'history' | 'settings') => {
    setCurrentTab(tab);
    onTabChange?.(tab);
    console.log('Tab pressed:', tab);
  };

  // Tab değişikliği için callback
  React.useEffect(() => {
    // Bu sayfada tab değişikliği yönetimi
  }, [currentTab]);

  const handleAccountSettings = () => {
    Alert.alert('Hesap Ayarları', 'Hesap ayarları sayfası açılacak');
  };

  const handleDeviceSettings = () => {
    Alert.alert('Cihaz Ayarları', 'Cihaz ayarları sayfası açılacak');
  };

  const handleSecuritySettings = () => {
    Alert.alert('Güvenlik Ayarları', 'Güvenlik ayarları sayfası açılacak');
  };

  const handleBackupSettings = () => {
    Alert.alert('Yedekleme Ayarları', 'Yedekleme ayarları sayfası açılacak');
  };

  const handleAbout = () => {
    Alert.alert(
      'Hakkında',
      'AegisApp v1.0.0\n\nGüvenlik uygulaması mobil uygulaması.\n\n© 2024 AegisApp',
      [{ text: 'Tamam', style: 'default' }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: () => console.log('Logout') },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Ayarları Sıfırla',
      'Tüm ayarlar varsayılan değerlere döndürülecek. Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sıfırla', style: 'destructive', onPress: () => console.log('Reset settings') },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.secondary }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Ayarlar</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Uygulama ve sistem ayarlarını yönetin</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Bildirim Ayarları */}
        <SettingsSectionHeader title="Bildirimler" icon="🔔" />
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingsSwitch
            title="Bildirimler"
            description="Uygulama bildirimlerini al"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            icon="📱"
          />
          <SettingsSwitch
            title="Ses"
            description="Bildirim seslerini aç"
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            icon="🔊"
          />
          <SettingsSwitch
            title="Titreşim"
            description="Bildirim titreşimini aç"
            value={vibrationEnabled}
            onValueChange={setVibrationEnabled}
            icon="📳"
          />
        </View>

        {/* Güvenlik Ayarları */}
        <SettingsSectionHeader title="Güvenlik" icon="🔒" />
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingsSwitch
            title="Otomatik Kilit"
            description="Belirli süre sonra otomatik kilit"
            value={autoLockEnabled}
            onValueChange={setAutoLockEnabled}
            icon="⏰"
          />
          <SettingsButton
            title="Güvenlik Ayarları"
            description="PIN, parmak izi ve diğer güvenlik seçenekleri"
            onPress={handleSecuritySettings}
            icon="🛡️"
          />
        </View>

        {/* Sistem Ayarları */}
        <SettingsSectionHeader title="Sistem" icon="⚙️" />
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingsSwitch
            title="Gece Modu"
            description={theme.isDark ? "Karanlık tema aktif" : "Açık tema aktif"}
            value={theme.isDark}
            onValueChange={toggleTheme}
            icon="🌙"
          />
          <SettingsButton
            title="Cihaz Ayarları"
            description="Kamera ve sensör ayarları"
            onPress={handleDeviceSettings}
            icon="📹"
          />
          <SettingsButton
            title="Yedekleme"
            description="Veri yedekleme ve senkronizasyon"
            onPress={handleBackupSettings}
            icon="💾"
          />
        </View>

        {/* Algılama Ayarları */}
        <SettingsSectionHeader title="Algılama" icon="🔍" />
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingsSwitch
            title="Hareket Algılama"
            description="Hareket sensörlerini aktif et"
            value={motionDetectionEnabled}
            onValueChange={setMotionDetectionEnabled}
            icon="🚶"
          />
          <SettingsSwitch
            title="Kapı Zili"
            description="Kapı zili algılamasını aç"
            value={doorbellEnabled}
            onValueChange={setDoorbellEnabled}
            icon="🚪"
          />
          <SettingsSwitch
            title="Yangın Tespiti"
            description="Yangın sensörlerini aktif et"
            value={fireDetectionEnabled}
            onValueChange={setFireDetectionEnabled}
            icon="🔥"
          />
        </View>

        {/* Hesap Ayarları */}
        <SettingsSectionHeader title="Hesap" icon="👤" />
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingsButton
            title="Hesap Ayarları"
            description="Profil bilgileri ve kişisel ayarlar"
            onPress={handleAccountSettings}
            icon="👤"
          />
        </View>

        {/* Diğer */}
        <SettingsSectionHeader title="Diğer" icon="📋" />
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingsButton
            title="Hakkında"
            description="Uygulama bilgileri ve sürüm"
            onPress={handleAbout}
            icon="ℹ️"
          />
          <SettingsButton
            title="Ayarları Sıfırla"
            description="Tüm ayarları varsayılan değerlere döndür"
            onPress={handleResetSettings}
            icon="🔄"
            variant="danger"
          />
          <SettingsButton
            title="Çıkış Yap"
            description="Hesabınızdan güvenli şekilde çıkış yapın"
            onPress={handleLogout}
            icon="🚪"
            variant="danger"
          />
        </View>
      </ScrollView>

      {/* Alt Navigasyon */}
      <BottomNavigation
        currentTab={currentTab}
        onTabPress={handleTabPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.bold,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.base,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginHorizontal: Spacing.md,
  },
});

export default SettingsScreen;
