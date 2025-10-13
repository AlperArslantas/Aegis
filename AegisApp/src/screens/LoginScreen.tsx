/**
 * AegisApp - Giriş Ekranı
 * Kullanıcı kimlik doğrulama arayüzü
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { LoginCredentials, User } from '../types';
import { mockLogin, mockForgotPassword } from '../utils/mockData';

interface LoginScreenProps {
  onLoginSuccess: (user: User, rememberMe: boolean) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  // Form state
  const [credentials, setCredentials] = useState<LoginCredentials>({
    emailOrUsername: '',
    password: '',
    deviceNumber: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Input handlers
  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  // Login handler
  const handleLogin = async () => {
    // Validation
    if (!credentials.emailOrUsername.trim()) {
      Alert.alert('Hata', 'E-posta adresi veya kullanıcı adı gereklidir');
      return;
    }
    if (!credentials.password.trim()) {
      Alert.alert('Hata', 'Şifre gereklidir');
      return;
    }
    if (!credentials.deviceNumber.trim()) {
      Alert.alert('Hata', 'Cihaz numarası gereklidir');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await mockLogin(
        credentials.emailOrUsername,
        credentials.password,
        credentials.deviceNumber
      );

      if (result.success && result.user) {
        onLoginSuccess(result.user, rememberMe);
      } else {
        Alert.alert('Giriş Hatası', result.error || 'Bilinmeyen bir hata oluştu');
      }
    } catch (error) {
      Alert.alert('Hata', 'Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password handler
  const handleForgotPassword = async () => {
    if (!credentials.emailOrUsername.trim()) {
      Alert.alert('Bilgi', 'Lütfen önce e-posta adresinizi veya kullanıcı adınızı girin');
      return;
    }

    try {
      const result = await mockForgotPassword(credentials.emailOrUsername);
      
      if (result.success) {
        Alert.alert('Başarılı', result.message || 'Şifre sıfırlama bağlantısı gönderildi');
      } else {
        Alert.alert('Hata', result.error || 'Bilinmeyen bir hata oluştu');
      }
    } catch (error) {
      Alert.alert('Hata', 'Bağlantı hatası. Lütfen tekrar deneyin.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo/Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.logo}>AEGIS</Text>
          <Text style={styles.subtitle}>Güvenlik Sistemi</Text>
          <Text style={styles.welcomeText}>Hoş Geldiniz</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          {/* Email/Username Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-posta / Kullanıcı Adı</Text>
            <TextInput
              style={styles.textInput}
              value={credentials.emailOrUsername}
              onChangeText={(text) => handleInputChange('emailOrUsername', text)}
              placeholder="admin@aegis.com veya admin"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Şifre</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={credentials.password}
                onChangeText={(text) => handleInputChange('password', text)}
                placeholder="password123"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <Text style={styles.eyeButtonText}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Device Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Cihaz Numarası</Text>
            <TextInput
              style={styles.textInput}
              value={credentials.deviceNumber}
              onChangeText={(text) => handleInputChange('deviceNumber', text)}
              placeholder="AEGIS-001"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
              disabled={isLoading}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberMeText}>Beni Hatırla</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.text} size="small" />
            ) : (
              <Text style={styles.loginButtonText}>GİRİŞ YAP</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Mock Info */}
        <View style={styles.mockInfoContainer}>
          <Text style={styles.mockInfoTitle}>Test Kullanıcıları:</Text>
          <Text style={styles.mockInfoText}>admin / password123 / AEGIS-001</Text>
          <Text style={styles.mockInfoText}>user / password123 / AEGIS-002</Text>
          <Text style={styles.mockInfoText}>test / password123 / AEGIS-003</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing['2xl'],
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
    marginTop: Spacing.xl,
  },
  logo: {
    fontSize: Typography['4xl'],
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: 4,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  welcomeText: {
    fontSize: Typography.xl,
    color: Colors.text,
    fontWeight: Typography.semibold,
  },
  formContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: Typography.medium,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.text,
  },
  eyeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  eyeButtonText: {
    fontSize: Typography.lg,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.secondary,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.text,
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
  rememberMeText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  forgotPasswordText: {
    fontSize: Typography.sm,
    color: Colors.info,
    fontWeight: Typography.medium,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
  loginButtonText: {
    fontSize: Typography.base,
    color: Colors.text,
    fontWeight: Typography.semibold,
    letterSpacing: 1,
  },
  mockInfoContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  mockInfoTitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.sm,
  },
  mockInfoText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    fontFamily: 'monospace',
  },
});

export default LoginScreen;
