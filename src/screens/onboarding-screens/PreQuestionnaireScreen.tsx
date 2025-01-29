import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import { LOTTIE_ANIMATIONS } from '../onboarding-screens/QuestionnaireScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'PreQuestionnaire'>;

const PreQuestionnaireScreen: React.FC<Props> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const buttonScale = new Animated.Value(1);

  useEffect(() => {
    // Simuler un temps de chargement pour précharger les animations
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    if (!isLoading) {
      navigation.navigate('Questionnaire');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E3A5F', '#2D5F7C']}
        style={styles.gradient}
        start={{x: 0.5, y: 0}}
        end={{x: 0.5, y: 1}}
      >
        {/* Préchargement invisible des animations */}
        <View style={{ position: 'absolute', opacity: 0 }}>
          {Object.values(LOTTIE_ANIMATIONS).map((animation, index) => (
            <LottieView
              key={index}
              source={animation}
              style={{ width: 1, height: 1 }}
              autoPlay={false}
            />
          ))}
        </View>

        <View style={styles.content}>
          <View style={styles.mainContent}>
            <View style={styles.animationContainer}>
              <LottieView
                source={require('../../assets/illustrations/questionnaire/positivity.lottie')}
                autoPlay
                loop
                style={styles.animation}
              />
            </View>

            <Text style={styles.subtitle}>
              Please take <Text style={styles.boldText}>2 minutes</Text> to answer a few questions, and let us create your personalized journey to positivity.
            </Text>

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>
                This helps us:
              </Text>
              {[
                'Discover what matters most to you',
                'Get exercises tailored to your growth',
                'Track your progress and celebrate milestones',
                'Receive recommendations that work for you',
                'Align your journey with your goals'
              ].map((benefit, index) => (
                <View key={index} style={styles.benefitRow}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={1}
            onPress={handleGetStarted}
            disabled={isLoading}
          >
            <Animated.View style={[
              styles.button,
              {
                opacity: isLoading ? 0.7 : 1
              }
            ]}>
              <Text style={styles.buttonText}>
                {isLoading ? 'Loading...' : 'Feel Better Today'}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  animationContainer: {
    height: 160,
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  animation: {
    width: '80%',
    height: '100%',
  },
  subtitle: {
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  benefitsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  benefitsTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 20,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4AF37',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  benefitText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  button: {
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default PreQuestionnaireScreen; 