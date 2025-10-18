/**
 * AegisApp - Giriş Ekranı
 * Kullanıcı kimlik doğrulama arayüzü
 */

import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../utils/themeContext';
import { LoginCredentials, User } from '../types';
import { mockLogin, mockForgotPassword } from '../utils/mockData';

interface LoginScreenProps {
  onLoginSuccess: (user: User, rememberMe: boolean) => void;
}

// Partikül arayüzü
interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  size: number;
  opacity: number;
  connections: number[];
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  // Tema context
  const { theme } = useTheme();
  
  // Ekran boyutları
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Form state
  const [credentials, setCredentials] = useState<LoginCredentials>({
    emailOrUsername: '',
    password: '',
    deviceNumber: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<{
    emailOrUsername?: string;
    password?: string;
    deviceNumber?: string;
  }>({});

  // Animation refs
  const logoPulseAnim = useRef(new Animated.Value(1)).current;
  const logoGlowAnim = useRef(new Animated.Value(0.5)).current;
  const inputFocusAnim = useRef({
    emailOrUsername: new Animated.Value(0),
    password: new Animated.Value(0),
    deviceNumber: new Animated.Value(0),
  }).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  // Partikül sistemi
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Partikül oluşturma fonksiyonu
  const createParticles = () => {
    const particleCount = 40; // Performans için azaltıldı
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: new Animated.Value(Math.random() * screenWidth),
        y: new Animated.Value(Math.random() * screenHeight),
        size: Math.random() * 2 + 1.5, // 1.5-3.5 arası boyut
        opacity: Math.random() * 0.4 + 0.4, // 0.4-0.8 arası şeffaflık
        connections: [],
      });
    }
    
    setParticles(newParticles);
  };

  // Partikül animasyon fonksiyonu
  const animateParticles = () => {
    const animations = particles.map(particle => {
      const randomX = Math.random() * screenWidth;
      const randomY = Math.random() * screenHeight;
      const duration = Math.random() * 8000 + 6000; // 6-14 saniye arası (daha hızlı)
      
      return Animated.parallel([
        Animated.timing(particle.x, {
          toValue: randomX,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(particle.y, {
          toValue: randomY,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]);
    });

    const compositeAnimation = Animated.loop(
      Animated.parallel(animations)
    );
    
    particleAnimationRef.current = compositeAnimation;
    compositeAnimation.start();
  };

  // Animation functions
  useEffect(() => {
    // Logo pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulseAnim, {
          toValue: 1.1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Logo glow animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlowAnim, {
          toValue: 1.0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(logoGlowAnim, {
          toValue: 0.5,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );

    pulseAnimation.start();
    glowAnimation.start();

    return () => {
      pulseAnimation.stop();
      glowAnimation.stop();
    };
  }, []);

  // Partikül sistemi başlatma
  useEffect(() => {
    createParticles();
  }, []);

  useEffect(() => {
    if (particles.length > 0) {
      animateParticles();
    }

    return () => {
      if (particleAnimationRef.current) {
        particleAnimationRef.current.stop();
      }
    };
  }, [particles]);

  // Validation function
  const validateField = (field: keyof LoginCredentials, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'emailOrUsername':
        if (!value.trim()) {
          newErrors.emailOrUsername = 'E-posta veya kullanıcı adı gereklidir';
        } else {
          delete newErrors.emailOrUsername;
        }
        break;
      case 'password':
        if (!value.trim()) {
          newErrors.password = 'Şifre gereklidir';
        } else if (value.length < 6) {
          newErrors.password = 'Şifre en az 6 karakter olmalıdır';
        } else {
          delete newErrors.password;
        }
        break;
      case 'deviceNumber':
        if (!value.trim()) {
          newErrors.deviceNumber = 'Cihaz numarası gereklidir';
        } else if (!value.match(/^AEGIS-\d{3}$/)) {
          newErrors.deviceNumber = 'Cihaz numarası AEGIS-XXX formatında olmalıdır';
        } else {
          delete newErrors.deviceNumber;
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Input handlers
  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleInputFocus = (field: keyof LoginCredentials) => {
    Animated.timing(inputFocusAnim[field], {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const handleInputBlur = (field: keyof LoginCredentials) => {
    Animated.timing(inputFocusAnim[field], {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const handleButtonPressIn = () => {
    Animated.timing(buttonScaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.timing(buttonScaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
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
        // Success animation
        setShowSuccess(true);
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }).start();

        // Delay before navigation
        setTimeout(() => {
          onLoginSuccess(result.user!, rememberMe);
        }, 1500);
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

  // Tema renklerine göre gradient
  const gradientColors = theme.isDark 
    ? ['#1E293B', '#0F172A', '#000000']
    : ['#F8FAFC', '#E2E8F0', '#CBD5E1'];

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Partikül Arka Planı */}
      <View style={styles.particleContainer}>
        {particles.map((particle) => (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x,
                top: particle.y,
                width: particle.size,
                height: particle.size,
                opacity: particle.opacity,
              },
            ]}
          />
        ))}
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Logo/Header */}
        <View style={styles.headerContainer}>
          <Animated.View
            style={[
              styles.logoPulseWrapper,
              {
                transform: [{ scale: logoPulseAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.logoGlowWrapper,
                {
                  shadowOpacity: logoGlowAnim,
                  shadowColor: '#3B82F6', // Daha parlak mavi glow
                },
              ]}
            >
              <Text style={[styles.logo, { textShadowColor: theme.colors.primary }]}>AEGIS</Text>
            </Animated.View>
          </Animated.View>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Güvenlik Sistemi</Text>
          <Text style={[styles.welcomeText, { color: theme.colors.text }]}>Hoş Geldiniz</Text>
        </View>

        {/* Login Form */}
        <View style={[styles.formContainer, { backgroundColor: theme.colors.surface }]}>
          {/* Email/Username Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>E-posta / Kullanıcı Adı</Text>
            <Animated.View
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.colors.background },
                {
                  borderColor: inputFocusAnim.emailOrUsername.interpolate({
                    inputRange: [0, 1],
                    outputRange: [theme.colors.secondary, theme.colors.primary],
                  }),
                  shadowOpacity: inputFocusAnim.emailOrUsername.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.3],
                  }),
                },
              ]}
            >
              <TextInput
                style={[styles.textInput, { color: theme.colors.text }]}
                value={credentials.emailOrUsername}
                onChangeText={(text) => handleInputChange('emailOrUsername', text)}
                onFocus={() => handleInputFocus('emailOrUsername')}
                onBlur={() => handleInputBlur('emailOrUsername')}
                placeholder="admin@aegis.com veya admin"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!isLoading}
              />
            </Animated.View>
            {errors.emailOrUsername && (
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.emailOrUsername}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Şifre</Text>
            <Animated.View
              style={[
                styles.passwordWrapper,
                { backgroundColor: theme.colors.background },
                {
                  borderColor: inputFocusAnim.password.interpolate({
                    inputRange: [0, 1],
                    outputRange: [theme.colors.secondary, theme.colors.primary],
                  }),
                  shadowOpacity: inputFocusAnim.password.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.3],
                  }),
                },
              ]}
            >
              <TextInput
                style={[styles.passwordInput, { color: theme.colors.text }]}
                value={credentials.password}
                onChangeText={(text) => handleInputChange('password', text)}
                onFocus={() => handleInputFocus('password')}
                onBlur={() => handleInputBlur('password')}
                placeholder="password123"
                placeholderTextColor={theme.colors.textMuted}
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
            </Animated.View>
            {errors.password && (
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.password}</Text>
            )}
          </View>

          {/* Device Number Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Cihaz Numarası</Text>
            <Animated.View
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.colors.background },
                {
                  borderColor: inputFocusAnim.deviceNumber.interpolate({
                    inputRange: [0, 1],
                    outputRange: [theme.colors.secondary, theme.colors.primary],
                  }),
                  shadowOpacity: inputFocusAnim.deviceNumber.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.3],
                  }),
                },
              ]}
            >
              <TextInput
                style={[styles.textInput, { color: theme.colors.text }]}
                value={credentials.deviceNumber}
                onChangeText={(text) => handleInputChange('deviceNumber', text)}
                onFocus={() => handleInputFocus('deviceNumber')}
                onBlur={() => handleInputBlur('deviceNumber')}
                placeholder="AEGIS-001"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isLoading}
              />
            </Animated.View>
            {errors.deviceNumber && (
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.deviceNumber}</Text>
            )}
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
              disabled={isLoading}
            >
              <View style={[
                styles.checkbox, 
                { borderColor: theme.colors.secondary },
                rememberMe && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
              ]}>
                {rememberMe && <Text style={[styles.checkmark, { color: theme.colors.text }]}>✓</Text>}
              </View>
              <Text style={[styles.rememberMeText, { color: theme.colors.textSecondary }]}>Beni Hatırla</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <Text style={[styles.forgotPasswordText, { color: theme.colors.info }]}>Şifremi Unuttum</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <Animated.View
            style={{
              transform: [{ scale: buttonScaleAnim }],
            }}
          >
            <TouchableOpacity
              style={[
                styles.loginButton, 
                { backgroundColor: theme.colors.primary },
                isLoading && { backgroundColor: theme.colors.textMuted }
              ]}
              onPress={handleLogin}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.text} size="small" />
              ) : showSuccess ? (
                <Animated.View
                  style={{
                    transform: [{ scale: successAnim }],
                  }}
                >
                  <Text style={[styles.successIcon, { color: theme.colors.success }]}>✓</Text>
                </Animated.View>
              ) : (
                <Text style={[styles.loginButtonText, { color: theme.colors.text }]}>GİRİŞ YAP</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Mock Info */}
        <View style={[styles.mockInfoContainer, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.info }]}>
          <Text style={[styles.mockInfoTitle, { color: theme.colors.textSecondary }]}>Test Kullanıcıları:</Text>
          <Text style={[styles.mockInfoText, { color: theme.colors.textMuted }]}>admin / password123 / AEGIS-001</Text>
          <Text style={[styles.mockInfoText, { color: theme.colors.textMuted }]}>user / password123 / AEGIS-002</Text>
          <Text style={[styles.mockInfoText, { color: theme.colors.textMuted }]}>test / password123 / AEGIS-003</Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    shadowColor: '#FFFFFF',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
  },
  keyboardContainer: {
    flex: 1,
    zIndex: 2,
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
  logoPulseWrapper: {
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 10,
  },
  logoGlowWrapper: {
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    fontSize: Typography['4xl'],
    fontWeight: Typography.bold,
    color: '#FFFFFF', // Beyaz renk - daha belirgin
    letterSpacing: 4,
    marginBottom: Spacing.sm,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: Typography.lg,
    marginBottom: Spacing.md,
  },
  welcomeText: {
    fontSize: Typography.xl,
    fontWeight: Typography.semibold,
  },
  formContainer: {
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
    marginBottom: Spacing.sm,
    fontWeight: Typography.medium,
  },
  inputWrapper: {
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  textInput: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    backgroundColor: 'transparent',
  },
  passwordWrapper: {
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    backgroundColor: 'transparent',
  },
  eyeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  eyeButtonText: {
    fontSize: Typography.lg,
  },
  errorText: {
    fontSize: Typography.sm,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  successIcon: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
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
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
  rememberMeText: {
    fontSize: Typography.sm,
  },
  forgotPasswordText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  loginButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  loginButtonText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    letterSpacing: 1,
  },
  mockInfoContainer: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
  },
  mockInfoTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.sm,
  },
  mockInfoText: {
    fontSize: Typography.xs,
    marginBottom: Spacing.xs,
    fontFamily: 'monospace',
  },
});

export default LoginScreen;
