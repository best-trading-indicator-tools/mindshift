import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, SafeAreaView, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Video, { VideoRef } from 'react-native-video';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ExitModal from '../../components/ExitModal';
import { videoService, VideoLoadingState } from '../../services/videoService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SunBreathExercise'>;

const { width, height } = Dimensions.get('window');

const INHALE_DURATION = 4000; // 4 seconds
const HOLD_DURATION = 1000; // 1 second
const EXHALE_DURATION = 6000; // 6 seconds
const CYCLES = 5;

const SunBreathExerciseScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [currentCycle, setCurrentCycle] = useState(1);
  const [isInhaling, setIsInhaling] = useState(true);
  const [instruction, setInstruction] = useState('Breathe In');
  const [showExitModal, setShowExitModal] = useState(false);
  const [countdown, setCountdown] = useState(4); // Start with inhale duration
  const [videoPath, setVideoPath] = useState<string>('');
  const [loadingState, setLoadingState] = useState<VideoLoadingState>({
    isLoading: true,
    progress: 0,
    error: null
  });
  const videoRef = useRef<VideoRef>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleExit = () => {
    setShowExitModal(true);
  };

  const handleExitConfirm = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    navigation.navigate('MainTabs');
  };

  const handleExitCancel = () => {
    setShowExitModal(false);
  };

  const loadVideo = async (type: 'inhale' | 'exhale') => {
    try {
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

  const startCountdown = (duration: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const seconds = Math.floor(duration / 1000);
    setCountdown(seconds);
    
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startBreathingCycle = () => {
    // Start with inhale
    setIsInhaling(true);
    setInstruction('Breathe In');
    startCountdown(INHALE_DURATION);
    loadVideo('inhale');
    
    // Schedule the state changes
    setTimeout(() => {
      setInstruction('Hold');
      startCountdown(HOLD_DURATION);
    }, INHALE_DURATION);

    setTimeout(() => {
      setIsInhaling(false);
      setInstruction('Breathe Out');
      startCountdown(EXHALE_DURATION);
      loadVideo('exhale');
    }, INHALE_DURATION + HOLD_DURATION);

    setTimeout(() => {
      if (currentCycle < CYCLES) {
        setCurrentCycle(c => c + 1);
        startBreathingCycle();
      } else {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        navigation.navigate('SunBreathComplete');
      }
    }, INHALE_DURATION + HOLD_DURATION + EXHALE_DURATION);
  };

  useEffect(() => {
    loadVideo('inhale');
    const timer = setTimeout(() => {
      startBreathingCycle();
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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
            />
          )}
        </View>
      </View>

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
  },
  cycleText: {
    color: '#FFD700',
    fontSize: 20,
    marginBottom: 10,
  },
  instructionText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  countdownText: {
    color: '#FFD700',
    fontSize: 48,
    fontWeight: 'bold',
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#FFD700',
    fontSize: 16,
    marginTop: 10,
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
});

export default SunBreathExerciseScreen; 