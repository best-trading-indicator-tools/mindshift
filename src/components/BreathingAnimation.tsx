import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions, TouchableOpacity, Modal } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Sound from 'react-native-sound';
import { CommonActions } from '@react-navigation/native';
import { markExerciseAsCompleted } from '../services/exerciseService';
import { audioService, AUDIO_FILES } from '../services/audioService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BREATH_DURATION = 5000; // 5 seconds for a more relaxed breath
const HOLD_DURATION = 5000;   // 5 seconds hold
const GONG_DURATION = 2000;   // 2 seconds for gong
const INITIAL_DELAY = 3000;   // 3 seconds initial delay
const TOTAL_CYCLES = 1;

// Enable playback in silence mode
Sound.setCategory('Playback', true);

const BreathingAnimation = React.forwardRef<
  { handleExitPress: () => void; cleanupAllAudio: () => void },
  { 
    navigation: any;
    context?: 'daily' | 'challenge';
    challengeId?: string;
    returnTo?: string;
    onComplete?: () => void;
  }
>(({ navigation, context, challengeId, returnTo, onComplete }, ref) => {
  const [breathsLeft, setBreathsLeft] = useState(TOTAL_CYCLES);
  const [phase, setPhase] = useState<'in' | 'hold-in' | 'out' | 'hold-out' | 'complete'>('in');
  const [countdown, setCountdown] = useState(5);
  const animation = useRef(new Animated.Value(0)).current;
  const gongSound = useRef<Sound | null>(null);
  const completionSound = useRef<Sound | null>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const isMounted = useRef(true);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize exercise
  useEffect(() => {
    // Load gong sound and start exercise
    const initAudio = async () => {
      try {
        gongSound.current = await audioService.loadSound(AUDIO_FILES.GONG);
        
        // Start breathing cycle after initial delay
        const startTimer = setTimeout(() => {
          // Play gong right before starting the cycle
          playGong();
          startBreathingCycle();
        }, INITIAL_DELAY);
        timersRef.current.push(startTimer);
        
      } catch (error) {
        console.error('Error loading gong sound:', error);
      }
    };

    initAudio();

    // Cleanup on unmount
    return () => {
      isMounted.current = false;
      cleanupAllAudio();
      if (animationRef.current) {
        animationRef.current.stop();
      }
      animation.removeAllListeners();
      timersRef.current.forEach(timer => clearTimeout(timer));
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const playGong = () => {
    if (gongSound.current) {
      gongSound.current.play((success) => {
        if (!success) {
          console.error('Failed to play gong sound');
        }
      });
      // Stop the sound after GONG_DURATION
      setTimeout(() => {
        if (gongSound.current) {
          gongSound.current.stop();
          gongSound.current.setCurrentTime(0);
        }
      }, GONG_DURATION);
    }
  };

  // Update countdown timer
  const startCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    // Convert milliseconds to seconds for the current phase
    const durationInSeconds = phase === 'in' || phase === 'out' 
      ? BREATH_DURATION / 1000 
      : HOLD_DURATION / 1000;

    setCountdown(durationInSeconds);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        const next = prev - 1;
        if (next <= 0) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [phase]); // Add phase as a dependency since we use it to determine duration

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const startBreathingCycle = useCallback(() => {
    if (!isMounted.current) return;
    
    // Clear any existing timers
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];
    
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    // Reset animation value
    animation.setValue(0);

    // Start with 'in' phase
    setPhase('in');
    startCountdown();

    // Create the animation sequence
    const sequence = Animated.sequence([
      Animated.timing(animation, {
        toValue: 1,
        duration: BREATH_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 1,
        duration: HOLD_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 0,
        duration: BREATH_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 0,
        duration: HOLD_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]);

    animationRef.current = sequence;

    // Set up phase timers
    const newTimers = [];
    
    // Breath in -> Hold
    newTimers.push(setTimeout(() => {
      if (isMounted.current) {
        setPhase('hold-in');
        startCountdown();
      }
    }, BREATH_DURATION));

    // Hold -> Breath out
    newTimers.push(setTimeout(() => {
      if (isMounted.current) {
        setPhase('out');
        startCountdown();
        playGong();
      }
    }, BREATH_DURATION + HOLD_DURATION));

    // Breath out -> Hold
    newTimers.push(setTimeout(() => {
      if (isMounted.current) {
        setPhase('hold-out');
        startCountdown();
      }
    }, BREATH_DURATION * 2 + HOLD_DURATION));

    // Complete cycle
    newTimers.push(setTimeout(() => {
      if (isMounted.current) {
        if (breathsLeft > 1) {
          setBreathsLeft(prev => prev - 1);
          setTimeout(startBreathingCycle, 100);
        } else {
          setPhase('complete');
        }
      }
    }, (BREATH_DURATION + HOLD_DURATION) * 2));

    timersRef.current = newTimers;
    sequence.start();
  }, [breathsLeft, animation, startCountdown]);

  const getWaveStyle = (offset: number) => ({
    transform: [
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8 + (offset * 0.1), 1.3 + (offset * 0.1)], // Less extreme scaling
        }),
      },
    ],
    opacity: animation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.8 - (offset * 0.15), 0.5 - (offset * 0.15), 0.3 - (offset * 0.15)],
    }),
  });

  const getPhaseText = () => {
    switch (phase) {
      case 'in':
        return 'Breath in';
      case 'hold-in':
        return 'Hold';
      case 'out':
        return 'Breath out';
      case 'hold-out':
        return 'Hold';
      case 'complete':
        return 'Have a great day!';
      default:
        return '';
    }
  };

  const cleanupAllAudio = () => {
    if (gongSound.current) {
      gongSound.current.stop();
      audioService.releaseSound(AUDIO_FILES.GONG.filename);
      gongSound.current = null;
    }
    if (completionSound.current) {
      completionSound.current.stop();
      audioService.releaseSound(AUDIO_FILES.HAVE_A_GREAT_DAY.filename);
      completionSound.current = null;
    }
  };

  const handleExitPress = () => {
    // Pause all animations and timers
    if (animationRef.current) {
      animationRef.current.stop();
    }
    timersRef.current.forEach(timer => clearTimeout(timer));
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    // Pause audio
    if (gongSound.current) {
      gongSound.current.pause();
    }
    if (completionSound.current) {
      completionSound.current.pause();
    }
  };

  const handleContinue = () => {
    // Resume animations
    if (animationRef.current) {
      animationRef.current.start();
    }
    // Resume audio
    if (gongSound.current) {
      gongSound.current.play();
    }
    // Restart breathing cycle
    startBreathingCycle();
  };

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    handleExitPress,
    handleContinue,
    cleanupAllAudio
  }));

  if (phase === 'complete') {
    return (
      <View style={styles.fullscreenContainer}>
        <LinearGradient
          colors={['#3730A3', '#6366F1', '#818CF8']}
          style={styles.fullscreenGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.completionText}>
            Have a good day!
          </Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.wavesContainer}>
        <Animated.View style={[styles.waveWrapper, getWaveStyle(0)]}>
          <LinearGradient
            colors={['#3730A3', '#6366F1', '#818CF8']}
            style={styles.wave}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            locations={[0, 0.5, 1]}
          />
        </Animated.View>
        <Animated.View style={[styles.waveWrapper, getWaveStyle(1)]}>
          <LinearGradient
            colors={['#3730A3', '#6366F1', '#818CF8']}
            style={styles.wave}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            locations={[0, 0.5, 1]}
          />
        </Animated.View>
        <Animated.View style={[styles.waveWrapper, getWaveStyle(2)]}>
          <LinearGradient
            colors={['#3730A3', '#6366F1', '#818CF8']}
            style={styles.wave}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            locations={[0, 0.5, 1]}
          />
        </Animated.View>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.phaseText}>
          {getPhaseText()}
        </Text>
        <Text style={styles.countdownText}>
          {countdown}
        </Text>
        <Text style={styles.breathsText}>
          {breathsLeft} {breathsLeft === 1 ? 'breath' : 'breaths'} left
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  noTopPadding: {
    paddingTop: 0,
    marginTop: 0,
  },
  wavesContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveWrapper: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    borderRadius: SCREEN_WIDTH / 2,
    overflow: 'hidden',
  },
  wave: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  phaseText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  breathsText: {
    color: '#FFFFFF',
    fontSize: 18,
    opacity: 0.8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  fullScreenButton: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  fullScreenGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionText: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 72,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  fullscreenContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    left: 0,
    top: 0,
  },
  fullscreenGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export { BreathingAnimation };
export default BreathingAnimation;