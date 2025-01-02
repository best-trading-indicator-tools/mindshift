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
import { getBreathSettings, saveBreathSettings, BreathSettings } from '../../services/breathSettingsService';
import BreathSettingsModal from '../../components/BreathSettingsModal';
import ProgressHeader from '../../components/ProgressHeader';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SunBreathExercise'>;

const { width, height } = Dimensions.get('window');

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

  const startBreathingCycle = (pauseDuration: number = 0, overrideSettings?: BreathSettings) => {
    // Clear any existing timers
    cycleTimersRef.current.forEach(timer => clearTimeout(timer));
    cycleTimersRef.current = [];

    // Use override settings if provided, otherwise use state settings
    const activeSettings = overrideSettings || settings;

    // Don't start if we've exceeded cycles
    if (currentCycle > activeSettings.cycles) {
      return;
    }

    const inhaleMs = activeSettings.inhaleSeconds * 1000;
    const holdMs = activeSettings.holdSeconds * 1000;
    const exhaleMs = activeSettings.exhaleSeconds * 1000;

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
      
      // If this is the last cycle, schedule navigation after exhale
      if (currentCycle === activeSettings.cycles) {
        const completeTimer = setTimeout(() => {
          navigation.replace('SunBreathComplete');
        }, exhaleMs);
        cycleTimersRef.current.push(completeTimer);
      }
    }, inhaleMs + holdMs - pauseDuration);
    cycleTimersRef.current.push(exhaleTimer);

    // Schedule next cycle only if not the last cycle
    if (currentCycle < activeSettings.cycles) {
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
          />
        )}
      </View>
      
      <SafeAreaView style={styles.overlay}>
        <ProgressHeader
          currentStep={currentCycle}
          totalSteps={settings.cycles}
          onExit={handleExit}
          showNext={false}
        />

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

      <ExitModal
        visible={showExitModal}
        onContinue={handleExitCancel}
        onExit={handleExitConfirm}
      />
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
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 30,
  },
});

export default SunBreathExerciseScreen; 