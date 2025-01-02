import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, SafeAreaView, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Video, { VideoRef } from 'react-native-video';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ExitModal from '../../components/ExitModal';
import { videoService, VideoLoadingState } from '../../services/videoService';
import InfoBubble from '../../components/InfoBubble';
import { getBreathSettings, BreathSettings } from '../../services/breathSettingsService';
import BreathSettingsModal from '../../components/BreathSettingsModal';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SunBreathExercise'>;

const { width, height } = Dimensions.get('window');

const INHALE_DURATION = 4000; // 4 seconds
const HOLD_DURATION = 1000; // 1 second
const EXHALE_DURATION = 6000; // 6 seconds
const CYCLES = 1;

const SunBreathExerciseScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
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
    cycles: 1,
  });
  const videoRef = useRef<VideoRef>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseTime, setPauseTime] = useState<number>(0);
  const cycleTimersRef = useRef<NodeJS.Timeout[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await getBreathSettings();
      setSettings(savedSettings);
      setCountdown(savedSettings.inhaleSeconds);
    };
    loadSettings();
  }, []);

  const handleExit = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    // Clear all scheduled timers
    cycleTimersRef.current.forEach(timer => clearTimeout(timer));
    cycleTimersRef.current = [];
    
    setPauseTime(Date.now());
    setIsPaused(true);
    setShowExitModal(true);
  };

  const handleSettings = () => {
    // Clear all timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    cycleTimersRef.current.forEach(timer => clearTimeout(timer));
    cycleTimersRef.current = [];
    
    setPauseTime(Date.now());
    setIsPaused(true);
    setShowSettingsModal(true);
  };

  const handleSettingsSave = async (newSettings: BreathSettings) => {
    // First set the settings in state
    setSettings(newSettings);
    setShowSettingsModal(false);
    
    // Reset all states
    setCurrentCycle(1);
    setCountdown(newSettings.inhaleSeconds);
    setIsInhaling(true);
    setInstruction('Breathe In');
    setIsPaused(false);
    
    // Clear all existing timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    cycleTimersRef.current.forEach(timer => clearTimeout(timer));
    cycleTimersRef.current = [];
    
    try {
      // Wait for videos to preload before starting
      await Promise.all([
        videoService.getBreathingVideo('inhale', setLoadingState),
        videoService.getBreathingVideo('exhale', setLoadingState)
      ]);
      
      // Start fresh breathing cycle with new settings
      startBreathingCycle();
    } catch (error) {
      console.error('Error preloading videos:', error);
      setLoadingState({
        isLoading: false,
        progress: 0,
        error: 'Failed to load videos'
      });
    }
  };

  const handleExitConfirm = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsPaused(true);
    navigation.navigate('MainTabs');
  };

  const handleExitCancel = () => {
    setShowExitModal(false);
    setIsPaused(false);
    
    // Resume video and countdown from current phase
    if (instruction === 'Breathe In') {
      loadVideo('inhale');
      startCountdown(settings.inhaleSeconds * 1000, countdown);
      
      // Schedule the remaining phases
      const remainingInhaleTime = countdown * 1000;
      
      const holdTimer = setTimeout(() => {
        setInstruction('Hold');
        startCountdown(settings.holdSeconds * 1000);
      }, remainingInhaleTime);
      cycleTimersRef.current.push(holdTimer);

      const exhaleTimer = setTimeout(() => {
        setIsInhaling(false);
        setInstruction('Breathe Out');
        startCountdown(settings.exhaleSeconds * 1000);
        loadVideo('exhale');
      }, remainingInhaleTime + settings.holdSeconds * 1000);
      cycleTimersRef.current.push(exhaleTimer);

    } else if (instruction === 'Hold') {
      startCountdown(settings.holdSeconds * 1000, countdown);
      
      const remainingHoldTime = countdown * 1000;
      
      const exhaleTimer = setTimeout(() => {
        setIsInhaling(false);
        setInstruction('Breathe Out');
        startCountdown(settings.exhaleSeconds * 1000);
        loadVideo('exhale');
      }, remainingHoldTime);
      cycleTimersRef.current.push(exhaleTimer);

    } else if (instruction === 'Breathe Out') {
      loadVideo('exhale');
      startCountdown(settings.exhaleSeconds * 1000, countdown);
      
      // If this is the last cycle, schedule completion
      if (currentCycle === settings.cycles) {
        const remainingExhaleTime = countdown * 1000;
        const completeTimer = setTimeout(() => {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          navigation.navigate('SunBreathComplete');
        }, remainingExhaleTime);
        cycleTimersRef.current.push(completeTimer);
      }
    }
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
    
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startBreathingCycle = (pauseDuration: number = 0) => {
    // Clear any existing timers
    cycleTimersRef.current.forEach(timer => clearTimeout(timer));
    cycleTimersRef.current = [];

    // Don't start if we've exceeded cycles
    if (currentCycle > settings.cycles) {
      return;
    }

    const inhaleMs = settings.inhaleSeconds * 1000;
    const holdMs = settings.holdSeconds * 1000;
    const exhaleMs = settings.exhaleSeconds * 1000;

    // Start with inhale
    setIsInhaling(true);
    setInstruction('Breathe In');
    loadVideo('inhale');
    startCountdown(inhaleMs);
    
    // Schedule the state changes with adjusted times
    const holdTimer = setTimeout(() => {
      setInstruction('Hold');
      startCountdown(holdMs);
    }, inhaleMs - pauseDuration);
    cycleTimersRef.current.push(holdTimer);

    const exhaleTimer = setTimeout(() => {
      setIsInhaling(false);
      setInstruction('Breathe Out');
      startCountdown(exhaleMs);
      loadVideo('exhale');

      // If this is the last cycle, wait for exhale to complete before finishing
      if (currentCycle === settings.cycles) {
        const completeTimer = setTimeout(() => {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          navigation.navigate('SunBreathComplete');
        }, exhaleMs);
        cycleTimersRef.current.push(completeTimer);
      }
    }, inhaleMs + holdMs - pauseDuration);
    cycleTimersRef.current.push(exhaleTimer);

    // Schedule next cycle
    if (currentCycle < settings.cycles) {
      const nextCycleTimer = setTimeout(() => {
        setCurrentCycle(c => c + 1);
        startBreathingCycle();
      }, inhaleMs + holdMs + exhaleMs - pauseDuration);
      cycleTimersRef.current.push(nextCycleTimer);
    }
  };

  useEffect(() => {
    // Preload both videos before starting
    const preloadVideos = async () => {
      try {
        // Load both videos in parallel
        await Promise.all([
          videoService.getBreathingVideo('inhale', setLoadingState),
          videoService.getBreathingVideo('exhale', setLoadingState)
        ]);
        
        // Once videos are loaded, start the exercise
        startBreathingCycle();
      } catch (error) {
        console.error('Error preloading videos:', error);
        setLoadingState({
          isLoading: false,
          progress: 0,
          error: 'Failed to load videos'
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
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.exitButton}
        onPress={handleExit}
      >
        <MaterialCommunityIcons 
          name="close" 
          size={30} 
          color="#FFF" 
        />
      </TouchableOpacity>

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
          <Text style={styles.cycleText}>Breath {currentCycle} of {CYCLES}</Text>
          <Text style={styles.instructionText}>{instruction}</Text>
          {instruction !== 'Hold' && (
            <Text style={styles.countdownText}>{countdown}</Text>
          )}
        </View>

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
            />
          )}
        </View>

        {instruction !== 'Hold' && (
          <View style={styles.infoBubbleContainer}>
            <InfoBubble message={getPhaseInstructions()} />
          </View>
        )}
      </View>

      <BreathSettingsModal
        visible={showSettingsModal}
        onClose={() => {
          setShowSettingsModal(false);
          handleExitCancel(); // Resume exercise
        }}
        onSave={handleSettingsSave}
      />

      <ExitModal
        visible={showExitModal}
        onContinue={handleExitCancel}
        onExit={handleExitConfirm}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 30,
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
  videoContainer: {
    width: width,
    height: height,
    position: 'absolute',
  },
  video: {
    width: '100%',
    height: '100%',
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
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 30,
  },
});

export default SunBreathExerciseScreen; 