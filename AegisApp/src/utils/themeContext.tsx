/**
 * AegisApp - Tema Context
 * Light/Dark tema yönetimi
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tema tipleri
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Ana renkler
  primary: string;
  secondary: string;
  
  // Arka plan renkleri
  background: string;
  surface: string;
  
  // Metin renkleri
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // Durum renkleri
  success: string;
  warning: string;
  danger: string;
  info: string;
  
  // Özel renkler
  orange: string;
  teal: string;
  
  // Şeffaflık
  overlay: string;
  overlayLight: string;
}

export interface Theme {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
}

interface ThemeContextType {
  theme: Theme;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Storage key
const THEME_KEY = '@aegis_theme_mode';

// Light tema renkleri
const lightColors: ThemeColors = {
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
};

// Dark tema renkleri
const darkColors: ThemeColors = {
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
  orange: '#F97316', // Turuncu
  teal: '#14B8A6', // Teal
  
  // Şeffaflık
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [isLoading, setIsLoading] = useState(true);

  // Tema oluşturma fonksiyonu
  const createTheme = (mode: ThemeMode): Theme => {
    const isDark = mode === 'dark' || (mode === 'system' && true); // System için şimdilik dark kullanıyoruz
    return {
      colors: isDark ? darkColors : lightColors,
      isDark,
      mode,
    };
  };

  const [theme, setTheme] = useState<Theme>(createTheme('dark'));

  // Tema modunu değiştirme
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      setTheme(createTheme(mode));
      await AsyncStorage.setItem(THEME_KEY, mode);
    } catch (error) {
      console.error('Theme mode save error:', error);
    }
  };

  // Tema toggle
  const toggleTheme = () => {
    const newMode = theme.isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  // Başlangıçta kayıtlı tema modunu yükle
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_KEY);
        if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system')) {
          setThemeModeState(savedMode as ThemeMode);
          setTheme(createTheme(savedMode as ThemeMode));
        }
      } catch (error) {
        console.error('Theme mode load error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemeMode();
  }, []);

  // Loading state
  if (isLoading) {
    return null; // veya loading spinner
  }

  const value: ThemeContextType = {
    theme,
    setThemeMode,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
