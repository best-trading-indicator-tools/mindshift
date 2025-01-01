/**
 * MindShift App
 * A mindfulness and personal development application
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    let isMounted = true;

    // Store the unsubscribe function directly
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (!isMounted) return;

      // Batch state updates together
      const updates = async () => {
        try {
          if (!firebaseUser) {
            return {
              user: null,
              route: 'PreQuestionnaire' as const
            };
          }

          const questionnaireStatus = await getQuestionnaireStatus();
          return {
            user: firebaseUser,
            route: questionnaireStatus === 'completed' ? 'MainTabs' : 'Login'
          } as const;
        } catch (error) {
          console.error('Error checking questionnaire status:', error);
          // If there's an error checking questionnaire status, default to Login for authenticated users
          return {
            user: firebaseUser,
            route: 'Login' as const
          };
        }
      };

      const result = await updates();
      
      // Apply updates only if component is still mounted
      if (isMounted) {
        setUser(result.user);
        setInitialRoute(result.route);
        setInitializing(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe(); // Properly call the unsubscribe function
    };
  }, []); // Empty dependency array as this should only run once on mount

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