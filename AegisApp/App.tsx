/**
 * AegisApp - Güvenlik Uygulaması
 * React Native ile geliştirilmiş iOS uygulaması
 *
 * @format
 */

import React from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from './src/constants/theme';
import { AuthProvider, useAuth } from './src/utils/authContext';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';

// Ana uygulama içeriği
const AppContent: React.FC = () => {
  const { authState, login, isLoading } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Authentication kontrolü
  if (!authState.isAuthenticated) {
    return (
      <LoginScreen 
        onLoginSuccess={(user, rememberMe) => login(user, rememberMe)} 
      />
    );
  }

  // Ana uygulama
  return <HomeScreen />;
};

export default function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
