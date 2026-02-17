/**
 * AegisApp - Type Tanımları
 */

export interface SensorData {
  temperature: number;
  humidity: number;
  airQuality: AirQualityStatus;
  fireDetected?: boolean;
  motionDetected?: boolean;
}

export type AirQualityStatus = 'excellent' | 'good' | 'moderate' | 'poor' | 'hazardous';

// Kapı durumu
export interface DoorStatus {
  isLocked: boolean;
  isRinging: boolean;
}

export interface VideoStream {
  isLive: boolean;
  timestamp: string;
  source: string;
}

export interface DoorCall {
  id: string;
  isActive: boolean;
  caller: string;
  timestamp: string;
}

export interface AppState {
  isDoorUnlocked: boolean;
  isMicrophoneActive: boolean;
  currentScreen: 'home' | 'history' | 'settings';
}

export interface NavigationTab {
  key: string;
  title: string;
  icon: string;
}

// Login/Authentication Types
export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  deviceNumber: string;
  name: string;
  role: 'admin' | 'user';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  rememberMe: boolean;
}
