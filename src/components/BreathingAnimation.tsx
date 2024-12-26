import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Sound from 'react-native-sound';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BREATH_DURATION = 5000; // 5 seconds
const HOLD_DURATION = 5000;   // 5 seconds
const GONG_DURATION = 1000;   // 1 second for gong
const TOTAL_CYCLES = 5;

const BreathingAnimation: React.FC = () => {
  const [breathsLeft, setBreathsLeft] = useState(TOTAL_CYCLES);
  const [phase, setPhase] = useState<'in' | 'hold-in' | 'out' | 'hold-out'>('in');
  const animation = useRef(new Animated.Value(0)).current;
  const isFirstRender = useRef(true);
  const gongSound = useRef<Sound | null>(null);

  useEffect(() => {
    // Initialize gong sound
    const sound = new Sound(require('../assets/audio/church.wav'), (error) => {
      if (error) {
        console.log('Failed to load gong sound', error);
        return;
      }
    });
    gongSound.current = sound;

    return () => {
      if (gongSound.current) {
        gongSound.current.release();
      }
    };
  }, []);

  const playGong = () => {
    if (gongSound.current) {
      gongSound.current.stop(() => {
        gongSound.current?.play((success) => {
          if (!success) {
            console.log('Gong sound playback failed');
          }
        });
      });
    }
  };

  useEffect(() => {
    const id = animation.addListener(() => {});

    const breatheIn = Animated.timing(animation, {
      toValue: 1,
      duration: BREATH_DURATION,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    });

    const holdIn = Animated.delay(HOLD_DURATION);

    const breatheOut = Animated.timing(animation, {
      toValue: 0,
      duration: BREATH_DURATION,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    });

    const holdOut = Animated.delay(HOLD_DURATION);

    const sequence = Animated.sequence([
      Animated.sequence([
        Animated.delay(GONG_DURATION), // Delay for gong sound
        breatheIn,
        holdIn,
        Animated.delay(GONG_DURATION), // Delay for gong sound
        breatheOut,
        holdOut,
      ])
    ]);

    if (!isFirstRender.current) {
      sequence.start(({ finished }) => {
        if (finished) {
          switch (phase) {
            case 'in':
              setPhase('hold-in');
              break;
            case 'hold-in':
              playGong();
              setPhase('out');
              break;
            case 'out':
              setPhase('hold-out');
              break;
            case 'hold-out':
              if (breathsLeft > 1) {
                playGong();
                setPhase('in');
                setBreathsLeft(prev => prev - 1);
                sequence.reset();
                sequence.start();
              }
              break;
          }
        }
      });

      // Play gong at the start of breathing in
      if (phase === 'in') {
        playGong();
      }
    }
    isFirstRender.current = false;

    return () => {
      sequence.stop();
      animation.removeListener(id);
    };
  }, [phase, breathsLeft]);

  const getWaveStyle = (offset: number) => ({
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -100 + offset],
        }),
      },
    ],
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

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.phaseText}>
          {getPhaseText()}
        </Text>
        <Text style={styles.breathsText}>
          {breathsLeft} breaths left
        </Text>
      </View>

      <View style={styles.wavesContainer}>
        <Animated.View style={[styles.waveWrapper, getWaveStyle(0)]}>
          <LinearGradient
            colors={['#4A1D96', '#7C3AED', '#8B5CF6']}
            style={styles.wave}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
        <Animated.View style={[styles.waveWrapper, getWaveStyle(30)]}>
          <LinearGradient
            colors={['#4A1D96', '#7C3AED', '#8B5CF6']}
            style={styles.wave}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
        <Animated.View style={[styles.waveWrapper, getWaveStyle(60)]}>
          <LinearGradient
            colors={['#4A1D96', '#7C3AED', '#8B5CF6']}
            style={styles.wave}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  phaseText: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  breathsText: {
    fontSize: 24,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
  },
  wavesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  waveWrapper: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 1.2,
    bottom: -SCREEN_HEIGHT * 0.2,
  },
  wave: {
    flex: 1,
    borderTopLeftRadius: SCREEN_WIDTH * 0.5,
    borderTopRightRadius: SCREEN_WIDTH * 0.5,
  },
});

export default BreathingAnimation;
