import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Sound from 'react-native-sound';
import { audioService, AUDIO_FILES } from '../services/audioService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BREATH_DURATION = 5000; // 5 seconds
const HOLD_DURATION = 5000;   // 5 seconds
const GONG_DURATION = 2000;   // 2 seconds
const INITIAL_DELAY = 2000; // 2 seconds
const TOTAL_CYCLES = 1;

// Enable playback in silence mode
Sound.setCategory('Playback', true);

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
  const [countdown, setCountdown] = useState(5);
  const animation = useRef(new Animated.Value(0)).current;
  const gongSound = useRef<Sound | null>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const pausedStateRef = useRef<{
    phase: typeof phase;
    countdown: number;
    breathsLeft: number;
  } | null>(null);
  const [completionSound, setCompletionSound] = useState<Sound | null>(null);
  const [initialCountdown, setInitialCountdown] = useState(Math.ceil(INITIAL_DELAY / 1000));
  const [isInitializing, setIsInitializing] = useState(true);
  const [breathSound, setBreathSound] = useState<Sound | null>(null);

  const startCountdown = (from: number = 5) => {
    // Clear existing countdown timers
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];

    // Set initial countdown
    setCountdown(from);

    // Create timers for each second
    for (let i = from - 1; i >= 1; i--) {
      const timer = setTimeout(() => {
        setCountdown(i);
      }, (from - i) * 1000);
      timersRef.current.push(timer);
    }
  };

  const startPhase = (currentPhase: typeof phase, startFrom?: number) => {
    setPhase(currentPhase);
    startCountdown(startFrom || Math.floor(BREATH_DURATION / 1000));

    // Start animation and sound based on phase
    switch (currentPhase) {
      case 'in':
      case 'out':
        // Play gong first
        playGong();
        // Then play nature sound after gong finishes
        const timer = setTimeout(() => {
          playBreathSound();
        }, GONG_DURATION + 100); // Add small buffer after gong
        timersRef.current.push(timer);
        
        Animated.timing(animation, {
          toValue: currentPhase === 'in' ? 1 : 0,
          duration: BREATH_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start();
        break;
      case 'hold-in':
        animation.setValue(1);  // Keep circle expanded
        break;
      case 'hold-out':
        animation.setValue(0);  // Keep circle small
        break;
    }

    const phaseTimer = setTimeout(() => {
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
          }
          break;
      }
    }, currentPhase.includes('hold') ? HOLD_DURATION : BREATH_DURATION);

    timersRef.current.push(phaseTimer);
  };

  // Add new effect for initial countdown
  useEffect(() => {
    if (isInitializing) {
      const countdownInterval = setInterval(() => {
        setInitialCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [isInitializing]);

  
  // Initialize
  useEffect(() => {
    let allSoundsLoaded = 0;
    
    // Initialize gong sound
    const sound = new Sound(require('../assets/audio/gong.wav'), (error) => {
      if (error) {
        console.log('Failed to load gong sound', error);
        return;
      }
      console.log('Gong sound loaded successfully');
      gongSound.current = sound;
      allSoundsLoaded++;
      
      // Initialize breath sound
      const breathSoundInit = new Sound(require('../assets/audio/nature.wav'), (error) => {
        if (error) {
          console.log('Failed to load breath sound', error);
          return;
        }
        console.log('Breath sound loaded successfully');
        breathSoundInit.setVolume(1.0);
        setBreathSound(breathSoundInit);
        allSoundsLoaded++;

        // Initialize completion sound
        const completeSound = new Sound(require('../assets/audio/haveagreatday.wav'), (error) => {
          if (error) {
            console.log('Failed to load completion sound', error);
            return;
          }
          console.log('Completion sound loaded successfully');
          setCompletionSound(completeSound);
          allSoundsLoaded++;

          // Start only when all sounds are loaded
          if (allSoundsLoaded === 3) {
            const initialTimer = setTimeout(() => {
              setIsInitializing(false);
              playGong();
              startPhase('in');
            }, INITIAL_DELAY);
            
            timersRef.current.push(initialTimer);
          }
        });
      });
    });

    return () => {
      if (gongSound.current) {
        gongSound.current.stop();
        gongSound.current.release();
        gongSound.current = null;
      }
      if (breathSound) {
        breathSound.stop();
        breathSound.release();
      }
      if (completionSound) {
        completionSound.stop();
        completionSound.release();
      }
    };
  }, []);


  useImperativeHandle(ref, () => ({
    handlePause: () => {
      // Juste pause l'exercice et l'audio
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
      pausedStateRef.current = { phase, countdown, breathsLeft };
      
      if (gongSound.current) gongSound.current.stop();
      if (breathSound) breathSound.stop();
      if (completionSound) completionSound.stop();
    },
    handleResume: () => {
      if (pausedStateRef.current) {
        startPhase(pausedStateRef.current.phase, pausedStateRef.current.countdown);
        setBreathsLeft(pausedStateRef.current.breathsLeft);
        pausedStateRef.current = null;
      }
    },
    cleanupAudio: () => {
      // Nettoie l'audio
      if (gongSound.current) {
        gongSound.current.stop();
        gongSound.current.release();
        gongSound.current = null;
      }
      if (breathSound) {
        breathSound.stop();
        breathSound.release();
      }
      if (completionSound) {
        completionSound.stop();
        completionSound.release();
      }
    }
  }));

  const playGong = () => {
    if (gongSound.current) {
      gongSound.current.stop(() => {
        gongSound.current?.setCurrentTime(0);
        gongSound.current?.play((success) => {
          if (!success) {
            console.log('Sound playback failed');
          }
        });
        // Stop the sound after GONG_DURATION
        const timeout = setTimeout(() => {
          gongSound.current?.stop();
        }, GONG_DURATION);
        return () => clearTimeout(timeout);
      });
    }
  };

  const playBreathSound = () => {
    if (breathSound) {
      console.log('Breath sound exists, attempting to play');
      console.log('Sound state:', {
        isLoaded: breathSound.isLoaded(),
        duration: breathSound.getDuration(),
        volume: breathSound.getVolume()
      });
      
      breathSound.stop(() => {
        console.log('Previous instance stopped, starting new play');
        breathSound.setCurrentTime(0);
        breathSound.play((success) => {
          if (!success) {
            console.log('Breath sound playback failed');
          } else {
            console.log('Breath sound playing successfully');
          }
        });
        // Play for the remaining duration after gong
        const timeout = setTimeout(() => {
          console.log('Stopping breath sound');
          breathSound.stop();
        }, BREATH_DURATION - GONG_DURATION - 100); // Adjust for the buffer
        timersRef.current.push(timeout);
      });
    } else {
      console.log('Breath sound not initialized');
    }
  };

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

  // Quand l'exercice est terminé
  useEffect(() => {
    if (phase === 'complete') {
      if (completionSound) {
        completionSound.play();
      }
      const timer = setTimeout(() => {
        onPhaseComplete(); // Notifie le parent que l'exercice est terminé
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, completionSound]);

  if (isInitializing) {
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
      <View style={styles.fullScreenButton}>
        <LinearGradient
          colors={['#3730A3', '#6366F1', '#818CF8']}
          style={[styles.fullScreenGradient, { marginTop: 0 }]}
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