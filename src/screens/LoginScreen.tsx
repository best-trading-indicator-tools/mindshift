import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication';
import { LoginScreenProps } from '../types/auth.types';
import { createUserProfile } from '../services/firebase';
import Config from 'react-native-config';

GoogleSignin.configure({
  webClientId: Config.FIREBASE_CLIENT_ID,
});

interface GoogleSignInError {
  code: string | number;
  message: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuthError = (error: unknown) => {
    setLoading(false);
    const isGoogleError = (err: unknown): err is GoogleSignInError =>
      typeof err === 'object' && err !== null && 'code' in err;

    if (isGoogleError(error)) {
      const errorCode = error.code;
      switch (errorCode) {
        case statusCodes.SIGN_IN_CANCELLED:
          setError('Sign in was cancelled');
          break;
        case statusCodes.IN_PROGRESS:
          setError('Sign in is already in progress');
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          setError('Play services are not available');
          break;
        default:
          setError(error.message || 'An error occurred during Google sign in');
      }
    } else if (error instanceof Error) {
      setError(error.message);
    } else {
      setError('An unexpected error occurred');
    }
  };

  const handleEmailAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let userCredential: FirebaseAuthTypes.UserCredential;
      
      if (isSignUp) {
        userCredential = await auth().createUserWithEmailAndPassword(email, password);
        await createUserProfile(userCredential.user);
      } else {
        userCredential = await auth().signInWithEmailAndPassword(email, password);
      }
      
      navigation.replace('MainTabs');
    } catch (error) {
      handleAuthError(error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const { accessToken } = await GoogleSignin.getTokens();
      
      if (!accessToken) {
        throw new Error('No access token present in Google Sign In response');
      }

      const googleCredential = auth.GoogleAuthProvider.credential(null, accessToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      await createUserProfile(userCredential.user);
      navigation.replace('MainTabs');
    } catch (error) {
      handleAuthError(error);
    }
  };

  const signInWithApple = async () => {
    try {
      setLoading(true);
      setError(null);

      // Request credentials
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      const { identityToken, nonce } = appleAuthRequestResponse;
      
      if (identityToken) {
        const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);
        const userCredential = await auth().signInWithCredential(appleCredential);
        await createUserProfile(userCredential.user);
        navigation.replace('MainTabs');
      } else {
        throw new Error('No identity token provided');
      }
    } catch (error: any) {
      console.log('Apple Sign In Error:', error);
      if (error.code === 1000) {
        setError('Please ensure you are signed in to your Apple ID in device settings and try again');
      } else {
        handleAuthError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>MindShift</Text>
            <Text style={styles.subtitle}>Sign {isSignUp ? 'up' : 'in'} to continue</Text>

            {error && <Text style={styles.error}>{error}</Text>}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.button, styles.emailButton]}
              onPress={handleEmailAuth}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {isSignUp ? 'Sign Up' : 'Sign In'} with Email
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsSignUp(!isSignUp)}
              style={styles.switchAuthMode}
            >
              <Text style={styles.switchAuthText}>
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <GoogleSigninButton
              style={styles.googleButton}
              size={GoogleSigninButton.Size.Wide}
              color={GoogleSigninButton.Color.Dark}
              onPress={signInWithGoogle}
              disabled={loading}
            />

            {Platform.OS === 'ios' && (
              <AppleButton
                buttonStyle={AppleButton.Style.WHITE}
                buttonType={AppleButton.Type.SIGN_IN}
                style={styles.appleButton}
                onPress={signInWithApple}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 16,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  emailButton: {
    backgroundColor: '#4285F4',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchAuthMode: {
    marginBottom: 20,
  },
  switchAuthText: {
    color: '#4285F4',
    fontSize: 14,
  },
  divider: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#888',
    paddingHorizontal: 10,
  },
  googleButton: {
    width: 280,
    height: 55,
    marginBottom: 16,
  },
  appleButton: {
    width: 280,
    height: 55,
  },
  error: {
    color: '#ff6b6b',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
});

export default LoginScreen;
