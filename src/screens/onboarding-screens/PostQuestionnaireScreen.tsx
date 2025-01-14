import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
            style={styles.button}
            onPress={handleStartTrial}
          >
            <Text style={styles.buttonText}>Begin Your Free Trial</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: '15%',
    paddingBottom: '10%',
  },
  mainContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 44,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.9,
    lineHeight: 26,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 40,
    paddingHorizontal: 0,
  },
  benefitsTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 20,
    opacity: 0.9,
    textAlign: 'center',
  },
  benefitRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    width: '100%',
  },
  bullet: {
    color: '#FFD700',
    fontSize: 24,
    marginRight: 12,
    fontWeight: 'bold',
    width: 16,
    alignSelf: 'flex-start',
  },
  benefitText: {
    color: '#FFFFFF',
    fontSize: 18,
    opacity: 0.9,
    flex: 1,
    lineHeight: 24,
    flexWrap: 'wrap',
    paddingTop: 3,
  },
  joinText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 30,
    width: '100%',
    maxWidth: 300,
  },
  buttonText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default PostQuestionnaireScreen; 