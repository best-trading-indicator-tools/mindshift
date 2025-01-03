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
import Svg, { Path } from 'react-native-svg';
import RNFS from 'react-native-fs';
import { audioService, AUDIO_FILES } from '../../services/audioService';


// Enable playback in silence mode
Sound.setCategory('Playback');

const TOTAL_BEADS = 2;
const BEAD_SIZE = 30;
const CIRCLE_RADIUS = Dimensions.get('window').width * 0.35;
const HOLD_DURATION = 300; // Reduced from 500ms to 300ms for better responsiveness
const PROGRESS_VIBRATION = 50; // Short vibration for progress
const SUCCESS_VIBRATION = [100, 100, 100]; // Pattern for bead completion
const COMPLETION_VIBRATION = [0, 100, 50, 100, 50, 100, 50, 200]; // Special pattern for completing all beads

const HAPTICS = {
  TOUCH: [10] as number[], // Light initial touch
  HOLD: [1, 50, 1, 50, 1] as number[], // Subtle rolling feeling
  COMPLETE: [50, 30, 100] as number[], // Satisfying click
  SEQUENCE_COMPLETE: [0, 100, 50, 100, 50, 100, 50, 200] as number[], // Final completion
};

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
  const [showParticles, setShowParticles] = useState(false);
  const holdTimer = useRef<NodeJS.Timeout>();
  const progressTimer = useRef<NodeJS.Timeout>();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

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
    
    // Initial touch feedback
    Vibration.vibrate(HAPTICS.TOUCH);
    
    setIsHolding(true);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: HOLD_DURATION,
      useNativeDriver: false,
    }).start();

    // Rolling bead feedback
    progressTimer.current = setInterval(() => {
      Vibration.vibrate(HAPTICS.HOLD);
    }, HOLD_DURATION / 3);

    holdTimer.current = setTimeout(() => {
      setIsHolding(false);
      progressAnim.setValue(0);
      clearInterval(progressTimer.current);
      
      // Completion feedback
      Vibration.vibrate(HAPTICS.COMPLETE);
      
      // Completion animation sequence
      setShowParticles(true);
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowParticles(false);
      });
      
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
        {isCompleted && (
          <Animated.View
            style={[
              styles.glow,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.6],
                }),
              },
            ]}
          />
        )}
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
        {showParticles && (
          <View style={styles.particlesContainer}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.particle,
                  {
                    transform: [
                      {
                        translateX: glowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, Math.cos(i * Math.PI / 4) * 30],
                        }),
                      },
                      {
                        translateY: glowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, Math.sin(i * Math.PI / 4) * 30],
                        }),
                      },
                    ],
                    opacity: glowAnim,
                  },
                ]}
              />
            ))}
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const setupAudioFile = async (url: string): Promise<string> => {
  const filename = 'necklace-beads.wav';
  const localPath = `${RNFS.CachesDirectoryPath}/${filename}`;

  try {
    // Check if file exists in cache
    const exists = await RNFS.exists(localPath);
    if (exists) {
      return localPath;
    }

    // Download and cache the file
    await RNFS.downloadFile({
      fromUrl: url,
      toFile: localPath,
    }).promise;

    return localPath;
  } catch (error) {
    console.error('Error setting up audio file:', error);
    throw error;
  }
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
    const initAudio = async () => {
      try {
        backgroundMusic.current = await audioService.loadSound(
          AUDIO_FILES.NECKLACE_BEADS,
          (state) => {
            if (state.error) {
              console.error('Error loading background music:', state.error);
            }
          }
        );

        if (backgroundMusic.current) {
          backgroundMusic.current.setVolume(0.3);
          backgroundMusic.current.setNumberOfLoops(-1);
          backgroundMusic.current.play((success) => {
            if (!success) {
              console.log('Playback failed');
            }
          });
        }
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

    initAudio();

    // Cleanup function
    return () => {
      if (backgroundMusic.current) {
        backgroundMusic.current.stop();
        audioService.releaseSound(AUDIO_FILES.NECKLACE_BEADS.filename);
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

  // Add function to generate path between completed beads
  const generateBeadPath = (completedBeads: number[], getPosition: (index: number) => { x: number; y: number }) => {
    if (completedBeads.length < 2) return '';
    
    // Sort beads by index to ensure correct path order
    const sortedBeads = [...completedBeads].sort((a, b) => a - b);
    
    const points = sortedBeads.map(index => {
      const pos = getPosition(index);
      // Add CIRCLE_RADIUS to center the path in the container
      return `${pos.x + CIRCLE_RADIUS},${pos.y + CIRCLE_RADIUS}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  return (
    <SafeAreaView style={[styles.container, styles.safeArea]}>
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

      <View style={styles.mainContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Gratitude Beads</Text>
          
          <View style={styles.progressIndicator}>
            <View style={styles.progressText}>
              <Text style={styles.progressNumber}>{completedBeads.length}</Text>
              <Text style={styles.progressTotal}>/ {TOTAL_BEADS}</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${(completedBeads.length / TOTAL_BEADS) * 100}%` }
                ]} 
              />
            </View>
          </View>

          <Text style={styles.instructions}>
            Touch and hold each highlighted bead while expressing your gratitude
          </Text>

          <View style={styles.beadsContainer}>
            <View style={styles.beadsCircle}>
              <Svg style={StyleSheet.absoluteFill}>
                <Path
                  d={generateBeadPath(completedBeads, getBeadPosition)}
                  stroke="rgba(255, 215, 0, 0.3)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <Path
                  d={generateBeadPath(completedBeads, getBeadPosition)}
                  stroke="rgba(255, 215, 0, 0.1)"
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
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

          <Animated.View 
            style={[
              styles.promptCard,
              {
                transform: [{
                  scale: new Animated.Value(1)
                }]
              }
            ]}
          >
            <View style={styles.promptHeader}>
              <MaterialCommunityIcons name="lightbulb-outline" size={24} color="#FFD700" />
              <Text style={styles.promptTitle}>Gratitude Prompt</Text>
            </View>
            <Text style={styles.promptText}>
              {GRATITUDE_PROMPTS[currentPrompt]}
            </Text>
          </Animated.View>
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
            I'm Done
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
  safeArea: {
    flex: 1,
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
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 40,
    marginBottom: 16,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.8,
  },
  beadsContainer: {
    width: CIRCLE_RADIUS * 2.2,
    height: CIRCLE_RADIUS * 2.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
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
    marginBottom: 20,
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
    marginBottom: 36,
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
  progressIndicator: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressText: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  progressNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  progressTotal: {
    fontSize: 20,
    color: '#FFFFFF',
    opacity: 0.7,
    marginLeft: 4,
  },
  progressBar: {
    width: '80%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  promptCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    width: '100%',
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 8,
  },
  promptText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  mainContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
  },
});

export default GratitudeBeadsScreen; 