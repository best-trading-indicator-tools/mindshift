import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { markExerciseAsCompleted } from '../services/exerciseService';
import { saveAffirmation, getUserAffirmations, deleteAffirmation, Affirmation } from '../services/affirmationService';
import LinearGradient from 'react-native-linear-gradient';
import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
} from 'react-native-audio-recorder-player';
import ExerciseIntroScreen from '../components/ExerciseIntroScreen';

const PassiveIncantationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [showIntro, setShowIntro] = useState(true);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [recordings, setRecordings] = useState<Affirmation[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showNewAffirmationModal, setShowNewAffirmationModal] = useState(false);
  const [newAffirmationText, setNewAffirmationText] = useState('');
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [recordingPath, setRecordingPath] = useState<string>('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasListenedToAll, setHasListenedToAll] = useState(false);
  const [playbackCount, setPlaybackCount] = useState<{[key: string]: number}>({});
  const [isLooping, setIsLooping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer());

  useEffect(() => {
    loadAffirmations();
    return () => {
      // Cleanup audio player
      audioRecorderPlayer.current.stopPlayer();
      audioRecorderPlayer.current.removePlayBackListener();
    };
  }, []);

  const loadAffirmations = async () => {
    try {
      const userAffirmations = await getUserAffirmations();
      console.log('Loaded affirmations:', userAffirmations);
      setRecordings(userAffirmations || []);
    } catch (error) {
      console.error('Failed to load affirmations:', error);
      Alert.alert(
        'Error',
        'Failed to load affirmations. Please try again.',
        [{ text: 'OK' }]
      );
      setRecordings([]);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        const allGranted = Object.values(grants).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );

        return allGranted;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleStartRecording = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please grant microphone access to record affirmations.');
      return;
    }

    try {
      const path = Platform.select({
        ios: `affirmation_${Date.now()}.m4a`,
        android: `${Date.now()}.mp4`,
      });
      
      console.log('Starting recording with path:', path);

      const uri = await audioRecorderPlayer.current.startRecorder(path, {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: AVEncodingOption.aac,
      });

      console.log('Recording started, URI:', uri);

      audioRecorderPlayer.current.addRecordBackListener((e) => {
        setRecordingDuration(e.currentPosition);
      });

      setRecordingPath(uri);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const handleStopRecording = async () => {
    try {
      console.log('Stopping recording...');
      const uri = await audioRecorderPlayer.current.stopRecorder();
      console.log('Recording stopped, final URI:', uri);
      
      audioRecorderPlayer.current.removeRecordBackListener();
      setIsRecording(false);

      // Save to Firebase
      console.log('Attempting to save to Firebase with URI:', uri);
      console.log('Text:', newAffirmationText);
      console.log('Duration:', recordingDuration);
      
      const savedAffirmation = await saveAffirmation(
        newAffirmationText,
        uri,
        recordingDuration,
      );

      console.log('Affirmation saved successfully:', savedAffirmation);

      setRecordings(prev => [savedAffirmation, ...prev]);
      setShowRecordingModal(false);
      setNewAffirmationText('');
      setRecordingPath('');
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      Alert.alert('Error', 'Failed to save recording. Please try again.');
    }
  };

  const handlePlayRecording = async (recording: Affirmation, index?: number) => {
    try {
      if (isPlaying && playingId === recording.id) {
        await audioRecorderPlayer.current.stopPlayer();
        setIsPlaying(false);
        setPlayingId(null);
      } else {
        if (isPlaying) {
          await audioRecorderPlayer.current.stopPlayer();
        }
        
        if (typeof index === 'number') {
          setCurrentIndex(index);
        }
        
        await audioRecorderPlayer.current.startPlayer(recording.audioUrl);
        audioRecorderPlayer.current.addPlayBackListener((e) => {
          if (e.currentPosition === e.duration) {
            audioRecorderPlayer.current.stopPlayer();
            setIsPlaying(false);
            setPlayingId(null);
            
            // Update playback count for this recording
            setPlaybackCount(prev => ({
              ...prev,
              [recording.id]: (prev[recording.id] || 0) + 1
            }));

            // Check if all recordings have been played at least once
            const allPlayed = recordings.every(r => 
              (playbackCount[r.id] || 0) > 0 || r.id === recording.id
            );
            if (allPlayed) {
              setHasListenedToAll(true);
            }

            // If looping is enabled, play the next recording
            if (isLooping) {
              const nextIndex = (currentIndex + 1) % recordings.length;
              setCurrentIndex(nextIndex);
              handlePlayRecording(recordings[nextIndex], nextIndex);
            }
          }
        });
        
        setIsPlaying(true);
        setPlayingId(recording.id);
      }
    } catch (error) {
      console.error('Failed to play recording:', error);
      Alert.alert('Error', 'Failed to play recording. Please try again.');
    }
  };

  const toggleLoopMode = () => {
    setIsLooping(!isLooping);
  };

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAddNewAffirmation = () => {
    setShowNewAffirmationModal(true);
  };

  const handleSubmitAffirmation = () => {
    if (newAffirmationText.trim()) {
      setShowNewAffirmationModal(false);
      setShowRecordingModal(true);
    }
  };

  const handleComplete = async () => {
    if (!hasListenedToAll) {
      Alert.alert(
        'Listen to All Affirmations',
        'Please listen to all your recorded affirmations at least once to complete today\'s exercise.'
      );
      return;
    }

    try {
      await markExerciseAsCompleted('passive-incantations');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to mark exercise as completed:', error);
    }
  };

  const handleExit = () => {
    setShowExitConfirmation(true);
  };

  if (showIntro) {
    return (
      <ExerciseIntroScreen
        title="Passive Incantations"
        description={
          "Record your personal affirmations once, then listen to them daily.\n\n" +
          "Your recorded voice will help reprogram your subconscious mind while you're doing other activities.\n\n" +
          "Create a powerful playlist of affirmations in your own voice."
        }
        buttonText={recordings.length > 0 ? "Start Listening" : "Start Recording"}
        onStart={() => setShowIntro(false)}
        onExit={() => navigation.navigate('MainTabs')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons 
              name="chevron-left" 
              size={32} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          <Text style={styles.title}>My Affirmations</Text>
        </View>
        <View style={styles.headerButtons}>
          {recordings.length === 0 && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddNewAffirmation}
            >
              <MaterialCommunityIcons 
                name="plus" 
                size={24} 
                color="#6366F1" 
              />
            </TouchableOpacity>
          )}
          {recordings.length > 0 && (
            <TouchableOpacity 
              style={[styles.loopButton, isLooping && styles.loopButtonActive]}
              onPress={toggleLoopMode}
            >
              <MaterialCommunityIcons 
                name="repeat" 
                size={24} 
                color={isLooping ? "#6366F1" : "#666666"} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity 
            style={[
              styles.recordingItem,
              playbackCount[item.id] ? styles.recordingItemPlayed : null,
              playingId === item.id && styles.recordingItemPlaying
            ]}
            onPress={() => handlePlayRecording(item, index)}
          >
            <View style={styles.recordingInfo}>
              <Text style={styles.recordingText}>{item.text}</Text>
              <Text style={styles.recordingMeta}>
                {formatDuration(item.duration)}
              </Text>
            </View>
            <MaterialCommunityIcons 
              name={isPlaying && playingId === item.id ? "pause" : "play"} 
              size={24} 
              color="#6366F1" 
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No recordings yet. Start by recording your first affirmation!
            </Text>
          </View>
        }
      />
      
      {recordings.length > 0 && (
        <TouchableOpacity 
          style={[
            styles.completeButton,
            !hasListenedToAll && styles.completeButtonDisabled
          ]}
          onPress={handleComplete}
        >
          <Text style={styles.completeButtonText}>
            {hasListenedToAll ? 'Complete' : 'Listen to All'}
          </Text>
        </TouchableOpacity>
      )}

      {/* New Affirmation Modal */}
      <Modal
        visible={showNewAffirmationModal}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Affirmation</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Type your affirmation..."
              placeholderTextColor="#666"
              value={newAffirmationText}
              onChangeText={setNewAffirmationText}
              multiline
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowNewAffirmationModal(false);
                  setNewAffirmationText('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmitAffirmation}
              >
                <Text style={styles.submitButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Recording Modal */}
      <Modal
        visible={showRecordingModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Affirmation</Text>
            <Text style={styles.affirmationPreview}>{newAffirmationText}</Text>
            <TouchableOpacity 
              style={[
                styles.recordButton,
                isRecording && styles.recordingActive
              ]}
              onPress={isRecording ? handleStopRecording : handleStartRecording}
            >
              <MaterialCommunityIcons 
                name={isRecording ? "stop" : "microphone"} 
                size={32} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
            <Text style={styles.recordingInstructions}>
              {isRecording ? "Recording... Tap to stop" : "Tap to start recording"}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#151932',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  introContainer: {
    flex: 1,
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 60,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 32,
  },
  introText: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 40,
    width: '100%',
    paddingHorizontal: 32,
  },
  startButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 50,
    paddingVertical: 20,
    borderRadius: 40,
    marginTop: 40,
  },
  startButtonText: {
    color: '#6366F1',
    fontSize: 22,
    fontWeight: '600',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#151932',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#151932',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  recordingText: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 4,
  },
  recordingMeta: {
    fontSize: 14,
    color: '#666666',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666666',
    textAlign: 'center',
    fontSize: 16,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 20,
  },
  recordingActive: {
    backgroundColor: '#DC2626',
  },
  completeButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#6366F1',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#151932',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 15,
    color: '#FFFFFF',
    fontSize: 18,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#2A2A2A',
  },
  submitButton: {
    backgroundColor: '#6366F1',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  affirmationPreview: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  recordingInstructions: {
    color: '#666666',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  exitButton: {
    backgroundColor: '#FFD700',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
  },
  exitButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitModalContent: {
    backgroundColor: '#151932',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  exitModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  exitModalText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  continueButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    marginBottom: 12,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  quitButton: {
    paddingVertical: 16,
    width: '100%',
  },
  quitButtonText: {
    color: '#FF4B4B',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  recordingItemPlayed: {
    opacity: 0.7,
    borderColor: '#6366F1',
    borderWidth: 1,
  },
  completeButtonDisabled: {
    backgroundColor: '#666666',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#151932',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loopButtonActive: {
    backgroundColor: '#1E1E1E',
    borderColor: '#6366F1',
    borderWidth: 1,
  },
  recordingItemPlaying: {
    borderColor: '#6366F1',
    borderWidth: 2,
    backgroundColor: '#1E1E1E',
  },
});

export default PassiveIncantationsScreen; 