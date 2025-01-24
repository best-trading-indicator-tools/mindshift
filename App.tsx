/**
 * MindShift App
 * A mindfulness and personal development application
 *
 * @format
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@rneui/themed';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import AppNavigator from './src/navigation/AppNavigator';
import { ActivityIndicator, View, unstable_batchedUpdates, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getQuestionnaireStatus } from './src/services/questionnaireService';
import { enableScreens } from 'react-native-screens';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

// Disable Reanimated warnings in development
if (__DEV__) {
  const IGNORED_LOGS = [
    'Sending `onAnimatedValueUpdate`',
    'Animated: `useNativeDriver`',
    'RCTBridge required dispatch_sync',
    'Require cycle:',
    'Tried to modify key',
    'Please report: Excessive number of pending callbacks',
  ];

  const oldConsoleWarn = console.warn;
  console.warn = (...args) => {
    if (IGNORED_LOGS.some(log => args[0] && args[0].includes(log))) return;
    oldConsoleWarn.apply(console, args);
  };
}

// Enable screens
enableScreens();

function App(): JSX.Element {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initialRoute, setInitialRoute] = useState<'PreQuestionnaire' | 'MainTabs' | 'PostQuestionnaire'>('PreQuestionnaire');
  const [hasInitialized, setHasInitialized] = useState(false);

  const handleAuthStateChanged = useCallback((firebaseUser: FirebaseAuthTypes.User | null) => {
    if (!hasInitialized) {
      unstable_batchedUpdates(() => {
        setUser(firebaseUser);
        setInitialRoute(firebaseUser ? 'MainTabs' : 'PreQuestionnaire');
        setInitializing(false);
        setHasInitialized(true);
      });
    } else {
      setUser(firebaseUser);
    }
  }, [hasInitialized]);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(handleAuthStateChanged);
    return () => unsubscribe();
  }, [handleAuthStateChanged]);

  const memoizedNavigator = React.useMemo(() => {
    return <AppNavigator initialRoute={initialRoute} />;
  }, [initialRoute]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          {memoizedNavigator}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;