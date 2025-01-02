import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  Alert,
  Modal,
  SafeAreaView,
  Vibration,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { markExerciseAsCompleted } from '../../services/exerciseService';
import LinearGradient from 'react-native-linear-gradient';
import Sound from 'react-native-sound';

// Enable playback in silence mode
Sound.setCategory('Playback');

const TOTAL_BEADS = 20;
const BEAD_SIZE = 30;
const CIRCLE_RADIUS = Dimensions.get('window').width * 0.35;
const HOLD_DURATION = 500; // Reduced from 2000 to 500ms to make it more responsive
const PROGRESS_VIBRATION = 50; // Short vibration for progress
const SUCCESS_VIBRATION = [100, 100, 100]; // Pattern for bead completion
const COMPLETION_VIBRATION = [0, 100, 50, 100, 50, 100, 50, 200]; // Special pattern for completing all beads

const GRATITUDE_PROMPTS = [
  "I'm grateful for my health because...",
  "I'm grateful for my family because...",
  "I'm grateful for this moment because...",
  "I'm grateful for my home because...",
  "I'm grateful for nature because...",
  "I'm grateful for a challenge I overcame because...",
  "I'm grateful for a friend who supports me because...",
  "I'm grateful for my abilities because...",
  "I'm grateful for a recent learning experience because...",
  "I'm grateful for a small joy today because...",
  "I'm grateful for my morning routine because...",
  "I'm grateful for a mistake I made because...",
  "I'm grateful for technology because...",
  "I'm grateful for my community because...",
  "I'm grateful for a memory that makes me smile because...",
  "I'm grateful for my current emotions because...",
  "I'm grateful for my body because...",
  "I'm grateful for an opportunity I have because...",
  "I'm grateful for someone who inspires me because...",
  "I'm grateful for a simple pleasure because...",
  "I'm grateful for a book or movie because...",
  "I'm grateful for my work/studies because...",
  "I'm grateful for a tradition I have because...",
  "I'm grateful for my pet/animals because...",
  "I'm grateful for music because...",
];

interface BeadProps {
  index: number;
  isCompleted: boolean;
  isCurrent: boolean;
  position: { x: number; y: number };
  onHold: () => void;
}

const Bead: React.FC<BeadProps> = ({ index, isCompleted, isCurrent, position, onHold }) => {
  const [isHolding, setIsHolding] = useState(false);
  const holdTimer = useRef<NodeJS.Timeout>();
  const progressTimer = useRef<NodeJS.Timeout>();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isCurrent) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [isCurrent]);

  const handlePressIn = () => {
    if (!isCurrent) return;
    
    setIsHolding(true);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: HOLD_DURATION,
      useNativeDriver: false,
    }).start();

    // Add progress vibration
    progressTimer.current = setInterval(() => {
      Vibration.vibrate(PROGRESS_VIBRATION);
    }, HOLD_DURATION / 3);

    holdTimer.current = setTimeout(() => {
      setIsHolding(false);
      progressAnim.setValue(0);
      clearInterval(progressTimer.current);
      Vibration.vibrate(SUCCESS_VIBRATION); // Vibrate on successful hold
      onHold();
    }, HOLD_DURATION);
  };

  const handlePressOut = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
    }
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
    }
    setIsHolding(false);
    progressAnim.setValue(0);
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={isCurrent ? 0.7 : 1}
    >
      <Animated.View
        style={[
          styles.beadContainer,
          {
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={
            isCompleted 
              ? ['#FFD700', '#FFA500', '#FFD700'] 
              : ['#8B4513', '#654321', '#8B4513']
          }
          style={[
            styles.bead,
            {
              borderWidth: isCurrent ? 2 : 0,
              borderColor: '#FFFFFF',
            },
          ]}
        />
        {isHolding && (
          <Animated.View
            style={[
              styles.progressRing,
              {
                borderColor: '#FFD700',
                borderWidth: 2,
                opacity: progressAnim,
              },
            ]}
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const GratitudeBeadsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [completedBeads, setCompletedBeads] = useState<number[]>([]);
  const [currentBead, setCurrentBead] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const backgroundMusic = useRef<Sound | null>(null);

  useEffect(() => {
    // Initialize and play background music
    backgroundMusic.current = new Sound(
      require('../../assets/audio/musics/necklace-beads.wav'),
      (error) => {
        if (error) {
          console.log('Failed to load background music', error);
          return;
        }
        
        if (backgroundMusic.current) {
          backgroundMusic.current.setVolume(0.3); // Set lower volume
          backgroundMusic.current.setNumberOfLoops(-1); // Loop indefinitely
          backgroundMusic.current.play((success) => {
            if (!success) {
              console.log('Playback failed');
            }
          });
        }
      }
    );

    // Cleanup function
    return () => {
      if (backgroundMusic.current) {
        backgroundMusic.current.stop();
        backgroundMusic.current.release();
      }
    };
  }, []);

  useEffect(() => {
    // Rotate through prompts
    const interval = setInterval(() => {
      setCurrentPrompt(prev => (prev + 1) % GRATITUDE_PROMPTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleBeadHold = () => {
    if (!completedBeads.includes(currentBead)) {
      // Mark current bead as completed
      setCompletedBeads(prev => [...prev, currentBead]);
      // Move to next bead
      setCurrentBead(prev => Math.min(prev + 1, TOTAL_BEADS - 1));
    }
  };

  // Calculate bead positions using elliptical shape
  const getBeadPosition = (index: number) => {
    const a = CIRCLE_RADIUS * 1.2; // horizontal radius (wider)
    const b = CIRCLE_RADIUS * 0.8; // vertical radius (shorter)
    const angle = (index * 2 * Math.PI) / TOTAL_BEADS;
    
    // Add a slight droop effect
    const droopFactor = Math.sin(angle) * 20;
    
    const x = a * Math.cos(angle);
    const y = b * Math.sin(angle) + droopFactor;
    
    return { x, y };
  };

  const handleComplete = async () => {
    if (completedBeads.length < TOTAL_BEADS) {
      Alert.alert(
        'Not Done Yet',
        `You still have ${TOTAL_BEADS - completedBeads.length} beads to go. Keep going!`
      );
      return;
    }

    // Add completion vibration
    Vibration.vibrate(COMPLETION_VIBRATION);

    try {
      const success = await markExerciseAsCompleted(
        'gratitude-beads',
        'Gratitude Beads'
      );

      if (success) {
        Alert.alert(
          'Congratulations!',
          'You have completed your gratitude practice for today.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('MainTabs'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to mark exercise as completed:', error);
      Alert.alert('Error', 'Failed to complete exercise. Please try again.');
    }
  };

  const handleExit = () => {
    // Stop music when exiting
    if (backgroundMusic.current) {
      backgroundMusic.current.stop();
    }
    setShowExitModal(true);
  };

  const handleUndo = () => {
    if (completedBeads.length > 0) {
      // Remove last completed bead
      setCompletedBeads(prev => prev.slice(0, -1));
      // Move back to previous bead
      setCurrentBead(prev => Math.max(0, prev - 1));
      // Add a subtle vibration feedback
      Vibration.vibrate(50);
    }
  };

  const toggleMusic = () => {
    if (backgroundMusic.current) {
      if (isMusicPlaying) {
        backgroundMusic.current.pause();
      } else {
        backgroundMusic.current.play();
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.exitButton}
        onPress={handleExit}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.topRightButtons}>
        {completedBeads.length > 0 && (
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleUndo}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="undo" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={toggleMusic}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons 
            name={isMusicPlaying ? "music" : "music-off"} 
            size={24} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Gratitude Beads</Text>
        <Text style={styles.instructions}>
          Touch and hold for <Text style={{ fontWeight: 'bold' }}>2 seconds</Text> each highlighted bead while expressing your gratitude
        </Text>

        <View style={styles.beadsContainer}>
          <View style={styles.beadsCircle}>
            {Array.from({ length: TOTAL_BEADS }).map((_, index) => {
              const position = getBeadPosition(index);
              return (
                <Bead
                  key={index}
                  index={index}
                  isCompleted={completedBeads.includes(index)}
                  isCurrent={currentBead === index}
                  position={position}
                  onHold={handleBeadHold}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.promptContainer}>
          <Text style={styles.promptText}>
            {GRATITUDE_PROMPTS[currentPrompt]}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.completeButton,
            completedBeads.length < TOTAL_BEADS && styles.completeButtonDisabled
          ]}
          onPress={handleComplete}
          disabled={completedBeads.length < TOTAL_BEADS}
        >
          <Text style={styles.completeButtonText}>
            {completedBeads.length === TOTAL_BEADS ? "I'm Done" : `${TOTAL_BEADS - completedBeads.length} More to Go`}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showExitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Wait! Are you sure?</Text>
            <Text style={styles.modalText}>
              Your progress will be saved and you can continue your gratitude practice later.
            </Text>
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={() => {
                setShowExitModal(false);
                // Resume music if continuing
                backgroundMusic.current?.play();
              }}
            >
              <Text style={styles.continueButtonText}>Continue Practice</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.exitModalButton}
              onPress={() => {
                // Stop music before navigating
                backgroundMusic.current?.stop();
                navigation.navigate('MainTabs');
              }}
            >
              <Text style={styles.exitModalButtonText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  exitButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 30,
    marginBottom: 16,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 30,
    opacity: 0.8,
  },
  beadsContainer: {
    width: CIRCLE_RADIUS * 2.2,
    height: CIRCLE_RADIUS * 2.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beadsCircle: {
    width: CIRCLE_RADIUS * 2,
    height: CIRCLE_RADIUS * 2,
    position: 'relative',
  },
  beadContainer: {
    position: 'absolute',
    width: BEAD_SIZE,
    height: BEAD_SIZE,
    left: CIRCLE_RADIUS - BEAD_SIZE / 2,
    top: CIRCLE_RADIUS - BEAD_SIZE / 2,
  },
  bead: {
    width: '100%',
    height: '100%',
    borderRadius: BEAD_SIZE / 2,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -BEAD_SIZE / 2,
    left: -BEAD_SIZE / 2,
    width: BEAD_SIZE * 2,
    height: BEAD_SIZE * 2,
    borderRadius: BEAD_SIZE,
    backgroundColor: '#FFD700',
    opacity: 0.3,
  },
  progress: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 32,
    marginBottom: 24,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    marginBottom: 40,
  },
  completeButtonDisabled: {
    backgroundColor: 'rgba(255, 215, 0, 0.5)',
  },
  completeButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  continueButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    marginBottom: 12,
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  exitModalButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
  },
  exitModalButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  promptContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginTop: 40,
    marginBottom: 70,
  },
  promptText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  progressRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: BEAD_SIZE,
  },
  musicButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  topRightButtons: {
    position: 'absolute',
    top: 60,
    right: 16,
    flexDirection: 'row',
    gap: 12,
    zIndex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GratitudeBeadsScreen; 