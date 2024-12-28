import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  PermissionsAndroid,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { markExerciseAsCompleted } from '../services/exerciseService';
import { Affirmation } from '../services/affirmationService';
import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
} from 'react-native-audio-recorder-player';
import ExerciseIntroScreen from '../components/ExerciseIntroScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { 
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

const PassiveIncantationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [showIntro, setShowIntro] = useState(true);
  const [recordings, setRecordings] = useState<Affirmation[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showNewAffirmationModal, setShowNewAffirmationModal] = useState(false);
  const [newAffirmationText, setNewAffirmationText] = useState('');
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [recordingPath, setRecordingPath] = useState<string>('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [backgroundVolume, setBackgroundVolume] = useState(0);
  const [affirmationsVolume, setAffirmationsVolume] = useState(1);
  const [intervalBetweenAffirmations, setIntervalBetweenAffirmations] = useState(3);
  const [shuffleAffirmations, setShuffleAffirmations] = useState(false);
  
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer());

  useEffect(() => {
    loadAffirmations();
    return () => {
      audioRecorderPlayer.current.stopPlayer();
      audioRecorderPlayer.current.removePlayBackListener();
    };
  }, []);

  const loadAffirmations = async () => {
    try {
      const savedRecordings = await AsyncStorage.getItem('affirmations');
      if (savedRecordings) {
        setRecordings(JSON.parse(savedRecordings));
      }
    } catch (error) {
      console.error('Failed to load affirmations:', error);
      Alert.alert('Error', 'Failed to load affirmations. Please try again.');
      setRecordings([]);
    }
  };

  const saveNewOrder = async () => {
    try {
      await AsyncStorage.setItem('affirmations', JSON.stringify(recordings));
    } catch (error) {
      console.error('Failed to save new order:', error);
    }
  };

  const handleDeleteRecording = async (recordingId: string) => {
    try {
      const updatedRecordings = recordings.filter(rec => rec.id !== recordingId);
      setRecordings(updatedRecordings);
      await AsyncStorage.setItem('affirmations', JSON.stringify(updatedRecordings));
      
      const recording = recordings.find(rec => rec.id === recordingId);
      if (recording?.audioUrl) {
        try {
          await RNFS.unlink(recording.audioUrl);
        } catch (error) {
          console.error('Error deleting audio file:', error);
        }
      }
    } catch (error) {
      console.error('Failed to delete recording:', error);
      Alert.alert('Error', 'Failed to delete recording. Please try again.');
    }
  };

  const handlePlayRecording = async (recording: Affirmation) => {
    try {
      if (isPlaying && playingId === recording.id) {
        await audioRecorderPlayer.current.stopPlayer();
        setIsPlaying(false);
        setPlayingId(null);
      } else {
        if (isPlaying) {
          await audioRecorderPlayer.current.stopPlayer();
        }
        
        await audioRecorderPlayer.current.startPlayer(recording.audioUrl);
        await audioRecorderPlayer.current.setVolume(affirmationsVolume);
        
        audioRecorderPlayer.current.addPlayBackListener((e) => {
          if (e.currentPosition === e.duration) {
            audioRecorderPlayer.current.stopPlayer();
            setIsPlaying(false);
            setPlayingId(null);
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

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Record and Manage</Text>
      <View style={styles.headerButtons}>
        <TouchableOpacity onPress={() => setShowNewAffirmationModal(true)} style={styles.headerButton}>
          <MaterialCommunityIcons name="plus" size={24} color="#6366F1" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowAudioSettings(true)} style={styles.headerButton}>
          <MaterialCommunityIcons name="tune-vertical" size={24} color="#6366F1" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsEditMode(!isEditMode)}>
          <Text style={styles.editButton}>
            {isEditMode ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Affirmation>) => {
    const isBeingPlayed = playingId === item.id && isPlaying;

    return (
      <ScaleDecorator>
        <TouchableOpacity
          onPressIn={isEditMode ? drag : undefined}
          disabled={!isEditMode && isBeingPlayed}
          style={[
            styles.recordingItem,
            isEditMode && styles.recordingItemEdit,
            isBeingPlayed && !isEditMode && styles.recordingItemPlaying,
            isActive && styles.draggingItem,
          ]}
        >
          <View style={styles.recordingContent}>
            {isEditMode ? (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteRecording(item.id)}
              >
                <MaterialCommunityIcons name="minus-circle" size={24} color="#FF4444" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => handlePlayRecording(item)}
              >
                <MaterialCommunityIcons
                  name={isBeingPlayed ? "pause" : "play"}
                  size={24}
                  color="#FFF"
                />
              </TouchableOpacity>
            )}

            <View style={styles.recordingInfo}>
              <Text style={styles.recordingText}>{item.text || `Recording ${recordings.findIndex(r => r.id === item.id) + 1}`}</Text>
              <Text style={styles.recordingDuration}>
                {formatDuration(item.duration)}
              </Text>
            </View>

            {isEditMode && (
              <MaterialCommunityIcons
                name="menu"
                size={24}
                color="#6366F1"
                style={styles.dragHandle}
              />
            )}
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  const renderAudioSettingsModal = () => (
    <Modal
      visible={showAudioSettings}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Voice & Music Options</Text>
            <TouchableOpacity onPress={() => setShowAudioSettings(false)}>
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.settingsLabel}>Background Volume</Text>
          <Slider
            style={styles.slider}
            value={backgroundVolume}
            onValueChange={setBackgroundVolume}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#6366F1"
            maximumTrackTintColor="#2A3744"
            thumbTintColor="#6366F1"
          />

          <Text style={styles.settingsLabel}>Affirmations Volume</Text>
          <Slider
            style={styles.slider}
            value={affirmationsVolume}
            onValueChange={setAffirmationsVolume}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#6366F1"
            maximumTrackTintColor="#2A3744"
            thumbTintColor="#6366F1"
          />

          <Text style={styles.settingsLabel}>Delay Between Affirmations (seconds)</Text>
          <View style={styles.intervalContainer}>
            <Slider
              style={styles.slider}
              value={intervalBetweenAffirmations}
              onValueChange={setIntervalBetweenAffirmations}
              minimumValue={1}
              maximumValue={10}
              step={1}
              minimumTrackTintColor="#6366F1"
              maximumTrackTintColor="#2A3744"
              thumbTintColor="#6366F1"
            />
            <Text style={styles.intervalValue}>{intervalBetweenAffirmations}s</Text>
          </View>

          <View style={styles.shuffleContainer}>
            <Text style={styles.settingsLabel}>Shuffle Affirmations</Text>
            <Switch
              value={shuffleAffirmations}
              onValueChange={setShuffleAffirmations}
              trackColor={{ false: "#2A3744", true: "#6366F1" }}
              thumbColor={shuffleAffirmations ? "#FFFFFF" : "#F4F3F4"}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  const handleComplete = async () => {
    try {
      // Mark exercise as completed
      await markExerciseAsCompleted('passive-incantations');
      
      // Clean up audio player
      if (isPlaying) {
        await audioRecorderPlayer.current.stopPlayer();
      }
      audioRecorderPlayer.current.removePlayBackListener();
      
      navigation.goBack();
    } catch (error) {
      console.error('Failed to mark exercise as completed:', error);
      Alert.alert('Error', 'Failed to complete exercise. Please try again.');
    }
  };

  const handleListenAll = async () => {
    if (recordings.length === 0) return;
    
    let currentIndex = 0;
    const recordingsToPlay = shuffleAffirmations ? 
      [...recordings].sort(() => Math.random() - 0.5) : 
      [...recordings];

    const playNext = async () => {
      // Stop any currently playing audio
      if (isPlaying) {
        await audioRecorderPlayer.current.stopPlayer();
        audioRecorderPlayer.current.removePlayBackListener();
      }

      if (currentIndex >= recordingsToPlay.length) {
        setIsPlaying(false);
        setPlayingId(null);
        return;
      }

      const recording = recordingsToPlay[currentIndex];
      
      try {
        await audioRecorderPlayer.current.startPlayer(recording.audioUrl);
        await audioRecorderPlayer.current.setVolume(affirmationsVolume);
        
        setIsPlaying(true);
        setPlayingId(recording.id);
        
        audioRecorderPlayer.current.addPlayBackListener((e) => {
          if (e.currentPosition >= e.duration) {
            audioRecorderPlayer.current.stopPlayer();
            audioRecorderPlayer.current.removePlayBackListener();
            setIsPlaying(false);
            setPlayingId(null);
            currentIndex++;
            setTimeout(playNext, intervalBetweenAffirmations * 1000);
          }
        });
      } catch (error) {
        console.error('Error playing recording:', error);
        currentIndex++;
        setTimeout(playNext, 1000);
      }
    };
    
    playNext();
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        return Object.values(grants).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );
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

      const newAffirmation: Affirmation = {
        id: Date.now().toString(),
        text: newAffirmationText,
        audioUrl: uri,
        duration: recordingDuration,
        createdAt: new Date(),
      };

      // Update local state
      setRecordings(prev => [newAffirmation, ...prev]);
      
      // Save to AsyncStorage
      try {
        const existingRecordings = await AsyncStorage.getItem('affirmations');
        const currentRecordings = existingRecordings ? JSON.parse(existingRecordings) : [];
        currentRecordings.unshift(newAffirmation);
        await AsyncStorage.setItem('affirmations', JSON.stringify(currentRecordings));
      } catch (error) {
        console.error('Error saving to AsyncStorage:', error);
        Alert.alert('Error', 'Failed to save recording. Please try again.');
        return;
      }

      setShowRecordingModal(false);
      setNewAffirmationText('');
      setRecordingPath('');
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording. Please try again.');
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderAudioSettingsModal()}

        <View style={{ flex: 1 }}>
          <DraggableFlatList<Affirmation>
            data={recordings}
            onDragEnd={({ data }) => {
              'worklet';
              const newRecordings = [...data];
              runOnJS(setRecordings)(newRecordings);
              runOnJS(saveNewOrder)();
            }}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            dragItemOverflow={true}
            activationDistance={0}
          />
        </View>

        <View style={styles.buttonContainer}>
          {recordings.length > 0 && (
            <TouchableOpacity 
              style={styles.listenAllButton}
              onPress={handleListenAll}
            >
              <Text style={styles.listenAllButtonText}>Listen All</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.exitButton}
            onPress={handleComplete}
          >
            <Text style={styles.exitButtonText}>I'm done</Text>
          </TouchableOpacity>
        </View>

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
                  onPress={() => {
                    if (newAffirmationText.trim()) {
                      setShowNewAffirmationModal(false);
                      setShowRecordingModal(true);
                    }
                  }}
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
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3744',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editButton: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  recordingItem: {
    backgroundColor: '#2A3744',
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  recordingItemEdit: {
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#2A3744',
  },
  recordingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  deleteButton: {
    marginRight: 8,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  recordingDuration: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  dragHandle: {
    padding: 8,
  },
  listContent: {
    paddingVertical: 8,
  },
  draggingItem: {
    backgroundColor: '#1E1E1E',
    borderColor: '#6366F1',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  recordingItemPlaying: {
    borderColor: '#6366F1',
    borderWidth: 2,
    backgroundColor: '#1E1E1E',
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  doneButton: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  shuffleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
  },
  listenAllButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    width: '80%',
  },
  listenAllButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  exitButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    width: '80%',
  },
  exitButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
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
    backgroundColor: '#DC2626', // Red color when recording
  },
  intervalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  intervalValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PassiveIncantationsScreen; 