import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import LinearGradient from 'react-native-linear-gradient';
import Sound from 'react-native-sound';
import Superwall from '@superwall/react-native-superwall';

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

  const buttonScale = React.useRef(new Animated.Value(1)).current;

  const handleGetStarted = React.useCallback(async () => {
    try {
      await Superwall.shared.register('campaign_trigger')
        .then(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        })
        .catch((error) => {
          console.error('Superwall registration failed:', error);
        });
    } catch (error) {
      console.error('Error in handleGetStarted:', error);
    }
  }, [navigation]);

  const handlePressIn = React.useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  }, [buttonScale]);

  const handlePressOut = React.useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [buttonScale]);

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
              We've designed a comprehensive program to help you achieve your mental wellness goals.
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
    paddingTop: 40,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 40,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 44,
    marginTop: 16,
    lineHeight: 24,
  },
  benefitsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 24,
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
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: 10,
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
    marginBottom: 30,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default PostQuestionnaireScreen; 