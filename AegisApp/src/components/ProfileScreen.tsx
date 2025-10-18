/**
 * AegisApp - Profil Ekranı
 * Kullanıcı bilgileri ve cihaz yönetimi
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { Typography, Spacing, BorderRadius } from '../constants/theme';
import { useTheme } from '../utils/themeContext';
import { useAuth } from '../utils/authContext';
import BottomNavigation from './BottomNavigation';

interface Device {
  id: string;
  name: string;
  number: string;
  status: 'online' | 'offline' | 'error';
  location: string;
}

interface ProfileScreenProps {
  onTabChange?: (tab: 'home' | 'history' | 'settings') => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onTabChange }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  // State
  const [currentTab, setCurrentTab] = useState<'home' | 'history' | 'settings'>('settings');
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [newDeviceNumber, setNewDeviceNumber] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  
  // Mock cihaz listesi
  const [devices, setDevices] = useState<Device[]>([
    {
      id: '1',
      name: 'Ana Kapı Kamerası',
      number: 'AEGIS-001',
      status: 'online',
      location: 'Giriş Katı'
    },
    {
      id: '2',
      name: 'Bahçe Sensörü',
      number: 'AEGIS-002',
      status: 'offline',
      location: 'Bahçe'
    }
  ]);

  // Event handlers
  const handleTabPress = (tab: 'home' | 'history' | 'settings') => {
    setCurrentTab(tab);
    onTabChange?.(tab);
  };

  const handleAddDevice = () => {
    if (!newDeviceNumber.trim() || !newDeviceName.trim()) {
      Alert.alert('Hata', 'Lütfen cihaz numarası ve adını girin');
      return;
    }

    if (!newDeviceNumber.match(/^AEGIS-\d{3}$/)) {
      Alert.alert('Hata', 'Cihaz numarası AEGIS-XXX formatında olmalıdır');
      return;
    }

    // Cihaz numarası zaten var mı kontrol et
    if (devices.some(device => device.number === newDeviceNumber)) {
      Alert.alert('Hata', 'Bu cihaz numarası zaten eklenmiş');
      return;
    }

    const newDevice: Device = {
      id: Date.now().toString(),
      name: newDeviceName,
      number: newDeviceNumber,
      status: 'online',
      location: 'Bilinmeyen'
    };

    setDevices(prev => [...prev, newDevice]);
    setNewDeviceNumber('');
    setNewDeviceName('');
    setShowAddDeviceModal(false);
    
    Alert.alert('Başarılı', 'Cihaz başarıyla eklendi');
  };

  const handleRemoveDevice = (deviceId: string) => {
    Alert.alert(
      'Cihazı Kaldır',
      'Bu cihazı kaldırmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: () => {
            setDevices(prev => prev.filter(device => device.id !== deviceId));
            Alert.alert('Başarılı', 'Cihaz kaldırıldı');
          }
        }
      ]
    );
  };

  const getStatusColor = (status: Device['status']) => {
    switch (status) {
      case 'online':
        return theme.colors.success;
      case 'offline':
        return theme.colors.error;
      case 'error':
        return theme.colors.warning;
      default:
        return theme.colors.textMuted;
    }
  };

  const getStatusText = (status: Device['status']) => {
    switch (status) {
      case 'online':
        return 'Çevrimiçi';
      case 'offline':
        return 'Çevrimdışı';
      case 'error':
        return 'Hata';
      default:
        return 'Bilinmiyor';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.secondary }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profil</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Kullanıcı bilgileri ve cihaz yönetimi</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Kullanıcı Bilgileri */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>👤 Kullanıcı Bilgileri</Text>
          
          <View style={styles.userInfo}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Ad Soyad:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user?.name || 'Kullanıcı'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>E-posta:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user?.email || 'user@example.com'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Kullanıcı Adı:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user?.username || 'admin'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Üyelik Tarihi:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>01.01.2024</Text>
            </View>
          </View>
        </View>

        {/* Cihaz Yönetimi */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>📱 Cihaz Yönetimi</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowAddDeviceModal(true)}
            >
              <Text style={styles.addButtonText}>+ Ekle</Text>
            </TouchableOpacity>
          </View>

          {devices.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                Henüz cihaz eklenmemiş
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textMuted }]}>
                Yukarıdaki "+ Ekle" butonuna tıklayarak cihaz ekleyebilirsiniz
              </Text>
            </View>
          ) : (
            <View style={styles.deviceList}>
              {devices.map((device) => (
                <View key={device.id} style={[styles.deviceItem, { borderColor: theme.colors.secondary }]}>
                  <View style={styles.deviceInfo}>
                    <Text style={[styles.deviceName, { color: theme.colors.text }]}>{device.name}</Text>
                    <Text style={[styles.deviceNumber, { color: theme.colors.textSecondary }]}>{device.number}</Text>
                    <Text style={[styles.deviceLocation, { color: theme.colors.textMuted }]}>{device.location}</Text>
                    <View style={styles.deviceStatus}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(device.status) }]} />
                      <Text style={[styles.statusText, { color: getStatusColor(device.status) }]}>
                        {getStatusText(device.status)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
                    onPress={() => handleRemoveDevice(device.id)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Cihaz Ekleme Modal */}
      <Modal
        visible={showAddDeviceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddDeviceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Yeni Cihaz Ekle</Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Cihaz Adı</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.secondary
                }]}
                value={newDeviceName}
                onChangeText={setNewDeviceName}
                placeholder="Örn: Ana Kapı Kamerası"
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Cihaz Numarası</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.secondary
                }]}
                value={newDeviceNumber}
                onChangeText={setNewDeviceNumber}
                placeholder="AEGIS-001"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.secondary }]}
                onPress={() => setShowAddDeviceModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleAddDevice}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    padding: Spacing.md,
  },
  section: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.semibold,
  },
  addButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    color: 'white',
    fontWeight: Typography.semibold,
    fontSize: Typography.sm,
  },
  userInfo: {
    gap: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  infoValue: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: Typography.sm,
    textAlign: 'center',
  },
  deviceList: {
    gap: Spacing.md,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.xs,
  },
  deviceNumber: {
    fontSize: Typography.base,
    marginBottom: Spacing.xs,
  },
  deviceLocation: {
    fontSize: Typography.sm,
    marginBottom: Spacing.sm,
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  statusText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  removeButtonText: {
    color: 'white',
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.sm,
    marginBottom: Spacing.sm,
    fontWeight: Typography.medium,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
});

export default ProfileScreen;
