import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions, Modal, SafeAreaView, StatusBar } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { markDailyExerciseAsCompleted, markChallengeExerciseAsCompleted } from '../../../utils/exerciseCompletion';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveIncantationsExercise'>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCROLL_DURATION = 5000; // 5 seconds per incantation

const ActiveIncantationsExerciseScreen: React.FC<Props> = ({ route, navigation }) => {
  const { incantations, context = 'daily', challengeId, returnTo } = route.params;
  const [isPaused, setIsPaused] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [scrollDuration, setScrollDuration] = useState(SCROLL_DURATION / 1000); // Convert to seconds

  const navigateAway = useCallback(() => {
    if (returnTo) {
      navigation.navigate('ChallengeDetail', {
        challenge: {
          id: challengeId || '1',
          title: 'Ultimate',
          duration: 21,
          description: 'Your subconscious mind shapes your reality.',
          image: require('../../../assets/illustrations/challenges/challenge-21.png')
        }
      });
    } else {
      navigation.navigate('MainTabs');
    }
  }, [navigation, returnTo, challengeId]);

  useEffect(() => {
    if (!isPaused && currentIndex < incantations.length) {
      const animation = Animated.timing(scrollY, {
        toValue: (currentIndex + 1) * SCREEN_HEIGHT,
        duration: scrollDuration * 1000,
        useNativeDriver: true,
      });

      animation.start(({ finished }) => {
        if (finished) {
          setCurrentIndex(prev => {
            const newIndex = prev + 1;
            if (newIndex === incantations.length) {
              handleCompletion();
              navigateAway();
            }
            return newIndex;
          });
        }
      });

      return () => animation.stop();
    }
  }, [currentIndex, isPaused, scrollDuration, navigateAway]);

  const handleCompletion = async () => {
    try {
      if (context === 'challenge' && challengeId) {
        await markChallengeExerciseAsCompleted(challengeId, 'active-incantations');
      } else {
        await markDailyExerciseAsCompleted('active-incantations');
      }
    } catch (error) {
      console.error('Error completing active incantations exercise:', error);
    }
  };

  const handleLastIncantation = async () => {
    setCurrentIndex(incantations.length - 1);
    scrollY.setValue((incantations.length - 1) * SCREEN_HEIGHT);
    await handleCompletion();
    navigateAway();
  };

  const togglePause = () => setIsPaused(!isPaused);

  const handleExitPress = () => {
    setIsPaused(true);
    setIsExitModalVisible(true);
  };

  const handleExit = async () => {
    try {
      if (context === 'challenge' && challengeId) {
        await markChallengeExerciseAsCompleted(challengeId, 'active-incantations');
      } else {
        await markDailyExerciseAsCompleted('active-incantations');
      }
      navigateAway();
    } catch (error) {
      console.error('Error completing active incantations exercise:', error);
      navigation.navigate('MainTabs');
    }
  };

  const handleModalClose = () => {
    setIsExitModalVisible(false);
    setIsPaused(false);
  };

  const handleNextIncantation = () => {
    if (currentIndex < incantations.length - 1) {
      setCurrentIndex(prev => prev + 1);
      scrollY.setValue((currentIndex + 1) * SCREEN_HEIGHT);
    }
  };

  const handlePreviousIncantation = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      scrollY.setValue((currentIndex - 1) * SCREEN_HEIGHT);
    }
  };

  const handleSettingsPress = () => {
    setIsPaused(true);
    setIsSettingsModalVisible(true);
  };

  const handleSettingsClose = () => {
    setIsSettingsModalVisible(false);
    setIsPaused(false);
  };

  const handleSpeedChange = (value: string) => {
    const newDuration = parseInt(value);
    if (!isNaN(newDuration) && newDuration > 0) {
      setScrollDuration(newDuration);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TouchableOpacity 
            style={styles.exitButton} 
            onPress={handleExitPress}
          >
            <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingsButton} 
            onPress={handleSettingsPress}
          >
            <MaterialCommunityIcons name="dots-vertical" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.previousButton} 
            onPress={handlePreviousIncantation}
          >
            <MaterialCommunityIcons name="chevron-left" size={36} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.nextButton} 
            onPress={handleNextIncantation}
          >
            <MaterialCommunityIcons name="chevron-right" size={36} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.lastButton} 
            onPress={handleLastIncantation}
          >
            <MaterialCommunityIcons name="chevron-double-right" size={36} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contentContainer} 
            activeOpacity={1} 
            onPress={togglePause}
          >
            {isPaused && (
              <View style={styles.pauseIconContainer}>
                <MaterialCommunityIcons 
                  name="pause-circle" 
                  size={80} 
                  color="#FFFFFF" 
                  style={styles.pauseIcon}
                />
              </View>
            )}

            <Animated.View
              style={[
                styles.scrollContainer,
                {
                  transform: [{ translateY: scrollY.interpolate({
                    inputRange: [0, SCREEN_HEIGHT * incantations.length],
                    outputRange: [-SCREEN_HEIGHT * (incantations.length - 1), 0],
                  })}],
                },
              ]}
            >
              {incantations.map((incantation, index) => (
                <View key={index} style={styles.incantationContainer}>
                  <Text style={[
                    styles.incantationText,
                    index === currentIndex && styles.activeIncantation
                  ]}>
                    {incantation}
                  </Text>
                </View>
              ))}
            </Animated.View>
          </TouchableOpacity>

          <Modal
            visible={isExitModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setIsExitModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Wait! Are you sure?</Text>
                <Text style={styles.modalText}>
                  You're making progress! Continue practicing to maintain your results.
                </Text>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => setIsExitModalVisible(false)}
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalExitButton}
                  onPress={handleExit}
                >
                  <Text style={styles.modalExitText}>Exit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            visible={isSettingsModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleSettingsClose}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Settings</Text>
                <Text style={styles.modalText}>
                  Set interval between incantations:
                </Text>
                <Text style={styles.durationText}>
                  {scrollDuration} seconds
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={scrollDuration}
                  onValueChange={setScrollDuration}
                  minimumTrackTintColor="#FFD700"
                  maximumTrackTintColor="#4A5568"
                  thumbTintColor="#FFD700"
                />
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleSettingsClose}
                >
                  <Text style={styles.continueButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    flex: 1,
  },

  scrollContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  incantationContainer: {
    height: SCREEN_HEIGHT,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    paddingTop: 100,
  },
  incantationText: {
    color: '#FFFFFF',
    fontSize: 36,
    textAlign: 'center',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 4,
    opacity: 1, // Full opacity for all states
  },
  activeIncantation: {
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 4,
    transform: [{ scale: 1.1 }], // Slightly larger for active state
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    opacity: 0.8,
  },
  continueButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
    width: '100%',
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  exitButton: {
    position: 'absolute',
    top: 10,
    left: 16,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalExitButton: {
    backgroundColor: '#E31837',
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
  },
  modalExitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  pauseIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Optional: adds a slight dim effect
  },
  pauseIcon: {
    opacity: 0.9,
    // Optional: add shadow for better visibility
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  settingsButton: {
    position: 'absolute',
    top: 10,
    right: 16,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previousButton: {
    position: 'absolute',
    left: 20,
    top: '50%',
    transform: [{ translateY: -18 }],
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  nextButton: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -18 }],
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  lastButton: {
    position: 'absolute',
    right: 20,
    bottom: '25%',
    transform: [{ translateY: -18 }],
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 20,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default ActiveIncantationsExerciseScreen; 