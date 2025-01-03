import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions, Modal } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveIncantationsExercise'>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCROLL_DURATION = 5000; // 5 seconds per incantation

const ActiveIncantationsExerciseScreen: React.FC<Props> = ({ route, navigation }) => {
  const { incantations } = route.params;
  const [isPaused, setIsPaused] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);

  useEffect(() => {
    if (!isPaused && currentIndex < incantations.length) {
      const animation = Animated.timing(scrollY, {
        toValue: (currentIndex + 1) * SCREEN_HEIGHT,
        duration: SCROLL_DURATION,
        useNativeDriver: true,
      });

      animation.start(({ finished }) => {
        if (finished) {
          setCurrentIndex(prev => prev + 1);
        }
      });

      return () => animation.stop();
    }
  }, [currentIndex, isPaused]);

  const togglePause = () => setIsPaused(!isPaused);

  const handleExitPress = () => {
    setIsPaused(true);
    setIsExitModalVisible(true);
  };

  const handleModalClose = () => {
    setIsExitModalVisible(false);
    setIsPaused(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.exitButton} 
        onPress={handleExitPress}
      >
        <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.contentContainer} 
        activeOpacity={1} 
        onPress={togglePause}
      >
        <View style={styles.header}>
          <Text style={styles.pauseHint}>
            {isPaused ? 'Tap to Resume' : 'Tap to Pause'}
          </Text>
        </View>

        <Animated.View
          style={[
            styles.scrollContainer,
            {
              transform: [{ translateY: scrollY.interpolate({
                inputRange: [0, SCREEN_HEIGHT * incantations.length],
                outputRange: [0, -SCREEN_HEIGHT * incantations.length],
              })}],
            },
          ]}
        >
          {incantations.map((incantation, index) => (
            <View key={index} style={styles.incantationContainer}>
              <Text style={[
                styles.incantationText,
                index === currentIndex && styles.activeIncantation
              ]}>
                {incantation}
              </Text>
            </View>
          ))}
        </Animated.View>
      </TouchableOpacity>

      <Modal
        visible={isExitModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsExitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Wait! Are you sure?</Text>
            <Text style={styles.modalText}>
              You're making progress! Continue practicing to maintain your results.
            </Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => setIsExitModalVisible(false)}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exitButton}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <Text style={styles.exitText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    flex: 1,
  },

  header: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 1,
    alignItems: 'center',
  },
  pauseHint: {
    color: '#666',
    fontSize: 16,
  },
  scrollContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  incantationContainer: {
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  incantationText: {
    color: '#666', // Dimmed color for non-active incantations
    fontSize: 32,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  activeIncantation: {
    color: '#FFFFFF', // Bright white for active incantation
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    opacity: 0.8,
  },
  continueButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
    width: '100%',
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  exitButton: {
    backgroundColor: '#E31837',
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
  },
  exitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ActiveIncantationsExerciseScreen; 