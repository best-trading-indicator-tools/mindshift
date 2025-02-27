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
  const startTimeRef = useRef<number>(0);
  const isUnmountedRef = useRef(false);

  // Séparation de l'initialisation des sons
  useEffect(() => {
    console.log('🎵 [MOUNT] Initializing sounds...');
    InteractionManager.runAfterInteractions(() => {
      const initSounds = () => {
        // Nettoyage préalable
        if (gongSound.current) {
          console.log('🗑️ Cleaning up existing gong sound');
          gongSound.current.release();
        }
        if (breathSound.current) {
          console.log('🗑️ Cleaning up existing breath sound');
          breathSound.current.release();
        }
        if (completionSound.current) {
          console.log('🗑️ Cleaning up existing completion sound');
          completionSound.current.release();
        }

        // Reset des refs
        console.log('🔄 Resetting sound refs to null');
        gongSound.current = null;
        breathSound.current = null;
        completionSound.current = null;

        // Initialisation avec gestion d'erreur et volume
        console.log('🎵 Creating new gong sound');
        gongSound.current = new Sound(require('../assets/audio/gong.wav'), (error) => {
          if (error) {
            console.error('❌ Error loading gong sound:', error);
          } else if (gongSound.current) {
            console.log('✅ Gong sound loaded successfully');
            gongSound.current.setVolume(soundOptions.volume);
          }
        });
        
        console.log('🎵 Creating new breath sound');
        breathSound.current = new Sound(require('../assets/audio/nature.wav'), (error) => {
          if (error) {
            console.error('❌ Error loading breath sound:', error);
          } else if (breathSound.current) {
            console.log('✅ Breath sound loaded successfully');
            breathSound.current.setVolume(soundOptions.volume);
          }
        });
        
        console.log('🎵 Creating new completion sound');
        completionSound.current = new Sound(require('../assets/audio/haveagreatday.wav'), (error) => {
          if (error) {
            console.error('❌ Error loading completion sound:', error);
          } else if (completionSound.current) {
            console.log('✅ Completion sound loaded successfully');
            completionSound.current.setVolume(soundOptions.volume);
          }
        });
      };

      initSounds();
    });

    return () => {
      console.log('🎵 [UNMOUNT] Cleaning up sounds...');
      // Nettoyage explicite des sons
      if (gongSound.current) {
        console.log('🛑 Stopping and releasing gong sound');
        gongSound.current.stop();
        gongSound.current.release();
        gongSound.current = null;
      }
      if (breathSound.current) {
        console.log('🛑 Stopping and releasing breath sound');
        breathSound.current.stop();
        breathSound.current.release();
        breathSound.current = null;
      }
      if (completionSound.current) {
        console.log('🛑 Stopping and releasing completion sound');
        completionSound.current.stop();
        completionSound.current.release();
        completionSound.current = null;
      }
      console.log('✨ All sounds cleaned up');
    };
  }, []);

  // Séparation du compte à rebours initial
  useEffect(() => {
    isUnmountedRef.current = false;

    let count = 3;
    const countdownInterval = setInterval(() => {
      if (count > 0) {
        setInitialCountdown(count);
        count--;
      } else {
        clearInterval(countdownInterval);
        setShowInitialCountdown(false);
        startTimeRef.current = Date.now();
        startPhase('in');
      }
    }, 1000);

    return () => {
      isUnmountedRef.current = true;
      clearInterval(countdownInterval);
    };
  }, []);

  const startPhase = useCallback((currentPhase: typeof phase) => {
    if (isUnmountedRef.current) return;

    setPhase(currentPhase);
    startTimeRef.current = Date.now();

    // Handle animation based on phase
    if (currentPhase === 'in' || currentPhase === 'out') {
      const toValue = currentPhase === 'in' ? 1 : 0;
      Animated.timing(animation, {
        toValue,
        duration: BREATH_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();

      // Play sounds
      if (gongSound.current) {
        gongSound.current.stop();
        gongSound.current.play();
      }
      if (breathSound.current) {
        breathSound.current.stop();
        breathSound.current.play();
      }
    } else {
      animation.stopAnimation();
    }

    // Update countdown
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const duration = currentPhase.includes('hold') ? HOLD_DURATION : BREATH_DURATION;
    let timeLeft = Math.ceil(duration / 1000);
    setCountdown(timeLeft);

    intervalRef.current = setInterval(() => {
      if (isUnmountedRef.current) {
        clearInterval(intervalRef.current!);
        return;
      }

      timeLeft--;
      if (timeLeft > 0) {
        setCountdown(timeLeft);
      } else {
        clearInterval(intervalRef.current!);
        moveToNextPhase(currentPhase);
      }
    }, 1000);
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

  const handlePause = useCallback(() => {
    console.log('⏸️ Pausing exercise...');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (gongSound.current) {
      console.log('⏸️ Stopping gong sound');
      gongSound.current.stop();
    }
    if (breathSound.current) {
      console.log('⏸️ Stopping breath sound');
      breathSound.current.stop();
    }
    if (completionSound.current) {
      console.log('⏸️ Stopping completion sound');
      completionSound.current.stop();
    }
    
    startTimeRef.current = Date.now() - ((phase.includes('hold') ? HOLD_DURATION : BREATH_DURATION) - (countdown * 1000));
  }, [phase, countdown]);

  const handleResume = useCallback(() => {
    // If we're in initial countdown, restart it from current count
    if (showInitialCountdown) {
      let count = initialCountdown;
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
          startPhase('in');
        }
      }, 1000);
    } else {
      // Resume from current phase and time
      const currentPhase = phase;
      const duration = currentPhase.includes('hold') ? HOLD_DURATION : BREATH_DURATION;
      const elapsed = Date.now() - startTimeRef.current;
      const remainingTime = Math.max(0, duration - elapsed);

      // Only play sounds if we're starting a new breath phase
      if ((currentPhase === 'in' || currentPhase === 'out') && elapsed < 100) {
        if (gongSound.current) {
          gongSound.current.play();
          setTimeout(() => {
            if (gongSound.current && !isUnmountedRef.current) {
              gongSound.current.stop();
            }
          }, GONG_DURATION);
        }
        if (breathSound.current) {
          breathSound.current.play();
        }
      }

      // Resume animation from current state
      if (currentPhase === 'in') {
        Animated.timing(animation, {
          toValue: 1,
          duration: remainingTime,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start();
      } else if (currentPhase === 'out') {
        Animated.timing(animation, {
          toValue: 0,
          duration: remainingTime,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start();
      }

      // Resume countdown
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

        const newElapsed = Date.now() - startTimeRef.current;
        const secondsLeft = Math.ceil((duration - newElapsed) / 1000);

        if (secondsLeft > 0) {
          setCountdown(secondsLeft);
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          moveToNextPhase(currentPhase);
        }
      }, 100);
    }
  }, [phase, showInitialCountdown, initialCountdown, animation, startPhase]);

  useImperativeHandle(ref, () => ({
    handlePause,
    handleResume,
    cleanupAudio: () => {
      console.log('🧹 Cleaning up audio resources...');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (gongSound.current) {
        console.log('🧹 Releasing gong sound');
        gongSound.current.release();
      }
      if (breathSound.current) {
        console.log('🧹 Releasing breath sound');
        breathSound.current.release();
      }
      if (completionSound.current) {
        console.log('🧹 Releasing completion sound');
        completionSound.current.release();
      }
      console.log('✨ Audio cleanup complete');
    }
  }), [handlePause, handleResume]);

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

  if (showInitialCountdown) {
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