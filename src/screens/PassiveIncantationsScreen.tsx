import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ScrollView,
  GestureResponderEvent,
} from 'react-native';
import Slider from '@react-native-community/slider';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { markExerciseAsCompleted } from '../services/exerciseService';
import { Affirmation, loadTags, saveTags, STORAGE_KEYS } from '../services/affirmationService';
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
  const [loopingId, setLoopingId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('All Affirmations');
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [selectedTagForRecording, setSelectedTagForRecording] = useState<string>('');
  const [showRecordingTagInput, setShowRecordingTagInput] = useState(false);

  const audioRecorderPlayer = useRef(new AudioRecorderPlayer());

  useEffect(() => {
    loadAffirmations();
    loadSavedTags();
    const player = audioRecorderPlayer.current;
    return () => {
      player.stopPlayer().catch(() => {});
      player.removePlayBackListener();
    };
  }, []);

  const loadAffirmations = async () => {
    try {
      const savedRecordings = await AsyncStorage.getItem(STORAGE_KEYS.AFFIRMATIONS);
      if (savedRecordings) {
        const parsedRecordings = JSON.parse(savedRecordings);
        setRecordings(parsedRecordings);
      }
    } catch (error) {
      console.error('Failed to load affirmations:', error);
      Alert.alert('Error', 'Failed to load affirmations. Please try again.');
      setRecordings([]);
    }
  };

  const loadSavedTags = async () => {
    const savedTags = await loadTags();
    setTags(savedTags);
  };

  const handleAddTag = async (fromRecordingModal: boolean = false) => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      await saveTags(updatedTags);
      if (fromRecordingModal) {
        setSelectedTagForRecording(newTag.trim());
        setShowRecordingTagInput(false);
      } else {
        setShowTagInput(false);
      }
      setNewTag('');
    }
  };

  const handleAddTagPress = (_: GestureResponderEvent) => {
    handleAddTag(false);
  };

  const handleAddTagRecordingPress = (_: GestureResponderEvent) => {
    handleAddTag(true);
  };

  const filteredRecordings = useMemo(() => {
    if (selectedTag === 'All Affirmations') return recordings;
    return recordings.filter(recording => recording.tag === selectedTag);
  }, [recordings, selectedTag]);

  const saveNewOrder = async (recordingsToSave: Affirmation[]) => {
    try {
      await AsyncStorage.setItem('affirmations', JSON.stringify(recordingsToSave));
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
        audioRecorderPlayer.current.removePlayBackListener();
        setIsPlaying(false);
        setPlayingId(null);
      } else {
        if (isPlaying) {
          await audioRecorderPlayer.current.stopPlayer();
          audioRecorderPlayer.current.removePlayBackListener();
        }
        
        const startPlayback = async () => {
          await audioRecorderPlayer.current.startPlayer(recording.audioUrl);
          await audioRecorderPlayer.current.setVolume(affirmationsVolume);
          setIsPlaying(true);
          setPlayingId(recording.id);
        };

        await startPlayback();
        
        audioRecorderPlayer.current.addPlayBackListener((e) => {
          if (e.currentPosition >= e.duration) {
            if (loopingId === recording.id) {
              audioRecorderPlayer.current.stopPlayer();
              audioRecorderPlayer.current.removePlayBackListener();
              // Add delay before starting next loop
              setTimeout(async () => {
                if (loopingId === recording.id) { // Check if still in loop mode
                  await startPlayback();
                  audioRecorderPlayer.current.addPlayBackListener((e) => {
                    if (e.currentPosition >= e.duration) {
                      if (loopingId === recording.id) {
                        audioRecorderPlayer.current.stopPlayer();
                        audioRecorderPlayer.current.removePlayBackListener();
                        setTimeout(startPlayback, intervalBetweenAffirmations * 1000);
                      } else {
                        audioRecorderPlayer.current.stopPlayer();
                        audioRecorderPlayer.current.removePlayBackListener();
                        setIsPlaying(false);
                        setPlayingId(null);
                      }
                    }
                  });
                } else {
                  setIsPlaying(false);
                  setPlayingId(null);
                }
              }, intervalBetweenAffirmations * 1000);
            } else {
              audioRecorderPlayer.current.stopPlayer();
              audioRecorderPlayer.current.removePlayBackListener();
              setIsPlaying(false);
              setPlayingId(null);
            }
          }
        });
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
    const isLooping = loopingId === item.id;

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

            {!isEditMode && (
              <TouchableOpacity
                style={[styles.loopButton, isLooping && styles.loopButtonActive]}
                onPress={() => setLoopingId(isLooping ? null : item.id)}
              >
                <MaterialCommunityIcons
                  name="repeat"
                  size={24}
                  color={isLooping ? "#FFFFFF" : "#9CA3AF"}
                />
              </TouchableOpacity>
            )}

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
      await markExerciseAsCompleted('passive-incantations', 'Passive Incantations');
      
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
    if (filteredRecordings.length === 0) return;
    
    let currentIndex = 0;
    const recordingsToPlay = shuffleAffirmations ? 
      [...filteredRecordings].sort(() => Math.random() - 0.5) : 
      [...filteredRecordings];

    const playNext = async () => {
      // Reset UI state from previous playback
      setIsPlaying(false);
      setPlayingId(null);

      // Stop any currently playing audio
      try {
        await audioRecorderPlayer.current.stopPlayer();
      } catch (error) {
        // No active player to stop
      }
      
      audioRecorderPlayer.current.removePlayBackListener();

      if (currentIndex >= recordingsToPlay.length) {
        // Ensure UI is reset after the last recording
        setIsPlaying(false);
        setPlayingId(null);
        return;
      }

      const recording = recordingsToPlay[currentIndex];
      
      try {
        await audioRecorderPlayer.current.startPlayer(recording.audioUrl);
        await audioRecorderPlayer.current.setVolume(affirmationsVolume);
        
        // Update UI to show current playing state
        setIsPlaying(true);
        setPlayingId(recording.id);
        
        audioRecorderPlayer.current.addPlayBackListener((e) => {
          if (e.currentPosition >= e.duration) {
            audioRecorderPlayer.current.stopPlayer();
            audioRecorderPlayer.current.removePlayBackListener();
            
            // Reset UI state for current recording
            setIsPlaying(false);
            setPlayingId(null);
            
            // Schedule next recording
            const delay = intervalBetweenAffirmations * 1000;
            currentIndex++;
            setTimeout(playNext, delay);
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

      const uri = await audioRecorderPlayer.current.startRecorder(path, {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: AVEncodingOption.aac,
      });

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
      const uri = await audioRecorderPlayer.current.stopRecorder();
      
      audioRecorderPlayer.current.removeRecordBackListener();
      setIsRecording(false);

      const newAffirmation: Affirmation = {
        id: Date.now().toString(),
        text: newAffirmationText,
        audioUrl: uri,
        duration: recordingDuration,
        createdAt: new Date(),
        tag: selectedTagForRecording
      };

      // Update local state
      setRecordings(prev => [newAffirmation, ...prev]);
      
      // Save to AsyncStorage
      try {
        const existingRecordings = await AsyncStorage.getItem(STORAGE_KEYS.AFFIRMATIONS);
        const currentRecordings = existingRecordings ? JSON.parse(existingRecordings) : [];
        currentRecordings.unshift(newAffirmation);
        await AsyncStorage.setItem(STORAGE_KEYS.AFFIRMATIONS, JSON.stringify(currentRecordings));
      } catch (error) {
        console.error('Error saving to AsyncStorage:', error);
        Alert.alert('Error', 'Failed to save recording. Please try again.');
        return;
      }

      setShowRecordingModal(false);
      setNewAffirmationText('');
      setRecordingPath('');
      setRecordingDuration(0);
      setSelectedTagForRecording('');
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording. Please try again.');
    }
  };

  const renderTagList = () => (
    <View style={styles.tagContainer}>
      <View style={styles.tagListWrapper}>
        <Text style={styles.filterLabel}>Filter</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.tagButton,
              selectedTag === 'All Affirmations' && styles.tagButtonActive
            ]}
            onPress={() => setSelectedTag('All Affirmations')}
          >
            <Text style={[
              styles.tagText,
              selectedTag === 'All Affirmations' && styles.tagTextActive
            ]}>All Affirmations</Text>
          </TouchableOpacity>
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagButton,
                selectedTag === tag && styles.tagButtonActive
              ]}
              onPress={() => setSelectedTag(tag)}
            >
              <Text style={[
                styles.tagText,
                selectedTag === tag && styles.tagTextActive
              ]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {showTagInput && (
        <View style={styles.tagInputContainer}>
          <TextInput
            style={styles.tagInput}
            value={newTag}
            onChangeText={setNewTag}
            placeholder="New tag..."
            placeholderTextColor="#666"
            autoFocus
          />
          <TouchableOpacity 
            style={styles.tagInputButton}
            onPress={handleAddTagPress}
          >
            <Text style={styles.tagInputButtonText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.tagInputButton}
            onPress={() => {
              setNewTag('');
              setShowTagInput(false);
            }}
          >
            <Text style={styles.tagInputButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderRecordingModal = () => (
    <Modal
      visible={showRecordingModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Record Affirmation</Text>
          <Text style={styles.affirmationPreview}>{newAffirmationText}</Text>
          
          <View style={styles.tagSelectionContainer}>
            <Text style={styles.tagSelectionTitle}>Select or Create Tag</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagScrollContent}
            >
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagButton,
                    selectedTagForRecording === tag && styles.tagButtonActive
                  ]}
                  onPress={() => setSelectedTagForRecording(tag)}
                >
                  <Text style={[
                    styles.tagText,
                    selectedTagForRecording === tag && styles.tagTextActive
                  ]}>{tag}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={() => setShowRecordingTagInput(true)}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#FFD700" />
              </TouchableOpacity>
            </ScrollView>

            {showRecordingTagInput && (
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholder="New tag..."
                  placeholderTextColor="#666"
                  autoFocus
                />
                <TouchableOpacity 
                  style={styles.tagInputButton}
                  onPress={handleAddTagRecordingPress}
                >
                  <Text style={styles.tagInputButtonText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.tagInputButton}
                  onPress={() => {
                    setNewTag('');
                    setShowRecordingTagInput(false);
                  }}
                >
                  <Text style={styles.tagInputButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

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
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderTagList()}
        {renderAudioSettingsModal()}
        {renderRecordingModal()}

        <View style={{ flex: 1 }}>
          <DraggableFlatList<Affirmation>
            data={filteredRecordings}
            onDragEnd={({ data }) => {
              setRecordings(data);
              saveNewOrder(data);
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
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A3744',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  loopButtonActive: {
    backgroundColor: '#6366F1',
  },
  tagContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3744',
  },
  tagListWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  filterLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  tagScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2A3744',
    marginRight: 8,
  },
  tagButtonActive: {
    backgroundColor: '#FFD700',
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  tagTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  addTagButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A3744',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#2A3744',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 14,
  },
  tagInputButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#6366F1',
  },
  tagInputButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tagSelectionContainer: {
    marginVertical: 20,
  },
  tagSelectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
});

export default PassiveIncantationsScreen; 