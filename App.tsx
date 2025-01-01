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
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getQuestionnaireStatus } from './src/services/questionnaireService';
import 'react-native-reanimated';

function App(): JSX.Element {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initialRoute, setInitialRoute] = useState<'PreQuestionnaire' | 'MainTabs' | 'Login'>('PreQuestionnaire');

  const onAuthStateChanged = useCallback(async (user: FirebaseAuthTypes.User | null) => {
    setUser(user);
    if (user) {
      // If user is logged in, check if they've completed the questionnaire
      const questionnaireStatus = await getQuestionnaireStatus();
      if (questionnaireStatus === 'completed') {
        setInitialRoute('MainTabs');
      } else {
        // Known user but hasn't completed questionnaire - send to login
        setInitialRoute('Login');
      }
    } else {
      // If no user, show pre-questionnaire
      setInitialRoute('PreQuestionnaire');
    }
  }, []);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (user) => {
      await onAuthStateChanged(user);
      setInitializing(false);
    });
    return subscriber;
  }, [onAuthStateChanged]);

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
          <AppNavigator initialRoute={initialRoute} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;