import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import LinearGradient from 'react-native-linear-gradient';
import Sound from 'react-native-sound';

import { getQuestionnaireResponses } from '../../services/questionnaireService';
import RNFS from 'react-native-fs';

type Props = NativeStackScreenProps<RootStackParamList, 'PostQuestionnaire'>;

const setupAudioFile = async (url: string): Promise<string> => {
  const filename = 'haveagreatday.wav';
  const localPath = `${RNFS.CachesDirectoryPath}/${filename}`;

  try {
    const exists = await RNFS.exists(localPath);
    if (exists) {
      return localPath;
    }

    await RNFS.downloadFile({
      fromUrl: url,
      toFile: localPath,
    }).promise;

    return localPath;
  } catch (error) {
    console.error('Error setting up audio file:', error);
    throw error;
  }
};

const PostQuestionnaireScreen: React.FC<Props> = ({ navigation }) => {
  // Get the main stress point from questionnaire responses
  const getPersonalizedMessage = async () => {
    const responses = await getQuestionnaireResponses();
    if (!responses) return "We've crafted a personalized program to help you achieve mental clarity and emotional well-being.";
    
    // This is a placeholder - implement the logic based on actual responses structure
    if (responses.stressLevel > 3) {
      return "Based on your responses, stress management appears to be your key focus. Our program is perfectly suited to help you develop effective coping strategies.";
    } else if (responses.sleepIssues) {
      return "Your responses indicate that improving sleep quality is important to you. Our program includes specialized techniques for better rest and relaxation.";
    }
    return "We've designed a comprehensive program to help you achieve your mental wellness goals.";
  };

  const [message, setMessage] = React.useState<string>("");
  const audioRef = React.useRef<Sound | null>(null);
  const buttonScale = new Animated.Value(1);

  useEffect(() => {
    // Load message once
    getPersonalizedMessage().then(setMessage);

    let soundInstance: Sound | null = null;

    const initAudio = async () => {
      try {
        const audioPath = await setupAudioFile(
          'https://firebasestorage.googleapis.com/v0/b/mindshift-bd937.firebasestorage.app/o/music%2Fhaveagreatday.wav?alt=media&token=140dd18b-06c1-45b5-acb2-c65a58b8d090'
        );

        // Play audio
        Sound.setCategory('Playback');
        soundInstance = new Sound(audioPath, '', (error) => {
          if (error) {
            console.error('Failed to load sound', error);
            return;
          }

          // Play the sound
          soundInstance?.play((success) => {
            if (!success) {
              console.log('Sound playback failed');
            }
          });
        });
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

    initAudio();

    // Cleanup
    return () => {
      if (soundInstance) {
        soundInstance.stop();
        soundInstance.release();
      }
    };
  }, []);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleGetStarted = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E3A5F', '#2D5F7C']}
        style={styles.gradient}
        start={{x: 0.5, y: 0}}
        end={{x: 0.5, y: 1}}
      >

        
        <View style={styles.content}>
          <View style={styles.mainContent}>
            <Text style={styles.title}>
              Perfect!{'\n'}
              You're All Set
            </Text>
            
            <Text style={styles.subtitle}>
              {message}
            </Text>

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>
                Your 7-Day Journey Includes:
              </Text>
              {[
                'Personalized stress-reduction techniques',
                'Daily mindfulness exercises',
                'Progress tracking & insights',
                'Expert-guided meditations',
                'Unlimited access to all features'
              ].map((benefit, index) => (
                <View key={index} style={styles.benefitRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.joinText}>
              Start your free 7-day trial now and experience the transformation. No commitment required.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleGetStarted}
          >
            <Animated.View style={[
              styles.button,
              {
                transform: [{ scale: buttonScale }]
              }
            ]}>
              <Text style={styles.buttonText}>Get Started</Text>
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
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  benefitsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  bullet: {
    color: '#D4AF37',
    fontSize: 24,
    marginRight: 10,
  },
  benefitText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    flex: 1,
  },
  joinText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default PostQuestionnaireScreen; 