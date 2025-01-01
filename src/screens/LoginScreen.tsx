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
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication';
import { LoginScreenProps } from '../types/auth.types';
import { createUserProfile } from '../services/firebase';
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
  const loadingOpacity = useSharedValue(0);
  const loadingScale = useSharedValue(1);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const emailAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(emailFocus.value ? 1.02 : 1) }],
    borderWidth: withTiming(emailFocus.value ? 1 : 0),
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: withTiming(emailFocus.value ? 0.2 : 0),
    shadowRadius: withTiming(emailFocus.value ? 8 : 0),
    elevation: withTiming(emailFocus.value ? 3 : 0),
  }));

  const passwordAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(passwordFocus.value ? 1.02 : 1) }],
    borderWidth: withTiming(passwordFocus.value ? 1 : 0),
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: withTiming(passwordFocus.value ? 0.2 : 0),
    shadowRadius: withTiming(passwordFocus.value ? 8 : 0),
    elevation: withTiming(passwordFocus.value ? 3 : 0),
  }));

  const loadingAnimatedStyle = useAnimatedStyle(() => ({
    opacity: loadingOpacity.value,
    transform: [{ scale: loadingScale.value }],
  }));

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

  const setLoadingWithAnimation = (isLoading: boolean) => {
    loadingOpacity.value = withTiming(isLoading ? 1 : 0, { duration: 200 });
    if (isLoading) {
      loadingScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600 }),
          withTiming(0.9, { duration: 600 }),
        ),
        -1,
        true
      );
    } else {
      loadingScale.value = 1;
    }
    setLoading(isLoading);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError(null);
    }
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
    } else if (password.startsWith(' ') || password.endsWith(' ')) {
      setPasswordError('Password cannot start or end with spaces');
    } else {
      setPasswordError(null);
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
    setShowValidation(true);
    validateEmail(email);
    validatePassword(password);
    
    if (emailError || passwordError || !email || !password) {
      return;
    }

    try {
      setLoadingWithAnimation(true);
      setError(null);
      
      let userCredential: FirebaseAuthTypes.UserCredential;
      
      if (isSignUp) {
        userCredential = await auth().createUserWithEmailAndPassword(email, password);
        await createUserProfile(userCredential.user);
      } else {
        userCredential = await auth().signInWithEmailAndPassword(email, password);
      }
      
      navigation.replace('PostQuestionnaire');
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoadingWithAnimation(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoadingWithAnimation(true);
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
      navigation.replace('PostQuestionnaire');
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoadingWithAnimation(false);
    }
  };

  const signInWithApple = async () => {
    try {
      setLoadingWithAnimation(true);
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
        navigation.replace('PostQuestionnaire');
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
      setLoadingWithAnimation(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      if (!email.trim()) {
        setError('Please enter your email address first');
        return;
      }
      setLoadingWithAnimation(true);
      await auth().sendPasswordResetEmail(email);
      setError(null);
      // Show success message instead of error
      Alert.alert(
        'Reset Email Sent',
        'Check your email for instructions to reset your password.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoadingWithAnimation(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#121212', '#1a1a1a', '#121212']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[styles.gradientBackground, { paddingTop: insets.top }]}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom }
            ]}
          >
            <View style={styles.content}>
              <Text style={styles.title}>MindShift</Text>
              <Text style={styles.subtitle}>Sign {isSignUp ? 'up' : 'in'} to continue</Text>

              {error && <Text style={styles.error}>{error}</Text>}

              <Animated.View style={[styles.inputContainer, emailAnimatedStyle]}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={handleEmailChange}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  onFocus={() => (emailFocus.value = 1)}
                  onBlur={() => {
                    emailFocus.value = 0;
                  }}
                />
                {showValidation && emailError && (
                  <Text style={styles.inputError}>{emailError}</Text>
                )}
              </Animated.View>

              <Animated.View style={[styles.inputContainer, passwordAnimatedStyle]}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => (passwordFocus.value = 1)}
                  onBlur={() => {
                    passwordFocus.value = 0;
                  }}
                />
                {showValidation && passwordError && (
                  <Text style={styles.inputError}>{passwordError}</Text>
                )}
              </Animated.View>

              {!isSignUp && (
                <TouchableOpacity 
                  style={styles.forgotPasswordContainer}
                  onPress={handleForgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.buttonContainer}
                onPress={handleEmailAuth}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFC000', '#FFD700']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={[styles.gradientButton, {
                    shadowColor: '#FFD700',
                  }]}
                >
                  <Text style={styles.buttonText}>
                    {isSignUp ? 'Sign Up' : 'Sign In'} with Email
                  </Text>
                </LinearGradient>
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
                color={GoogleSigninButton.Color.Light}
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
          <Animated.View style={[styles.loadingContainer, loadingAnimatedStyle]}>
            <LinearGradient
              colors={['#FFD700', '#FFC000']}
              style={styles.loadingIndicatorContainer}
            >
              <ActivityIndicator size="large" color="#000" />
            </LinearGradient>
          </Animated.View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  gradientBackground: {
    flex: 1,
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
    marginTop: -160,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'sans-serif-medium',
    }),
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#1E1E1E',
    overflow: 'visible',
  },
  input: {
    width: '100%',
    padding: 15,
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    width: '100%',
    height: 50,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  switchAuthMode: {
    marginBottom: 20,
  },
  switchAuthText: {
    color: '#FFD700',
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
    width: 200,
    height: 60,
    alignSelf: 'center',
    marginTop: 20,
  },
  appleButton: {
    width: 200,
    height: 50,
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
  loadingIndicatorContainer: {
    padding: 20,
    borderRadius: 15,
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  forgotPasswordContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  inputError: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    marginBottom: -8,
  },
});

export default LoginScreen;