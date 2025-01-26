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
  Alert,
} from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { LoginScreenProps } from '../../types/auth.types';
import { createUserProfile } from '../../services/firebase';
import Config from 'react-native-config';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useAnimatedStyle, 
  withTiming,
  useSharedValue,
  withSequence,
  withRepeat,
} from 'react-native-reanimated';

GoogleSignin.configure({
  webClientId: Config.FIREBASE_CLIENT_ID,
});

interface GoogleSignInError {
  code: string | number;
  message: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const emailFocus = useSharedValue(0);
  const passwordFocus = useSharedValue(0);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const emailAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(emailFocus.value ? 1.02 : 1) }],
    borderWidth: withTiming(emailFocus.value ? 1 : 0),
    borderColor: '#64B5F6',
    shadowColor: '#64B5F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: withTiming(emailFocus.value ? 0.2 : 0),
    shadowRadius: withTiming(emailFocus.value ? 8 : 0),
    elevation: withTiming(emailFocus.value ? 3 : 0),
  }));

  const passwordAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(passwordFocus.value ? 1.02 : 1) }],
    borderWidth: withTiming(passwordFocus.value ? 1 : 0),
    borderColor: '#64B5F6',
    shadowColor: '#64B5F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: withTiming(passwordFocus.value ? 0.2 : 0),
    shadowRadius: withTiming(passwordFocus.value ? 8 : 0),
    elevation: withTiming(passwordFocus.value ? 3 : 0),
  }));

  const handleAuthError = (error: unknown) => {
    setLoading(false);
    
    // Log the full error object for debugging
    console.log('Full error object:', error);

    // Handle specific error codes including getTokens
    if (typeof error === 'object' && error !== null && 'code' in error && 
        (error.code === 12501 || error.code === 'getTokens')) {
      setError(null);
      return;
    }

    const isGoogleError = (err: unknown): err is GoogleSignInError =>
      typeof err === 'object' && err !== null && 'code' in err;

    if (isGoogleError(error)) {
      const errorCode = error.code;
      switch (errorCode) {
        case statusCodes.SIGN_IN_CANCELLED:
        case 12501: // Android cancellation code
        case 'getTokens': // iOS cancellation code
          setError(null);
          break;
        case statusCodes.IN_PROGRESS:
          setError('A sign in attempt is already in progress');
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          setError('Google Play services are not available. Please check your device settings.');
          break;
        default:
          if (typeof error === 'object' && error !== null && 'message' in error && 
              typeof error.message === 'string' && 
              (error.message.toLowerCase().includes('cancel') || 
               error.message.toLowerCase().includes('cancelled') ||
               error.message.toLowerCase().includes('getTokens requires a user'))) {
            setError(null);
          } else {
            setError('Unable to sign in with Google at the moment. Please try again later.');
          }
      }
    } else if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('cancel') || 
          errorMessage.includes('cancelled') ||
          errorMessage.includes('gettokens requires a user')) {
        setError(null);
      } else if (errorMessage.includes('network')) {
        setError('Please check your internet connection and try again');
      } else if (errorMessage.includes('timeout')) {
        setError('The request took too long. Please check your connection and try again');
      } else {
        setError('Something went wrong. Please try again or use another sign in method');
      }
    } else {
      setError('Unable to complete sign in. Please try again or use another method');
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const error = !email ? 'Email is required' 
                : !emailRegex.test(email) ? 'Please enter a valid email address'
                : null;
    if (error !== emailError) {
      setEmailError(error);
    }
  };

  const validatePassword = (password: string) => {
    const error = !password ? 'Password is required' : null;
    if (error !== passwordError) {
      setPasswordError(error);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (showValidation) {
      validateEmail(text);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (showValidation) {
      validatePassword(text);
    }
  };

  const handleEmailAuth = async () => {
    validateEmail(email);
    validatePassword(password);
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      console.log('🔑 LoginScreen: Starting email authentication');
      setLoading(true);
      setError(null);
      
      let userCredential: FirebaseAuthTypes.UserCredential;
      
      if (isSignUp) {

        userCredential = await auth().createUserWithEmailAndPassword(email, password);
        await createUserProfile(userCredential.user);
      } else {
        userCredential = await auth().signInWithEmailAndPassword(email, password);
      }
      
      navigation.replace('PostQuestionnaire');
    } catch (error: any) {
      if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else {
        handleAuthError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🔑 LoginScreen: Starting Google sign in');
      setLoading(true);
      setError(null);
      
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const { accessToken } = await GoogleSignin.getTokens();
      
      if (!accessToken) {
        throw new Error('No access token present in Google Sign In response');
      }

      console.log('🔄 LoginScreen: Got Google access token, creating credential');
      const googleCredential = auth.GoogleAuthProvider.credential(null, accessToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      await createUserProfile(userCredential.user);
      
      console.log('🚀 LoginScreen: Google sign in successful, navigating to PostQuestionnaire');
      navigation.replace('PostQuestionnaire');
    } catch (error) {
      console.error('❌ LoginScreen: Google sign in error:', error);
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    try {
      console.log('🔑 LoginScreen: Starting Apple sign in');
      setLoading(true);
      setError(null);

      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      const { identityToken, nonce } = appleAuthRequestResponse;
      
      if (identityToken) {
        console.log('🔄 LoginScreen: Got Apple identity token, creating credential');
        const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);
        const userCredential = await auth().signInWithCredential(appleCredential);
        await createUserProfile(userCredential.user);
        
        console.log('🚀 LoginScreen: Apple sign in successful, navigating to PostQuestionnaire');
        navigation.replace('PostQuestionnaire');
      } else {
        throw new Error('No identity token provided');
      }
    } catch (error: any) {
      console.error('❌ LoginScreen: Apple sign in error:', error);
      if (error.code === 1000) {
        setError('Please ensure you are signed in to your Apple ID in device settings and try again');
      } else {
        handleAuthError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      if (!email.trim()) {
        setError('Please enter your email address first');
        return;
      }
      setLoading(true);
      await auth().sendPasswordResetEmail(email);
      setError(null);
      Alert.alert(
        'Reset Email Sent',
        'Check your email for instructions to reset your password.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient 
      colors={['#0F172A', '#1E3A5F', '#2D5F7C']}
      style={styles.container}
      start={{x: 0.5, y: 0}}
      end={{x: 0.5, y: 1}}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          <View style={styles.contentContainer}>
            <Text style={styles.title}>Welcome to Mindshift</Text>
            
            {/* Error Message - Moved to top for better visibility */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Error</Text>
                <Text style={styles.errorMessage}>{error}</Text>
              </View>
            )}

            {/* Email Input */}
            <Animated.View style={[styles.inputContainer, emailAnimatedStyle]}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={email}
                onChangeText={handleEmailChange}
                onFocus={() => emailFocus.value = 1}
                onBlur={() => emailFocus.value = 0}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Animated.View>
            {emailError && <Text style={styles.errorText}>{emailError}</Text>}

            {/* Password Input */}
            <Animated.View style={[styles.inputContainer, passwordAnimatedStyle]}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={password}
                onChangeText={handlePasswordChange}
                onFocus={() => passwordFocus.value = 1}
                onBlur={() => passwordFocus.value = 0}
                secureTextEntry
              />
            </Animated.View>
            {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

            {/* Forgot Password Link */}
            {!isSignUp && (
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Email Sign In/Up Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleEmailAuth}
              disabled={loading}>
              <Text style={styles.buttonText}>
                {isSignUp ? 'Sign Up with Email' : 'Sign In with Email'}
              </Text>
            </TouchableOpacity>

            {/* Toggle Sign In/Up */}
            <TouchableOpacity
              onPress={() => setIsSignUp(!isSignUp)}
              style={styles.toggleButton}>
              <Text style={styles.toggleText}>
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            {/* Google Sign In Button */}
            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton]}
              onPress={signInWithGoogle}
              disabled={loading}>
              <Image
                source={require('../../assets/illustrations/icons/google-icon.png')}
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Apple Sign In Button */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton]}
                onPress={signInWithApple}
                disabled={loading}>
                <Image
                  source={require('../../assets/illustrations/icons/apple-icon.png')}
                  style={styles.socialIcon}
                />
                <Text style={styles.socialButtonText}>Continue with Apple</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 50,
    marginTop: 50
  },
  inputContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 4,
  },
  input: {
    padding: 15,
    color: '#FFFFFF',
    fontSize: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#64B5F6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    marginBottom: 20,
  },
  toggleText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 20
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: '#FFFFFF',
    paddingHorizontal: 10,
  },
  socialButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    height: 74,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  appleButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  socialIcon: {
    width: 70,
    height: 70,
    marginRight: 20,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginRight: 50,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 15,
    alignSelf: 'flex-start',
    paddingLeft: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 15,
    marginTop: 5,
  },
  forgotPasswordText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 10,
  },
  errorContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorTitle: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  errorMessage: {
    color: '#FF6B6B',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default LoginScreen;