import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions, TouchableOpacity, InteractionManager } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Sound from 'react-native-sound';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BREATH_DURATION = 2000;
const HOLD_DURATION = 2000;
const GONG_DURATION = 2000;
const TOTAL_CYCLES = 1;

// Configure sound globally once
Sound.setCategory('Playback', true);

// Pre-configure sound options
const soundOptions = {
  numberOfLoops: 0,
  volume: 1.0,
};

export interface BreathingRef {
  handlePause: () => void;
  handleResume: () => void;
  cleanupAudio: () => void;
}

interface BreathingAnimationProps {
  onPhaseComplete: () => void;
}

const BreathingAnimation = forwardRef<BreathingRef, BreathingAnimationProps>(({ 
  onPhaseComplete
}, ref) => {
  const [breathsLeft, setBreathsLeft] = useState(TOTAL_CYCLES);
  const [phase, setPhase] = useState<'in' | 'hold-in' | 'out' | 'hold-out' | 'complete'>('in');
  const [countdown, setCountdown] = useState(BREATH_DURATION / 1000);
  const [initialCountdown, setInitialCountdown] = useState(3);
  const [showInitialCountdown, setShowInitialCountdown] = useState(true);
  const animation = useRef(new Animated.Value(0)).current;
  const gongSound = useRef<Sound | null>(null);
  const breathSound = useRef<Sound | null>(null);
  const completionSound = useRef<Sound | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const startTimeRef = useRef<number>(0);
  const isUnmountedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (gongSound.current) {
      gongSound.current.stop();
      gongSound.current.release();
    }
    if (breathSound.current) {
      breathSound.current.stop();
      breathSound.current.release();
    }
    if (completionSound.current) {
      completionSound.current.stop();
      completionSound.current.release();
    }
  }, []);

  useEffect(() => {
    isUnmountedRef.current = false;

    // Load sounds first
    const loadSounds = async () => {
      return new Promise<void>((resolve) => {
        // Load all sounds in parallel
        const loadPromises = [
          new Promise<void>((res) => {
            gongSound.current = new Sound(require('../assets/audio/gong.wav'), (error) => {
              if (!error && gongSound.current) {
                gongSound.current.setVolume(soundOptions.volume);
                gongSound.current.setNumberOfLoops(soundOptions.numberOfLoops);
              }
              res();
            });
          }),
          new Promise<void>((res) => {
            breathSound.current = new Sound(require('../assets/audio/nature.wav'), (error) => {
              if (!error && breathSound.current) {
                breathSound.current.setVolume(soundOptions.volume);
                breathSound.current.setNumberOfLoops(soundOptions.numberOfLoops);
              }
              res();
            });
          }),
          new Promise<void>((res) => {
            completionSound.current = new Sound(require('../assets/audio/haveagreatday.wav'), (error) => {
              if (!error && completionSound.current) {
                completionSound.current.setVolume(soundOptions.volume);
                completionSound.current.setNumberOfLoops(soundOptions.numberOfLoops);
              }
              res();
            });
          })
        ];

        Promise.all(loadPromises).then(() => resolve());
      });
    };

    // Start exercise after sounds are loaded
    InteractionManager.runAfterInteractions(async () => {
      if (isUnmountedRef.current) return;
      
      await loadSounds();
      if (isUnmountedRef.current) return;
      
      setIsInitializing(false);
      
      // Initial countdown from 3 to 1
      let count = 3;
      intervalRef.current = setInterval(() => {
        if (isUnmountedRef.current) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          return;
        }

        if (count > 0) {
          setInitialCountdown(count);
          count--;
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setShowInitialCountdown(false);
          startTimeRef.current = Date.now();
          startExercise();
        }
      }, 1000);
    });

    return () => {
      isUnmountedRef.current = true;
      cleanup();
    };
  }, [cleanup]);

  const startExercise = useCallback(() => {
    if (gongSound.current) {
      gongSound.current.play();
    }
    startPhase('in');
  }, []);

  const startPhase = useCallback((currentPhase: typeof phase) => {
    if (isUnmountedRef.current) return;

    setPhase(currentPhase);
    startTimeRef.current = Date.now();

    // Handle animation based on phase
    if (currentPhase === 'in') {
      Animated.timing(animation, {
        toValue: 1,
        duration: BREATH_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
      // Play gong for breath in
      if (gongSound.current) {
        gongSound.current.play();
        setTimeout(() => {
          if (gongSound.current && !isUnmountedRef.current) {
            gongSound.current.stop();
          }
        }, GONG_DURATION);
      }
    } else if (currentPhase === 'out') {
      Animated.timing(animation, {
        toValue: 0,
        duration: BREATH_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
      // Play gong for breath out
      if (gongSound.current) {
        gongSound.current.play();
        setTimeout(() => {
          if (gongSound.current && !isUnmountedRef.current) {
            gongSound.current.stop();
          }
        }, GONG_DURATION);
      }
    } else {
      // For hold phases, stop any ongoing animation
      animation.stopAnimation();
    }

    if (currentPhase === 'in' || currentPhase === 'out') {
      if (breathSound.current) {
        breathSound.current.play();
      }
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (isUnmountedRef.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        return;
      }

      const elapsed = Date.now() - startTimeRef.current;
      const duration = currentPhase.includes('hold') ? HOLD_DURATION : BREATH_DURATION;
      const secondsLeft = Math.ceil((duration - elapsed) / 1000);

      if (secondsLeft > 0) {
        setCountdown(secondsLeft);
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        moveToNextPhase(currentPhase);
      }
    }, 100);
  }, [animation]);

  const moveToNextPhase = useCallback((currentPhase: typeof phase) => {
    if (isUnmountedRef.current) return;

    switch (currentPhase) {
      case 'in':
        startPhase('hold-in');
        break;
      case 'hold-in':
        startPhase('out');
        break;
      case 'out':
        startPhase('hold-out');
        break;
      case 'hold-out':
        if (breathsLeft > 1) {
          setBreathsLeft(prev => prev - 1);
          startPhase('in');
        } else {
          setPhase('complete');
          if (completionSound.current) {
            completionSound.current.play();
          }
          onPhaseComplete();
        }
        break;
    }
  }, [breathsLeft, startPhase, onPhaseComplete]);

  useImperativeHandle(ref, () => ({
    handlePause: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (gongSound.current) gongSound.current.stop();
      if (breathSound.current) breathSound.current.stop();
      if (completionSound.current) completionSound.current.stop();
    },
    handleResume: () => {
      startPhase(phase);
    },
    cleanupAudio: cleanup
  }), [phase, cleanup, startPhase]);

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
      default:
        return '';
    }
  };

  if (isInitializing || showInitialCountdown) {
    return (
      <View style={styles.container}>
        <View style={styles.textContainer}>
          <Text style={styles.phaseText}>
            Starting in
          </Text>
          <Text style={styles.countdownText}>
            {initialCountdown}
          </Text>
        </View>
      </View>
    );
  }

  if (phase === 'complete') {
    return (
      <View style={styles.container}>
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
    flex: 1,
    width: '100%',
    height: '100%',
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
    padding: 20,
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
});

export default BreathingAnimation;