/**
 * AegisApp - Tema ve Renk Paleti
 * Güvenlik uygulaması için tema sistemi
 */

import { ThemeColors } from '../utils/themeContext';

// Dark tema renkleri (varsayılan)
export const DarkColors: ThemeColors = {
  // Ana renkler
  primary: '#1E293B', // Koyu lacivert
  secondary: '#334155', // Orta gri
  
  // Arka plan renkleri
  background: '#0F172A', // Çok koyu lacivert
  surface: '#1E293B', // Yüzey rengi
  
  // Metin renkleri
  text: '#FFFFFF', // Beyaz
  textSecondary: '#94A3B8', // Açık gri
  textMuted: '#64748B', // Orta gri
  
  // Durum renkleri
  success: '#10B981', // Yeşil
  warning: '#F59E0B', // Turuncu
  danger: '#EF4444', // Kırmızı
  info: '#3B82F6', // Mavi
  
  // Özel renkler
  orange: '#F97316', // Turuncu (butonlar için)
  teal: '#14B8A6', // Teal (nem sensörü)
  
  // Şeffaflık
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

// Light tema renkleri
export const LightColors: ThemeColors = {
  // Ana renkler
  primary: '#3B82F6', // Mavi
  secondary: '#E5E7EB', // Açık gri
  
  // Arka plan renkleri
  background: '#FFFFFF', // Beyaz
  surface: '#F9FAFB', // Çok açık gri
  
  // Metin renkleri
  text: '#111827', // Koyu gri
  textSecondary: '#6B7280', // Orta gri
  textMuted: '#9CA3AF', // Açık gri
  
  // Durum renkleri
  success: '#10B981', // Yeşil
  warning: '#F59E0B', // Turuncu
  danger: '#EF4444', // Kırmızı
  info: '#3B82F6', // Mavi
  
  // Özel renkler
  orange: '#F97316', // Turuncu
  teal: '#14B8A6', // Teal
  
  // Şeffaflık
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

// Geriye uyumluluk için (deprecated - useTheme hook kullanın)
export const Colors = DarkColors;

export const Typography = {
  // Font boyutları
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  
  // Font ağırlıkları
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  
  // Font ailesi
  fontFamily: 'System', // iOS/Android sistem fontu
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;
