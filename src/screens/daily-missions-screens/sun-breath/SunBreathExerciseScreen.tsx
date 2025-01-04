import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, SafeAreaView, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { audioService, AUDIO_FILES } from '../../../services/audioService';
import Sound from 'react-native-sound';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SunBreathExercise'>;


const { width, height } = Dimensions.get('window');

const TOTAL_STEPS = tutorialSteps.length + 2; // Tutorial + Exercise + Complete

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
    cycles: 5,
  });
  const videoRef = useRef<React.ComponentRef<typeof Video>>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseTime, setPauseTime] = useState<number>(0);
  const cycleTimersRef = useRef<NodeJS.Timeout[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [breatheInSound, setBreatheInSound] = useState<Sound | null>(null);
  const [breatheOutSound, setBreatheOutSound] = useState<Sound | null>(null);
  const soundsRef = useRef<{ in: Sound | null; out: Sound | null }>({ in: null, out: null });

  const initializeSounds = async () => {
    try {
      console.log('🎵 Starting to initialize breath sounds...');
      
      // Get the cached sounds from audioService
      const inSound = await audioService.loadSound(AUDIO_FILES.SUN_BREATHE_IN);
      console.log('✅ Loaded breathe in sound');
      
      const outSound = await audioService.loadSound(AUDIO_FILES.SUN_BREATHE_OUT);
      console.log('✅ Loaded breathe out sound');
      
      // Set volume
      inSound.setVolume(1.0);
      outSound.setVolume(1.0);
      console.log('✅ Set volumes to 1.0');
      
      // Set number of loops to 0 (play once)
      inSound.setNumberOfLoops(0);
      outSound.setNumberOfLoops(0);
      console.log('✅ Set loops to 0');
      
      // Keep reference to sounds
      soundsRef.current = { in: inSound, out: outSound };
      
      // Set the sounds in state
      setBreatheInSound(inSound);
      setBreatheOutSound(outSound);
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🎵 Breath sounds initialization complete');
    } catch (error) {
      console.error('❌ Failed to initialize breath sounds:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Call initialization
    console.log('🚀 Starting sound initialization process');
    initializeSounds();

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up breath sounds');
      if (breatheInSound) {
        breatheInSound.stop();
        console.log('✅ Stopped breathe in sound');
      }
      if (breatheOutSound) {
        breatheOutSound.stop();
        console.log('✅ Stopped breathe out sound');
      }
    };
  }, []);

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
    if (breatheInSound) {
      breatheInSound.stop();
    }
    if (breatheOutSound) {
      breatheOutSound.stop();
    }
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
          navigation.push('SunBreathComplete');
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

  const playBreathInSound = () => {
    const sound = soundsRef.current.in || breatheInSound;
    if (!sound) {
      console.error('❌ Cannot play breathe in sound - not initialized');
      return;
    }

    console.log('🎵 Playing breathe in sound...');
    sound.stop(); // Stop any existing playback
    sound.setCurrentTime(0); // Reset to start
    
    // Calculate rate based on user's selected duration (audio is 5s)
    const rate = 5 / settings.inhaleSeconds;
    sound.setSpeed(rate);
    console.log(`🎵 Adjusted breathe in sound speed to ${rate}x for ${settings.inhaleSeconds}s duration`);
    
    // Add a small delay before playing
    setTimeout(() => {
      if (!sound) {
        console.error('❌ Breathe in sound was lost during delay');
        return;
      }
      sound.play((success) => {
        if (!success) {
          console.error('❌ Failed to play breathe in sound');
        } else {
          console.log('✅ Breathe in sound played successfully');
        }
      });
    }, 100); // 100ms delay
  };

  const playBreathOutSound = () => {
    const sound = soundsRef.current.out || breatheOutSound;
    if (!sound) {
      console.error('❌ Cannot play breathe out sound - not initialized');
      return;
    }

    console.log('🎵 Playing breathe out sound...');
    sound.stop(); // Stop any existing playback
    sound.setCurrentTime(0); // Reset to start
    
    // Calculate rate based on user's selected duration (audio is 5s)
    const rate = 5 / settings.exhaleSeconds;
    sound.setSpeed(rate);
    console.log(`🎵 Adjusted breathe out sound speed to ${rate}x for ${settings.exhaleSeconds}s duration`);
    
    // Add a small delay before playing
    setTimeout(() => {
      if (!sound) {
        console.error('❌ Breathe out sound was lost during delay');
        return;
      }
      sound.play((success) => {
        if (!success) {
          console.error('❌ Failed to play breathe out sound');
        } else {
          console.log('✅ Breathe out sound played successfully');
        }
      });
    }, 100); // 100ms delay
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
        playBreathInSound();
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
        playBreathOutSound();
      }, delay + (currentSettings.inhaleSeconds + currentSettings.holdSeconds) * 1000);
      cycleTimersRef.current.push(exhaleTimer);

      // Schedule next cycle or completion
      const cycleTime = (currentSettings.inhaleSeconds + currentSettings.holdSeconds + currentSettings.exhaleSeconds) * 1000;
      const nextCycleTimer = setTimeout(() => {
        if (currentCycle < currentSettings.cycles) {
          console.log(`✅ Completed cycle ${currentCycle}, starting next cycle`);
          setCurrentCycle(prev => prev + 1);
          startBreathingCycle(0, currentSettings);
        } else {
          console.log(`🎉 Completed all ${currentSettings.cycles} cycles`);
          navigation.push('SunBreathComplete');
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
        
        // Initialize sounds before starting
        await initializeSounds();
        
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
          currentStep={tutorialSteps.length + 1}
          totalSteps={TOTAL_STEPS}
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
});

export default SunBreathExerciseScreen; 