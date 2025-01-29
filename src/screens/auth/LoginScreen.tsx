import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const handleGoogleSignIn = useCallback(async () => {
    try {
      // ... code de login Google ...
      
      requestAnimationFrame(() => {
        navigation.navigate('PostQuestionnaire');
      });
    } catch (error) {
      console.error('Google sign in failed:', error);
    }
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* ... rest of your component JSX ... */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default LoginScreen; 