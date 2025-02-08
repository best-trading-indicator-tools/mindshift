/**
 * MindShift App
 * A mindfulness and personal development application
 *
 * @format
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@rneui/themed';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import AppNavigator from './src/navigation/AppNavigator';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import Superwall, { SubscriptionStatus } from '@superwall/react-native-superwall';
import { SUPERWALL_API_KEY } from '@env';
import { MyPurchaseController } from './src/services/PurchaseController';
import { NavigationContainer } from '@react-navigation/native';
import { createSuperwallOptions, navigationRef, delegate } from './src/services/SuperwallDelegate';

// Disable Reanimated warnings in development
if (__DEV__) {
  const IGNORED_LOGS = [
    'Sending `onAnimatedValueUpdate`',
    'Animated: `useNativeDriver`',
    'RCTBridge required dispatch_sync',
    'Require cycle:',
    'Tried to modify key',
    'Please report: Excessive number of pending callbacks',
    'Maximum update depth exceeded'
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

  // Configuration initiale unique de Superwall
  const purchaseController = new MyPurchaseController();
  const options = createSuperwallOptions();
  
  // Configurer Superwall immédiatement au démarrage
  Superwall.configure(SUPERWALL_API_KEY, options, purchaseController)
    .then(() => {
      Superwall.shared.setDelegate(delegate);
      purchaseController.addSubscriptionStatusListener((hasActiveSubscription: boolean) => {
        const newStatus = hasActiveSubscription ? SubscriptionStatus.ACTIVE : SubscriptionStatus.INACTIVE;
        Superwall.shared.setSubscriptionStatus(newStatus);
      });
    })
    .catch(error => {
      console.error('Failed to configure Superwall:', error);
    });

  const handleAuthStateChanged = useCallback((firebaseUser: FirebaseAuthTypes.User | null) => {
    setUser(firebaseUser);
    setInitialRoute(firebaseUser ? 'MainTabs' : 'PreQuestionnaire');
    setInitializing(false);
  }, []);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(handleAuthStateChanged);
    return () => unsubscribe();
  }, [handleAuthStateChanged]);

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
          <NavigationContainer ref={navigationRef}>
            <AppNavigator initialRoute={initialRoute} />
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;