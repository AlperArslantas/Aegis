/**
 * Sentinel App - Ana Uygulama Dosyası
 * Akıllı kapı zili ve yangın tespit sistemi
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Colors } from './src/constants/theme';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  return (
    <>
      <HomeScreen />
      <StatusBar style="light" backgroundColor={Colors.background} />
    </>
  );
}
