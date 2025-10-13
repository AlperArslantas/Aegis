/**
 * AegisApp - Authentication Context
 * Kullanıcı kimlik doğrulama state yönetimi
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  authState: AuthState;
  login: (user: User, rememberMe?: boolean) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // AsyncStorage keys
  const USER_KEY = '@aegis_user';
  const REMEMBER_ME_KEY = '@aegis_remember_me';

  // Initialize auth state from storage
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      const [storedUser, storedRememberMe] = await Promise.all([
        AsyncStorage.getItem(USER_KEY),
        AsyncStorage.getItem(REMEMBER_ME_KEY),
      ]);

      if (storedUser && storedRememberMe === 'true') {
        const user: User = JSON.parse(storedUser);
        setAuthState({
          isAuthenticated: true,
          user,
          rememberMe: true,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          rememberMe: false,
        });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        rememberMe: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (user: User, rememberMe: boolean = false) => {
    try {
      setAuthState({
        isAuthenticated: true,
        user,
        rememberMe,
      });

      if (rememberMe) {
        await AsyncStorage.multiSet([
          [USER_KEY, JSON.stringify(user)],
          [REMEMBER_ME_KEY, 'true'],
        ]);
      } else {
        // Clear storage if not remembering
        await AsyncStorage.multiRemove([USER_KEY, REMEMBER_ME_KEY]);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      setAuthState({
        isAuthenticated: false,
        user: null,
        rememberMe: false,
      });

      // Clear storage
      await AsyncStorage.multiRemove([USER_KEY, REMEMBER_ME_KEY]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    authState,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
