import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Video, { VideoRef } from 'react-native-video';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ExitModal from '../../components/ExitModal';
import { getBreathingVideo } from '../../services/videoService';

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
  const videoRef = useRef<VideoRef>(null);
  
  const handleExit = () => {
    setShowExitModal(true);
  };

  const handleExitConfirm = () => {
    navigation.navigate('MainTabs');
  };

  const handleExitCancel = () => {
    setShowExitModal(false);
  };

  const startBreathingCycle = () => {
    // Start with inhale
    setIsInhaling(true);
    setInstruction('Breathe In');
    
    // Schedule the state changes
    setTimeout(() => {
      setInstruction('Hold');
    }, INHALE_DURATION);

    setTimeout(() => {
      setIsInhaling(false);
      setInstruction('Breathe Out');
    }, INHALE_DURATION + HOLD_DURATION);

    setTimeout(() => {
      if (currentCycle < CYCLES) {
        setCurrentCycle(c => c + 1);
        startBreathingCycle();
      } else {
        navigation.navigate('SunBreathComplete');
      }
    }, INHALE_DURATION + HOLD_DURATION + EXHALE_DURATION);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      startBreathingCycle();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

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
        </View>

        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: getBreathingVideo(isInhaling ? 'inhale' : 'exhale') }}
            style={styles.video}
            resizeMode="cover"
            repeat={true}
            muted={true}
          />
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
});

export default SunBreathExerciseScreen; 