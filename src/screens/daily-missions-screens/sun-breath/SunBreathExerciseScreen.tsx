import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, SafeAreaView, Dimensions, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import ExitModal from '../../../components/ExitModal';
import { videoService, VideoLoadingState } from '../../../services/videoService';
import InfoBubble from '../../../components/InfoBubble';
import { getBreathSettings, saveBreathSettings, BreathSettings } from '../../../services/breathSettingsService';
import BreathSettingsModal from '../../../components/BreathSettingsModal';
import ProgressHeader from '../../../components/ProgressHeader';
import { tutorialSteps } from './SunBreathTutorialScreen';
import LinearGradient from 'react-native-linear-gradient';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SunBreathExercise'>;
type Props = NativeStackScreenProps<RootStackParamList, 'SunBreathExercise'>;

const { width, height } = Dimensions.get('window');

const TOTAL_STEPS = tutorialSteps.length + 2; // Tutorial + Exercise + Complete

const SunBreathExerciseScreen: React.FC<Props> = ({ navigation, route }) => {
  const [currentCycle, setCurrentCycle] = useState(1);
  const [isInhaling, setIsInhaling] = useState(true);
  const [instruction, setInstruction] = useState('Breathe In');
  const [showExitModal, setShowExitModal] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [videoPath, setVideoPath] = useState<string>('');
  const [loadingState, setLoadingState] = useState<VideoLoadingState>({
    isLoading: true,
    progress: 0,
    error: null
  });
  const [settings, setSettings] = useState<BreathSettings>({
    inhaleSeconds: 4,
    holdSeconds: 1,
    exhaleSeconds: 6,
    cycles: 5,
  });
  const videoRef = useRef<React.ComponentRef<typeof Video>>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const cycleTimersRef = useRef<NodeJS.Timeout[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const isNavigating = useRef(false);

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await getBreathSettings();
      console.log('📱 Loaded breath settings:', savedSettings);
      setSettings(savedSettings);
      setCountdown(savedSettings.inhaleSeconds);
    };
    loadSettings();
  }, []);

  const handleExit = () => {
    console.log('🔴 Exit button clicked');
    
    // Pause video immediately
    setIsPaused(true);
    
    // Clear timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      console.log('🔴 Cleared timer ref');
    }
    cycleTimersRef.current.forEach(timer => clearTimeout(timer));
    cycleTimersRef.current = [];
    console.log('🔴 Cleared cycle timers');
    
    setShowExitModal(true);
    console.log('🔴 Showed exit modal');
  };

  const handleSettings = () => {
    // Clear all timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    cycleTimersRef.current.forEach(timer => clearTimeout(timer));
    cycleTimersRef.current = [];
    
    setIsPaused(true);
    setShowSettingsModal(true);
  };

  const handleSettingsSave = async (newSettings: BreathSettings) => {
    try {
      // First save settings to AsyncStorage and wait for it to complete
      await saveBreathSettings(newSettings);
      
      // Clear all existing timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      cycleTimersRef.current.forEach(timer => clearTimeout(timer));
      cycleTimersRef.current = [];
      
      // Update local state
      setSettings(newSettings);
      setShowSettingsModal(false);
      
      // Reset all states
      setCurrentCycle(1);
      setCountdown(newSettings.inhaleSeconds);
      setIsInhaling(true);
      setInstruction('Breathe In');
      
      // Wait for videos to preload
      await Promise.all([
        videoService.getBreathingVideo('inhale', setLoadingState),
        videoService.getBreathingVideo('exhale', setLoadingState)
      ]);
      
      // Set isPaused to false after everything is ready
      setIsPaused(false);
      
      // Start fresh breathing cycle with new settings, passing them directly
      startBreathingCycle(0, newSettings);
    } catch (error) {
      console.error('Error saving settings or loading videos:', error);
      setLoadingState({
        isLoading: false,
        progress: 0,
        error: 'Failed to save settings or load videos'
      });
    }
  };

  const handleExitConfirm = () => {
    isNavigating.current = true;
    setShowExitModal(false);
    
    // Handle exit based on context
    if (route.params?.context === 'challenge') {
      // Let the challenge flow handle the completion if needed
      if (route.params.onComplete) {
        route.params.onComplete();
      }
      
      // Navigate back to challenge if specified
      if (route.params.returnTo === 'ChallengeDetail') {
        navigation.navigate('ChallengeDetail', {
          challenge: {
            id: route.params.challengeId || '',
            title: 'Ultimate',
            duration: 21,
            description: '',
            image: require('../../../assets/illustrations/challenges/challenge-21.png')
          }
        });
      } else {
        navigation.goBack();
      }
    } else {
      // Default behavior for daily mission
      navigation.navigate('MainTabs');
    }
  };

  const handleExitCancel = () => {
    setShowExitModal(false);
    setIsPaused(false);
    startBreathingCycle(0);
  };

  const loadVideo = async (type: 'inhale' | 'exhale') => {
    try {
      // Videos are already cached, this should be instant
      const path = await videoService.getBreathingVideo(type, setLoadingState);
      setVideoPath(path);
    } catch (error) {
      console.error('Error loading video:', error);
      setLoadingState({
        isLoading: false,
        progress: 0,
        error: 'Failed to load video'
      });
    }
  };

  const startCountdown = (duration: number, startFrom?: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const seconds = startFrom || Math.floor(duration / 1000);
    setCountdown(seconds);
    
    let timeLeft = seconds;
    timerRef.current = setInterval(() => {
      timeLeft--;
      setCountdown(timeLeft);
      
      if (timeLeft <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    }, 1000);
  };

  const startBreathingCycle = async (delay = 0, currentSettings = settings) => {
    try {
      console.log(`🔄 Starting cycle ${currentCycle} of ${currentSettings.cycles}`);
      
      // Clear any existing timers
      cycleTimersRef.current.forEach(timer => clearTimeout(timer));
      cycleTimersRef.current = [];

      // Start with inhale
      const inhaleTimer = setTimeout(() => {
        setIsInhaling(true);
        setInstruction('Breathe In');
        loadVideo('inhale');
        startCountdown(currentSettings.inhaleSeconds * 1000);
      }, delay);
      cycleTimersRef.current.push(inhaleTimer);

      // Schedule hold
      const holdTimer = setTimeout(() => {
        setInstruction('Hold');
        startCountdown(currentSettings.holdSeconds * 1000);
      }, delay + currentSettings.inhaleSeconds * 1000);
      cycleTimersRef.current.push(holdTimer);

      // Schedule exhale
      const exhaleTimer = setTimeout(() => {
        setIsInhaling(false);
        setInstruction('Breathe Out');
        loadVideo('exhale');
        startCountdown(currentSettings.exhaleSeconds * 1000);
      }, delay + (currentSettings.inhaleSeconds + currentSettings.holdSeconds) * 1000);
      cycleTimersRef.current.push(exhaleTimer);

      // Schedule next cycle or completion
      const cycleTime = (currentSettings.inhaleSeconds + currentSettings.holdSeconds + currentSettings.exhaleSeconds) * 1000;
      const nextCycleTimer = setTimeout(() => {
        console.log(`🔄 Current cycle: ${currentCycle}, Total cycles: ${currentSettings.cycles}`);
        if (currentCycle < currentSettings.cycles) {
          console.log(`✅ Starting cycle ${currentCycle + 1}`);
          setCurrentCycle(prev => prev + 1);
          startBreathingCycle(0, currentSettings);
        } else {
          console.log(`🎉 Completed all ${currentSettings.cycles} cycles`);
          if (!isNavigating.current) {
            isNavigating.current = true;
            navigation.push('SunBreathComplete');
          }
        }
      }, delay + cycleTime);
      cycleTimersRef.current.push(nextCycleTimer);

    } catch (error) {
      console.error('Error in breathing cycle:', error);
    }
  };

  useEffect(() => {
    // Preload both videos before starting
    const preloadVideos = async () => {
      try {
        console.log('🎥 Starting to preload videos...');
        // Load both videos in parallel
        await Promise.all([
          videoService.getBreathingVideo('inhale', setLoadingState),
          videoService.getBreathingVideo('exhale', setLoadingState)
        ]);
        
        // Once everything is loaded, start the exercise
        console.log('🚀 Starting breathing cycle...');
        startBreathingCycle();
      } catch (error) {
        console.error('❌ Error preloading resources:', error);
        setLoadingState({
          isLoading: false,
          progress: 0,
          error: 'Failed to load resources'
        });
      }
    };

    preloadVideos();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      cycleTimersRef.current.forEach(timer => clearTimeout(timer));
      cycleTimersRef.current = [];
    };
  }, []);

  const getPhaseInstructions = () => {
    if (instruction === 'Hold') return '';
    return isInhaling 
      ? 'Visualize golden sunlight entering your body, filling you with warmth and positive energy.'
      : 'Release dark clouds of negativity, letting go of any tension or stress.';
  };

  // Add useEffect to monitor isPaused changes
  useEffect(() => {
    console.log('🔄 isPaused changed to:', isPaused);
  }, [isPaused]);

  // Add effect to monitor video state
  useEffect(() => {
    console.log('🎥 Video state changed:', {
      isPaused,
      videoPath,
      hasVideoRef: !!videoRef.current
    });
  }, [isPaused, videoPath]);

  // Add effect to handle video state changes
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.seek(0);
      }
    }
  }, [isPaused]);

  if (loadingState.error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorText}>Failed to load video</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => loadVideo(isInhaling ? 'inhale' : 'exhale')}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        {loadingState.isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>
              Loading video... {Math.round(loadingState.progress * 100)}%
            </Text>
          </View>
        )}
        {videoPath && (
          <Video
            ref={videoRef}
            source={{ uri: videoPath }}
            style={styles.video}
            resizeMode="cover"
            repeat={true}
            muted={true}
            paused={isPaused}
            onPlaybackRateChange={(event) => {
              console.log('🎥 Video playback rate changed:', event);
            }}
            onLoad={() => {
              console.log('🎥 Video loaded, current isPaused:', isPaused);
            }}
            onError={(error) => console.log('🎥 Video error:', error)}
          />
        )}
      </View>
      
      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => {
              console.log('🔴 Exit button clicked');
              setIsPaused(true);
              setShowExitModal(true);
            }}
          >
            <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View style={[styles.progressWrapper, { width: `${((tutorialSteps.length + 1) / TOTAL_STEPS) * 100}%` }]}>
                <View style={styles.progressBase} />
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0.7)',
                    'rgba(255, 255, 255, 0.3)',
                    'rgba(255, 215, 0, 0)',
                  ]}
                  locations={[0, 0.3, 1]}
                  style={styles.progressSheen}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
              </View>
            </View>
          </View>

          <View style={styles.headerButtonPlaceholder} />
        </View>

        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={handleSettings}
        >
          <MaterialCommunityIcons 
            name="cog" 
            size={30} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.instructionContainer}>
            <Text style={styles.cycleText}>Breath {currentCycle} of {settings.cycles}</Text>
            <Text style={styles.instructionText}>{instruction}</Text>
            {instruction !== 'Hold' && (
              <Text style={styles.countdownText}>{countdown}</Text>
            )}
          </View>

          {instruction !== 'Hold' && (
            <View style={styles.infoBubbleContainer}>
              <InfoBubble message={getPhaseInstructions()} />
            </View>
          )}
        </View>
      </SafeAreaView>

      <BreathSettingsModal
        visible={showSettingsModal}
        onClose={() => {
          setShowSettingsModal(false);
          handleExitCancel();
        }}
        onSave={handleSettingsSave}
      />

      <Modal
        visible={showExitModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowExitModal(false);
          setIsPaused(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Wait! Are you sure?</Text>
            <Text style={styles.modalText}>
              You're making progress! Continue practicing to maintain your results.
            </Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleExitCancel}
            >
              <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exitButton}
              onPress={handleExitConfirm}
            >
              <Text style={styles.exitText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  video: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionContainer: {
    position: 'absolute',
    top: 100,
    alignItems: 'center',
    zIndex: 1,
    width: '100%',
    paddingHorizontal: 20,
  },
  cycleText: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  instructionText: {
    color: '#FFF',
    fontSize: 42,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1.5,
  },
  countdownText: {
    color: '#FFD700',
    fontSize: 72,
    fontWeight: '700',
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    letterSpacing: 2,
    opacity: 0.9,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: '#FFD700',
    fontSize: 16,
    marginTop: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 18,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  retryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBubbleContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
  },
  settingsButton: {
    position: 'absolute',
    top: 110,
    right: 20,
    zIndex: 10,
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    padding: 24,
    borderRadius: 16,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
    lineHeight: 24,
  },
  continueButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
    width: '100%',
  },
  continueText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  exitButton: {
    backgroundColor: '#E31837',
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
  },
  exitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 52,
    width: '100%',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 22,
  },
  headerButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  progressBackground: {
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressWrapper: {
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  progressSheen: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
});

export default SunBreathExerciseScreen; 