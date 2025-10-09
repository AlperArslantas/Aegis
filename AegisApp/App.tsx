/**
 * AegisApp - Güvenlik Uygulaması
 * React Native ile geliştirilmiş iOS uygulaması
 *
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { Colors } from './src/constants/theme';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  return (
    <>
      <HomeScreen />
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
    </>
  );
}
