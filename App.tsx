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
  const [initialRoute, setInitialRoute] = useState<'PreQuestionnaire' | 'MainTabs' | 'PostQuestionnaire'>('PreQuestionnaire');

  const handleAuthStateChanged = useCallback((firebaseUser: FirebaseAuthTypes.User | null) => {
    // Batch state updates together
    unstable_batchedUpdates(() => {
      setUser(firebaseUser);
      // If user exists, go to MainTabs, otherwise PreQuestionnaire
      setInitialRoute(firebaseUser ? 'MainTabs' : 'PreQuestionnaire');
      setInitializing(false);
    });


  }, []); // Empty dependency array since these setters never change

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(handleAuthStateChanged);

    return () => {
      unsubscribe();
    };
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