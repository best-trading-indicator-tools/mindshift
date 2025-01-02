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
import { ActivityIndicator, View, unstable_batchedUpdates } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getQuestionnaireStatus } from './src/services/questionnaireService';
import 'react-native-reanimated';

function App(): JSX.Element {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initialRoute] = useState<'PreQuestionnaire'>('PreQuestionnaire');

  const handleAuthStateChanged = useCallback((firebaseUser: FirebaseAuthTypes.User | null) => {
    console.log('👤 App.tsx: Auth state changed:', {
      userExists: !!firebaseUser,
      userEmail: firebaseUser?.email,
      timestamp: new Date().toISOString()
    });

    // Batch state updates together
    unstable_batchedUpdates(() => {
      setUser(firebaseUser);
      setInitializing(false);
    });

    console.log('✅ App.tsx: State update complete', {
      userExists: !!firebaseUser,
      isInitializing: false,
      timestamp: new Date().toISOString()
    });
  }, []); // Empty dependency array since these setters never change

  useEffect(() => {
    console.log('🔄 App.tsx: Setting up auth state listener');
    const unsubscribe = auth().onAuthStateChanged(handleAuthStateChanged);

    return () => {
      console.log('🔚 App.tsx: Cleaning up auth state listener');
      unsubscribe();
    };
  }, [handleAuthStateChanged]);

  const memoizedNavigator = React.useMemo(() => {
    console.log('🧭 App.tsx: Creating memoized navigator with route:', initialRoute);
    return <AppNavigator initialRoute={initialRoute} />;
  }, [initialRoute]);

  if (initializing) {
    console.log('⌛ App.tsx: Still initializing, showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  console.log('🚀 App.tsx: Rendering main app UI');
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