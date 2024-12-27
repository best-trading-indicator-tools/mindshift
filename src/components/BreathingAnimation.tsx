import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Sound from 'react-native-sound';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BREATH_DURATION = 5000; // 5 seconds for a more relaxed breath
const HOLD_DURATION = 5000;   // 5 seconds hold
const GONG_DURATION = 2000;   // 2 seconds for gong
const TOTAL_CYCLES = 5;

// Enable playback in silence mode
Sound.setCategory('Playback', true);

const BreathingAnimation: React.FC<{ 
  navigation: any;
  onComplete: () => void;
}> = ({ navigation, onComplete }) => {
  const [breathsLeft, setBreathsLeft] = useState(TOTAL_CYCLES);
  const [phase, setPhase] = useState<'in' | 'hold-in' | 'out' | 'hold-out' | 'complete'>('in');
  const [countdown, setCountdown] = useState(5);
  const animation = useRef(new Animated.Value(0)).current;
  const gongSound = useRef<Sound | null>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // Initialize sound
  useEffect(() => {
    // Initialize gong sound
    const sound = new Sound(require('../assets/audio/gong.wav'), (error) => {
      if (error) {
        console.log('Failed to load gong sound', error);
        return;
      }
      console.log('Sound loaded successfully');
      gongSound.current = sound;
      // Start the first cycle
      playGong();
      startBreathingCycle();
    });

    // Cleanup when component unmounts
    return () => {
      if (gongSound.current) {
        gongSound.current.stop();
        gongSound.current.release();
        gongSound.current = null;
      }
    };
  }, []);

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

  const startBreathingCycle = useCallback(() => {
    // Clear any existing timers
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];

    // Reset animation value
    animation.setValue(0);

    // Start with 'in' phase
    setPhase('in');
    setCountdown(5);
    playGong();

    // Set up countdown timers for each second
    const countdownTimers = [];
    for (let i = 4; i >= 1; i--) {
      countdownTimers.push(
        setTimeout(() => setCountdown(i), (5 - i) * 1000)
      );
    }

    const sequence = Animated.sequence([
      // Breath in
      Animated.timing(animation, {
        toValue: 1,
        duration: BREATH_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      // Hold in
      Animated.timing(animation, {
        toValue: 1,
        duration: HOLD_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      // Breath out
      Animated.timing(animation, {
        toValue: 0,
        duration: BREATH_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      // Hold out
      Animated.timing(animation, {
        toValue: 0,
        duration: HOLD_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]);

    // Set up phase change timers
    const phaseTimers = [
      // Breath in -> Hold
      setTimeout(() => {
        setPhase('hold-in');
        setCountdown(5);
      }, BREATH_DURATION),
      
      // Hold -> Breath out
      setTimeout(() => {
        setPhase('out');
        setCountdown(5);
        playGong();
      }, BREATH_DURATION + HOLD_DURATION),
      
      // Breath out -> Hold
      setTimeout(() => {
        setPhase('hold-out');
        setCountdown(5);
      }, BREATH_DURATION * 2 + HOLD_DURATION),
      
      // Hold -> Next cycle or complete
      setTimeout(() => {
        if (breathsLeft > 1) {
          setBreathsLeft(prev => prev - 1);
          startBreathingCycle();
        } else {
          setPhase('complete');
        }
      }, (BREATH_DURATION + HOLD_DURATION) * 2)
    ];

    // Add countdown timers for each phase
    for (let phase = 1; phase <= 4; phase++) {
      const phaseStart = phase === 1 ? 0 : 
                        phase === 2 ? BREATH_DURATION :
                        phase === 3 ? BREATH_DURATION + HOLD_DURATION :
                        BREATH_DURATION * 2 + HOLD_DURATION;
      
      for (let i = 4; i >= 1; i--) {
        phaseTimers.push(
          setTimeout(() => setCountdown(i), phaseStart + (5 - i) * 1000)
        );
      }
    }

    timersRef.current = [...countdownTimers, ...phaseTimers];

    // Start the sequence
    sequence.start();

    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, [breathsLeft, animation]);

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

  const handleCompletion = () => {
    // Clean up gong sound first
    if (gongSound.current) {
      gongSound.current.stop();
      gongSound.current.release();
      gongSound.current = null;
    }

    // Call onComplete immediately to navigate back
    onComplete();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gongSound.current) {
        gongSound.current.stop();
        gongSound.current.release();
        gongSound.current = null;
      }
    };
  }, []);

  if (phase === 'complete') {
    return (
      <TouchableOpacity 
        style={styles.fullScreenButton}
        onPress={onComplete}
      >
        <LinearGradient
          colors={['#3730A3', '#6366F1', '#818CF8']}
          style={styles.fullScreenGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.completionText}>
            Have a good day!
          </Text>
        </LinearGradient>
      </TouchableOpacity>
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
};

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
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  fullScreenGradient: {
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
