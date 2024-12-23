/**
 * MindShift App
 * A mindfulness and personal development application
 *
 * @format
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@rneui/themed';
import AppNavigator from './src/navigation/AppNavigator';

function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;