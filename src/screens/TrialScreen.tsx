import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import LinearGradient from 'react-native-linear-gradient';
import Sound from 'react-native-sound';
import ConfettiOverlay from '../components/ConfettiOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'Trial'>;

const TrialScreen: React.FC<Props> = ({ navigation }) => {
  const soundRef = useRef<Sound | null>(null);

  useEffect(() => {
    let isMounted = true;
    Sound.setCategory('Playback');

    // Create and load the sound file
    const sound = new Sound(require('../assets/audio/haveagreatday.wav'), (error) => {
      if (error || !isMounted) {
        console.error('Failed to load sound', error);
        return;
      }

      // Store the sound instance in ref
      soundRef.current = sound;
      
      // Disable looping
      sound.setNumberOfLoops(0);
      
      // Start playback
      sound.play((success) => {
        if (!success) {
          console.log('Sound playback failed');
        }
      });
    });

    // Cleanup function
    return () => {
      isMounted = false;
      
      // Clean up sound if it exists - do it synchronously
      if (soundRef.current) {
        try {
          soundRef.current.stop();
          soundRef.current.release();
        } catch (error) {
          console.warn('Error during sound cleanup:', error);
        }
        soundRef.current = null;
      }
    };
  }, []);

  const handleStartTrial = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#121212', '#121212']}
        style={styles.gradient}
      >
        <ConfettiOverlay />
        
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to MindShift</Text>
          
          <Text style={styles.subtitle}>
            To provide you with a personalized experience, we'll start with a brief questionnaire about your mental well-being.
          </Text>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>
              This helps us:
            </Text>
            {[
              'Understand your unique needs',
              'Customize exercises for you',
              'Track your progress effectively',
              'Provide relevant recommendations',
              'Adapt to your goals'
            ].map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.joinText}>
            It takes just 2 minutes, and helps us tailor your experience.
          </Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#FFD700' }]}
            onPress={handleStartTrial}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  gradient: {
    flex: 1,
    padding: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.9,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 40,
  },
  benefitsTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
    opacity: 0.9,
    textAlign: 'center',
  },
  benefitRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  bullet: {
    color: '#6366f1',
    fontSize: 16,
    marginRight: 8,
    fontWeight: 'bold',
  },
  benefitText: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.9,
    flex: 1,
  },
  joinText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    maxWidth: 300,
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default TrialScreen; 