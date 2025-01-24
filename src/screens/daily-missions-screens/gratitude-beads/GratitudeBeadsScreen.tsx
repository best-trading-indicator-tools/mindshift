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
import { markExerciseAsCompleted } from '../../../services/exerciseService';
import LinearGradient from 'react-native-linear-gradient';
import Sound from 'react-native-sound';
import Svg, { Path } from 'react-native-svg';
import RNFS from 'react-native-fs';
import { audioService, AUDIO_FILES } from '../../../services/audioService';
import { markDailyExerciseAsCompleted, markChallengeExerciseAsCompleted } from '../../../utils/exerciseCompletion';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { AudioEncoderAndroidType, AudioSourceAndroidType, AVEncoderAudioQualityIOSType, AVEncodingOption } from 'react-native-audio-recorder-player';
import { config } from '../../../config/env';

// Enable playback in silence mode
Sound.setCategory('Playback');

const TOTAL_BEADS = 4;
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
  onRelease: () => void;
  isRecording: boolean;
}

const Bead: React.FC<BeadProps> = ({ 
  index, 
  isCompleted, 
  isCurrent, 
  position, 
  onHold,
  onRelease,
  isRecording 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressStartTime = useRef<number>(0);

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
    pressStartTime.current = Date.now();
  };

  const handlePressOut = () => {
    pressStartTime.current = 0;
  };

  const handlePress = () => {
    if (!isCurrent) return;
    const pressDuration = Date.now() - pressStartTime.current;
    if (pressDuration >= 1000) {
      Vibration.vibrate(HAPTICS.TOUCH);
      onHold();
    }
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
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
                opacity: scaleAnim.interpolate({
                  inputRange: [1, 1.2],
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

// Modify the interface to store audio paths instead of transcriptions
interface BeadRecording {
  beadIndex: number;
  audioPath: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'GratitudeBeads'>;

const GratitudeBeadsScreen: React.FC<Props> = ({ navigation, route }) => {
  const [completedBeads, setCompletedBeads] = useState<number[]>([]);
  const [currentBead, setCurrentBead] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const backgroundMusic = useRef<Sound | null>(null);
  const [recordings, setRecordings] = useState<BeadRecording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [currentRecordingBead, setCurrentRecordingBead] = useState<number | null>(null);
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer());
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const LONG_PRESS_DURATION = 1000; // 1 second

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
        backgroundMusic.current.setNumberOfLoops(-1); // Loop indefinitely
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

  useEffect(() => {
    initAudio();
    return () => {
      // Cleanup all audio when component unmounts
      audioService.releaseAllSounds();
    };
  }, []);

  useEffect(() => {
    // Rotate through prompts
    const interval = setInterval(() => {
      setCurrentPrompt(prev => (prev + 1) % GRATITUDE_PROMPTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Add function to handle recording
  const startRecording = async (beadIndex: number) => {
    try {
      // First ensure any existing recording is stopped
      if (isRecording) {
        await audioRecorderPlayer.current.stopRecorder();
        audioRecorderPlayer.current.removeRecordBackListener();
      }

      setIsRecording(true);
      setCurrentRecordingBead(beadIndex);
      setShowRecordingModal(true);
      setRecordingDuration(0);

      const audioSet = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: AVEncodingOption.aac,
      };

      // Add recording duration listener
      audioRecorderPlayer.current.addRecordBackListener((e) => {
        setRecordingDuration(e.currentPosition);
      });

      // Let the recorder handle the file path
      const uri = await audioRecorderPlayer.current.startRecorder(undefined, audioSet);
      console.log('Recording started at:', uri);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      setIsRecording(false);
      setCurrentRecordingBead(null);
      setShowRecordingModal(false);
    }
  };

  const stopRecording = async () => {
    if (!isRecording || currentRecordingBead === null) return;

    try {
      const audioPath = await audioRecorderPlayer.current.stopRecorder();
      audioRecorderPlayer.current.removeRecordBackListener();
      
      // Create a unique filename for this recording
      const uniqueFilename = `bead_${currentRecordingBead}_${Date.now()}.m4a`;
      const uniquePath = `${RNFS.CachesDirectoryPath}/${uniqueFilename}`;
      
      // Copy the recording to a unique file
      await RNFS.copyFile(audioPath, uniquePath);
      
      // Add new recording or update existing one with the unique path
      setRecordings(prev => {
        const updatedRecordings = prev.filter(r => r.beadIndex !== currentRecordingBead);
        return [...updatedRecordings, { beadIndex: currentRecordingBead, audioPath: uniquePath }];
      });
      
      // Mark bead as completed and move to next IMMEDIATELY
      setCompletedBeads(prev => [...prev, currentRecordingBead]);
      setCurrentBead(prev => Math.min(prev + 1, TOTAL_BEADS - 1));
      
      // Clean up recording state
      setIsRecording(false);
      setShowRecordingModal(false);
      setRecordingDuration(0);

    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording. Please try again.');
    } finally {
      setCurrentRecordingBead(null);
    }
  };

  const handleBeadHold = async () => {
    if (!completedBeads.includes(currentBead)) {
      await startRecording(currentBead);
    }
  };

  const handleBeadRelease = async () => {
    if (isRecording) {
      await stopRecording();
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

  // Modify handleComplete to include recordings
  const handleComplete = async () => {
    // Make sure we have recordings for all completed beads
    const allRecordings = recordings.filter(r => completedBeads.includes(r.beadIndex));
    
    if (allRecordings.length !== completedBeads.length) {
      Alert.alert(
        "Missing Recordings",
        "Some beads are missing their recordings. Please record your gratitude for all beads."
      );
      return;
    }

    // Navigate to analysis with all recordings
    navigation.navigate('GratitudeBeadsAnalysis', {
      recordings: allRecordings,
      context: route.params?.context,
      challengeId: route.params?.challengeId
    });

    // Mark exercise as completed based on context
    try {
      if (route.params?.context === 'challenge' && route.params?.challengeId) {
        const exerciseId = route.params.challengeId === '2' ? 'gratitude-beads-3' : 'gratitude-beads';
        await markChallengeExerciseAsCompleted(route.params.challengeId, exerciseId);
        if (route.params?.onComplete) {
          route.params.onComplete();
        }
      } else {
        await markDailyExerciseAsCompleted('gratitude-beads');
      }
    } catch (error) {
      console.error('Error marking exercise as completed:', error);
    }
  };

  const handleExit = () => {
    navigation.navigate('MainTabs');
  };

  const handleUndo = () => {
    if (completedBeads.length > 0) {
      const lastCompletedBead = completedBeads[completedBeads.length - 1];
      
      // Remove last completed bead
      setCompletedBeads(prev => prev.slice(0, -1));
      
      // Move back to previous bead
      setCurrentBead(prev => Math.max(0, prev - 1));
      
      // Remove the recording for this bead
      setRecordings(prev => prev.filter(r => r.beadIndex !== lastCompletedBead));
      
      // Stop recording if it's in progress
      if (isRecording) {
        audioRecorderPlayer.current.stopRecorder();
        audioRecorderPlayer.current.removeRecordBackListener();
        setIsRecording(false);
        setShowRecordingModal(false);
        setCurrentRecordingBead(null);
        setRecordingDuration(0);
      }
      
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
    
    // If all beads are completed, connect them all
    if (completedBeads.length === TOTAL_BEADS) {
      const points = Array.from({ length: TOTAL_BEADS }).map((_, index) => {
        const pos = getPosition(index);
        return `${pos.x + CIRCLE_RADIUS},${pos.y + CIRCLE_RADIUS}`;
      });
      // Connect all points and close the path
      return `M ${points.join(' L ')} L ${points[0]}`;
    }
    
    // Otherwise, just connect completed beads in sequence
    const sortedBeads = [...completedBeads].sort((a, b) => a - b);
    const points = sortedBeads.map(index => {
      const pos = getPosition(index);
      return `${pos.x + CIRCLE_RADIUS},${pos.y + CIRCLE_RADIUS}`;
    });
    return `M ${points.join(' L ')}`;
  };

  // Modify the recording modal render function
  const renderRecordingModal = () => (
    <Modal
      visible={showRecordingModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}} // Empty function to prevent modal from closing on Android back button
    >
      <View style={styles.modalOverlay}>
        <View style={styles.recordingModalContent}>
          <Text style={styles.recordingTitle}>Recording Gratitude...</Text>
          <Text style={styles.recordingInstructions}>
            Speak your gratitude{'\n'}
            Tap the red button when done
          </Text>
          <Text style={styles.recordingTimer}>
            {new Date(recordingDuration).toISOString().substr(14, 5)}
          </Text>
          <TouchableOpacity 
            style={[styles.recordingIndicator, isRecording && styles.recordingActive]}
            onPress={handleBeadRelease}
          >
            <MaterialCommunityIcons 
              name="microphone" 
              size={32} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
            Press each highlighted bead to record your gratitude
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
                    onRelease={handleBeadRelease}
                    isRecording={isRecording}
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
      {renderRecordingModal()}
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
  recordingModalContent: {
    backgroundColor: '#1C1C1E',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '85%',
  },
  recordingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  recordingInstructions: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  recordingTimer: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  recordingIndicator: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#B91C1C',
    opacity: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingActive: {
    opacity: 1,
    shadowColor: '#B91C1C',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GratitudeBeadsScreen; 