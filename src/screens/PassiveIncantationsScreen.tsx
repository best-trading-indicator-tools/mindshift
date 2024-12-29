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
  Image,
  TouchableWithoutFeedback,
  PanResponder,
  Animated,
  Dimensions,
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
  const [selectedTagForRecording, setSelectedTagForRecording] = useState<string[]>([]);
  const [showRecordingTagInput, setShowRecordingTagInput] = useState(false);
  const [rerecordingId, setRerecordingId] = useState<string | null>(null);
  const [showPlaybackScreen, setShowPlaybackScreen] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Affirmation | null>(null);
  const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState(0);
  const [nextBackgroundIndex, setNextBackgroundIndex] = useState(1);
  const backgroundPosition = useRef(new Animated.Value(0)).current;
  const [showPlaybackTagModal, setShowPlaybackTagModal] = useState(false);
  const [previousIndex, setPreviousIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [presentationMode, setPresentationMode] = useState(false);
  const backgroundRotationInterval = useRef<NodeJS.Timeout | null>(null);
  const [progressAnimation] = useState(new Animated.Value(0));
  const [currentRecordingText, setCurrentRecordingText] = useState<string>('');

  const backgroundImages = [
    require('../assets/illustrations/zen1.jpg'),
    require('../assets/illustrations/zen2.jpg'),
    require('../assets/illustrations/zen3.jpg'),
  ];

  const audioRecorderPlayer = useRef(new AudioRecorderPlayer());

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        backgroundPosition.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const screenWidth = Dimensions.get('window').width;
        const threshold = screenWidth / 3;
        
        if (Math.abs(gestureState.dx) > threshold) {
          // Complete the transition
          const direction = gestureState.dx > 0 ? 1 : -1;
          
          // First complete the animation
          Animated.spring(backgroundPosition, {
            toValue: direction * screenWidth,
            useNativeDriver: true,
            velocity: gestureState.vx,
            tension: 30,
            friction: 7,
          }).start(() => {
            // After animation completes, update indices and reset position
            if (direction > 0) {
              // Swipe right
              setCurrentBackgroundIndex(prev => 
                prev === 0 ? backgroundImages.length - 1 : prev - 1
              );
            } else {
              // Swipe left
              setCurrentBackgroundIndex(prev => 
                prev === backgroundImages.length - 1 ? 0 : prev + 1
              );
            }
            // Reset position immediately after updating indices
            backgroundPosition.setValue(0);
          });
        } else {
          // Reset position if swipe wasn't far enough
          Animated.spring(backgroundPosition, {
            toValue: 0,
            useNativeDriver: true,
            tension: 30,
            friction: 7,
          }).start();
        }
      },
    })
  ).current;

  // Calculate next background index
  useEffect(() => {
    setNextBackgroundIndex(
      currentBackgroundIndex === backgroundImages.length - 1 
        ? 0 
        : currentBackgroundIndex + 1
    );
  }, [currentBackgroundIndex]);

  useEffect(() => {
    loadAffirmations();
    loadSavedTags();
    const player = audioRecorderPlayer.current;
    return () => {
      player.stopPlayer().catch(() => {});
      player.removePlayBackListener();
    };
  }, []);

  useEffect(() => {
    if (presentationMode && showPlaybackScreen) {
      // Start rotating backgrounds every 5 seconds
      backgroundRotationInterval.current = setInterval(() => {
        // Start fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setPreviousIndex(currentBackgroundIndex);
          setCurrentBackgroundIndex(prev => 
            prev === backgroundImages.length - 1 ? 0 : prev + 1
          );
          // Start fade in
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }).start();
        });
      }, 5000);
    } else {
      // Clear interval when presentation mode is disabled
      if (backgroundRotationInterval.current) {
        clearInterval(backgroundRotationInterval.current);
      }
    }

    // Cleanup
    return () => {
      if (backgroundRotationInterval.current) {
        clearInterval(backgroundRotationInterval.current);
      }
    };
  }, [presentationMode, showPlaybackScreen]);

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
        setSelectedTagForRecording(prev => [...prev, newTag.trim()]);
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
    return recordings.filter(recording => recording.tags?.includes(selectedTag));
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
    setSelectedRecording(recording);
    setShowPlaybackScreen(true);
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
        <TouchableOpacity 
          onPress={() => setShowAudioSettings(true)} 
          style={styles.headerButton}
        >
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

  const handleStartRerecording = (recording: Affirmation) => {
    setNewAffirmationText(recording.text);
    setSelectedTagForRecording(recording.tags || []);
    setShowRecordingModal(true);
    // Store the ID of the recording to be replaced
    setRerecordingId(recording.id);
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Affirmation>) => {
    const isBeingPlayed = playingId === item.id && isPlaying;
    const isLooping = loopingId === item.id;

    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={!isEditMode}
          delayLongPress={200}
          style={[
            styles.recordingItem,
            isEditMode && styles.recordingItemEdit,
            isBeingPlayed && !isEditMode && styles.recordingItemPlaying,
            isActive && styles.draggingItem,
          ]}
        >
          <View style={styles.recordingContent}>
            {isEditMode ? (
              <View style={styles.editButtons}>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteRecording(item.id)}
                >
                  <MaterialCommunityIcons name="minus-circle" size={24} color="#FF4444" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.rerecordButton}
                  onPress={() => handleStartRerecording(item)}
                >
                  <MaterialCommunityIcons name="microphone" size={24} color="#FFD700" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.playButton}
                onPress={() => handlePlaybackControl(item)}
              >
                <MaterialCommunityIcons
                  name={isBeingPlayed ? "pause" : "play"}
                  size={24}
                  color="#FFF"
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.recordingInfo}
              onPress={() => !isEditMode && handlePlayRecording(item)}
              disabled={isEditMode || isActive}
            >
              <Text style={styles.recordingText}>{item.text || `Recording ${recordings.findIndex(r => r.id === item.id) + 1}`}</Text>
              <View style={styles.recordingTagsContainer}>
                {item.tags?.map((tag, index) => (
                  <Text key={index} style={styles.recordingTag}>
                    {tag}{index < (item.tags?.length || 0) - 1 ? ', ' : ''}
                  </Text>
                ))}
              </View>
              <Text style={styles.recordingDuration}>
                {formatDuration(item.duration)}
              </Text>
            </TouchableOpacity>

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

  const renderSettingsModal = (isPlaybackScreen: boolean) => (
    <Modal
      visible={showAudioSettings}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAudioSettings(false)}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, styles.settingsModalContent]}>
          <View style={styles.settingsModalHeader}>
            <Text style={styles.settingsModalTitle}>Voice & Music Options</Text>
            <Text style={styles.settingsModalSubtitle}>For playlist: {selectedTag}</Text>
            <TouchableOpacity 
              style={styles.settingsModalClose}
              onPress={() => setShowAudioSettings(false)}
            >
              <Text style={styles.settingsModalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsModalBody}>
            <View style={styles.settingsItem}>
              <MaterialCommunityIcons name="volume-high" size={24} color="#666" />
              <View style={styles.settingsSliderContainer}>
                <Text style={styles.settingsItemLabel}>Background Volume</Text>
                <Slider
                  style={styles.settingsSlider}
                  value={backgroundVolume}
                  onValueChange={setBackgroundVolume}
                  minimumValue={0}
                  maximumValue={1}
                  minimumTrackTintColor="#6366F1"
                  maximumTrackTintColor="#E5E7EB"
                  thumbTintColor="#6366F1"
                />
              </View>
            </View>

            <View style={styles.settingsItem}>
              <MaterialCommunityIcons name="account-voice" size={24} color="#666" />
              <View style={styles.settingsSliderContainer}>
                <Text style={styles.settingsItemLabel}>Affirmations Volume</Text>
                <Slider
                  style={styles.settingsSlider}
                  value={affirmationsVolume}
                  onValueChange={setAffirmationsVolume}
                  minimumValue={0}
                  maximumValue={1}
                  minimumTrackTintColor="#6366F1"
                  maximumTrackTintColor="#E5E7EB"
                  thumbTintColor="#6366F1"
                />
              </View>
            </View>

            <View style={styles.settingsItem}>
              <MaterialCommunityIcons name="timer-outline" size={24} color="#666" />
              <View style={styles.settingsSliderContainer}>
                <Text style={styles.settingsItemLabel}>Interval Between Affirmations</Text>
                <View style={styles.intervalSliderContainer}>
                  <Slider
                    style={styles.settingsSlider}
                    value={intervalBetweenAffirmations}
                    onValueChange={setIntervalBetweenAffirmations}
                    minimumValue={1}
                    maximumValue={10}
                    step={1}
                    minimumTrackTintColor="#6366F1"
                    maximumTrackTintColor="#E5E7EB"
                    thumbTintColor="#6366F1"
                  />
                  <Text style={styles.intervalValue}>{intervalBetweenAffirmations} sec</Text>
                </View>
              </View>
            </View>

            <View style={styles.settingsItem}>
              <MaterialCommunityIcons name="shuffle-variant" size={24} color="#666" />
              <View style={styles.settingsToggleContainer}>
                <Text style={styles.settingsItemLabel}>Shuffle Affirmations</Text>
                <Switch
                  value={shuffleAffirmations}
                  onValueChange={setShuffleAffirmations}
                  trackColor={{ false: "#E5E7EB", true: "#6366F1" }}
                  thumbColor={shuffleAffirmations ? "#FFFFFF" : "#F4F3F4"}
                />
              </View>
            </View>

            {isPlaybackScreen && (
              <View style={styles.settingsItem}>
                <MaterialCommunityIcons name="presentation" size={24} color="#666" />
                <View style={styles.settingsToggleContainer}>
                  <Text style={styles.settingsItemLabel}>Presentation Mode</Text>
                  <Switch
                    value={presentationMode}
                    onValueChange={setPresentationMode}
                    trackColor={{ false: "#E5E7EB", true: "#6366F1" }}
                    thumbColor={presentationMode ? "#FFFFFF" : "#F4F3F4"}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  // Update the main screen settings modal
  const renderAudioSettingsModal = () => renderSettingsModal(false);

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
    if (filteredRecordings.length === 0) {
      return;
    }

    const recordingsToPlay = shuffleAffirmations ? 
      [...filteredRecordings].sort(() => Math.random() - 0.5) : 
      [...filteredRecordings];

    for (const recording of recordingsToPlay) {
      try {
        // Verify file exists
        try {
          const fileExists = await RNFS.exists(recording.audioUrl);
          if (!fileExists) {
            continue;
          }

          const fileStats = await RNFS.stat(recording.audioUrl);
          if (fileStats.size === 0) {
            continue;
          }
        } catch (error) {
          continue;
        }
        
        // Stop any current playback
        if (isPlaying) {
          try {
            await audioRecorderPlayer.current.stopPlayer();
          } catch (error) {
            console.error('Error stopping player:', error);
          }
          audioRecorderPlayer.current.removePlayBackListener();
        }

        // Play this recording
        try {
          await audioRecorderPlayer.current.startPlayer(recording.audioUrl);
          await audioRecorderPlayer.current.setVolume(affirmationsVolume);
        } catch (error) {
          console.error('Error starting player:', error);
          continue;
        }

        setIsPlaying(true);
        setPlayingId(recording.id);
        setCurrentRecordingText(recording.text || `Recording ${recordings.findIndex(r => r.id === recording.id) + 1}`);

        // Wait for this recording to finish
        await new Promise<void>((resolve, reject) => {
          let hasResolved = false;
          
          const handlePlaybackComplete = (e: any) => {
            if (hasResolved) return;
            
            const progress = e.currentPosition / e.duration;
            progressAnimation.setValue(progress);

            if (e.currentPosition >= e.duration - 50 || progress >= 0.99) {
              hasResolved = true;
              
              try {
                audioRecorderPlayer.current.stopPlayer().catch(console.error);
                audioRecorderPlayer.current.removePlayBackListener();
                setIsPlaying(false);
                setPlayingId(null);
                setCurrentRecordingText('');
                progressAnimation.setValue(0);
                resolve();
              } catch (error) {
                console.error('Error in cleanup:', error);
                reject(error);
              }
            }
          };

          audioRecorderPlayer.current.addPlayBackListener(handlePlaybackComplete);

          // Add timeout to prevent hanging
          setTimeout(() => {
            if (!hasResolved) {
              hasResolved = true;
              audioRecorderPlayer.current.stopPlayer().catch(console.error);
              audioRecorderPlayer.current.removePlayBackListener();
              setIsPlaying(false);
              setPlayingId(null);
              setCurrentRecordingText('');
              progressAnimation.setValue(0);
              resolve();
            }
          }, 30000); // 30 second timeout
        });

        // Wait for interval before next recording (unless it's the last one)
        if (recording !== recordingsToPlay[recordingsToPlay.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, intervalBetweenAffirmations * 1000));
        }
      } catch (error) {
        console.error('Error in playback loop:', error);
        // Continue to next recording even if this one failed
      }
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
        id: rerecordingId || Date.now().toString(),
        text: newAffirmationText,
        audioUrl: uri,
        duration: recordingDuration,
        createdAt: new Date(),
        tags: selectedTagForRecording
      };

      // Update local state
      setRecordings(prev => {
        if (rerecordingId) {
          // Replace the old recording
          const oldRecording = prev.find(r => r.id === rerecordingId);
          if (oldRecording?.audioUrl) {
            // Delete the old audio file
            RNFS.unlink(oldRecording.audioUrl).catch(error => 
              console.error('Error deleting old audio file:', error)
            );
          }
          return prev.map(r => r.id === rerecordingId ? newAffirmation : r);
        }
        // Add new recording
        return [newAffirmation, ...prev];
      });
      
      // Save to AsyncStorage
      try {
        const existingRecordings = await AsyncStorage.getItem(STORAGE_KEYS.AFFIRMATIONS);
        let currentRecordings = existingRecordings ? JSON.parse(existingRecordings) : [];
        
        if (rerecordingId) {
          // Replace the old recording
          currentRecordings = currentRecordings.map((r: Affirmation) => 
            r.id === rerecordingId ? newAffirmation : r
          );
        } else {
          // Add new recording
          currentRecordings.unshift(newAffirmation);
        }
        
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
      setSelectedTagForRecording([]);
      setRerecordingId(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording. Please try again.');
    }
  };

  const handleTagSelection = (tag: string) => {
    setSelectedTagForRecording(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
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
      onRequestClose={() => setShowRecordingModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowRecordingModal(false)}>
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Record Affirmation</Text>
              <Text style={styles.affirmationPreview}>{newAffirmationText}</Text>
              
              <View style={styles.tagSelectionContainer}>
                <Text style={styles.tagSelectionTitle}>Select Tags</Text>
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
                        selectedTagForRecording.includes(tag) && styles.tagButtonActive
                      ]}
                      onPress={() => handleTagSelection(tag)}
                    >
                      <Text style={[
                        styles.tagText,
                        selectedTagForRecording.includes(tag) && styles.tagTextActive
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
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const handlePlaybackTagSelect = (tag: string) => {
    setSelectedTag(tag);
    setShowPlaybackTagModal(false);
  };

  const renderBackgroundImages = () => {
    const screenWidth = Dimensions.get('window').width;
    
    return (
      <View style={styles.playbackBackground}>
        {/* Current Image */}
        <Animated.View
          style={[
            styles.backgroundImageContainer,
            {
              transform: [{
                translateX: backgroundPosition,
              }],
            },
          ]}
        >
          <Image
            source={backgroundImages[currentBackgroundIndex]}
            style={styles.backgroundImage}
          />
        </Animated.View>

        {/* Next Image */}
        <Animated.View
          style={[
            styles.backgroundImageContainer,
            {
              transform: [{
                translateX: backgroundPosition.interpolate({
                  inputRange: [-screenWidth, 0, screenWidth],
                  outputRange: [0, screenWidth, screenWidth * 2],
                }),
              }],
            },
          ]}
        >
          <Image
            source={backgroundImages[nextBackgroundIndex]}
            style={styles.backgroundImage}
          />
        </Animated.View>

        {/* Previous Image */}
        <Animated.View
          style={[
            styles.backgroundImageContainer,
            {
              transform: [{
                translateX: backgroundPosition.interpolate({
                  inputRange: [-screenWidth, 0, screenWidth],
                  outputRange: [-screenWidth * 2, -screenWidth, 0],
                }),
              }],
            },
          ]}
        >
          <Image
            source={backgroundImages[currentBackgroundIndex === 0 ? backgroundImages.length - 1 : currentBackgroundIndex - 1]}
            style={styles.backgroundImage}
          />
        </Animated.View>
      </View>
    );
  };

  const renderPlaybackScreen = () => (
    <>
      <Modal
        visible={showPlaybackScreen}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.playbackScreenContainer}>
          <View 
            {...panResponder.panHandlers}
            style={StyleSheet.absoluteFill}
          >
            {renderBackgroundImages()}
          </View>

          <View style={styles.playbackOverlay}>
            {/* Top Tag - Now Tappable */}
            <TouchableOpacity 
              style={styles.playbackTagContainer}
              onPress={() => setShowPlaybackTagModal(true)}
            >
              <Text style={styles.playbackTagLabel}>FILTER</Text>
              <View style={styles.playbackTag}>
                <View style={styles.playbackTagContent}>
                  <Text style={styles.playbackTagText}>
                    {selectedTag}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>

            {/* Recording Text Display */}
            {currentRecordingText ? (
              <View style={styles.recordingTextContainer}>
                <Text style={styles.recordingTextDisplay}>{currentRecordingText}</Text>
              </View>
            ) : null}

            {/* Play Button and Progress */}
            <View style={styles.playbackPlayButtonContainer}>
              <View style={styles.circlePattern}>
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />
                <View style={[styles.circle, styles.circleOuter1]} />
                <View style={[styles.circle, styles.circleOuter2]} />
                <TickMarks />
                <View style={[styles.circle, styles.circle3]} />
              </View>
              <TouchableOpacity 
                style={styles.playbackPlayButton}
                onPress={() => {
                  if (selectedRecording) {
                    handlePlaybackControl(selectedRecording);
                  }
                }}
              >
                <MaterialCommunityIcons
                  name={isPlaying ? "pause" : "play"}
                  size={48}
                  color="#4F46E5"
                />
              </TouchableOpacity>
            </View>

            {/* Bottom Toolbar */}
            <View style={styles.playbackToolbar}>
              <TouchableOpacity style={styles.playbackToolbarButton}>
                <MaterialCommunityIcons name="timer" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.playbackToolbarButton}>
                <MaterialCommunityIcons name="music-note" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.playbackToolbarButton}
                onPress={() => setShowAudioSettings(true)}
              >
                <MaterialCommunityIcons name="tune-vertical" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Voice & Music Settings Modal */}
            {showAudioSettings && renderSettingsModal(true)}

            {/* Close Button */}
            <TouchableOpacity 
              style={styles.playbackCloseButton}
              onPress={() => {
                if (isPlaying) {
                  audioRecorderPlayer.current.stopPlayer();
                  setIsPlaying(false);
                  setPlayingId(null);
                }
                setShowPlaybackScreen(false);
                setSelectedRecording(null);
                setShowPlaybackTagModal(false);
                setShowAudioSettings(false);
                // Stop presentation mode when closing
                setPresentationMode(false);
                if (backgroundRotationInterval.current) {
                  clearInterval(backgroundRotationInterval.current);
                }
              }}
            >
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Tag Selection Modal */}
            <Modal
              visible={showPlaybackTagModal}
              transparent={true}
              animationType="fade"
            >
              <TouchableWithoutFeedback onPress={() => setShowPlaybackTagModal(false)}>
                <View style={styles.tagModalOverlay}>
                  <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                    <View style={styles.tagModalContent}>
                      <TouchableOpacity
                        style={[
                          styles.tagModalButton,
                          selectedTag === 'All Affirmations' && styles.tagModalButtonActive
                        ]}
                        onPress={() => handlePlaybackTagSelect('All Affirmations')}
                      >
                        <Text style={[
                          styles.tagModalButtonText,
                          selectedTag === 'All Affirmations' && styles.tagModalButtonTextActive
                        ]}>All Affirmations</Text>
                      </TouchableOpacity>
                      {tags.map((tag) => (
                        <TouchableOpacity
                          key={tag}
                          style={[
                            styles.tagModalButton,
                            selectedTag === tag && styles.tagModalButtonActive
                          ]}
                          onPress={() => handlePlaybackTagSelect(tag)}
                        >
                          <Text style={[
                            styles.tagModalButtonText,
                            selectedTag === tag && styles.tagModalButtonTextActive
                          ]}>{tag}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </View>
        </View>
      </Modal>
    </>
  );

  const handlePlaybackControl = async (recording: Affirmation) => {
    try {
      if (isPlaying) {
        await audioRecorderPlayer.current.stopPlayer();
        audioRecorderPlayer.current.removePlayBackListener();
        setIsPlaying(false);
        setPlayingId(null);
        setCurrentRecordingText('');
        progressAnimation.setValue(0);
      } else {
        // If in playback screen, play all recordings
        if (showPlaybackScreen) {
          handleListenAll();
        } else {
          // Single recording playback
          await audioRecorderPlayer.current.startPlayer(recording.audioUrl);
          await audioRecorderPlayer.current.setVolume(affirmationsVolume);
          setIsPlaying(true);
          setPlayingId(recording.id);
          setCurrentRecordingText(recording.text || `Recording ${recordings.findIndex(r => r.id === recording.id) + 1}`);
          
          audioRecorderPlayer.current.addPlayBackListener((e) => {
            const progress = e.currentPosition / e.duration;
            progressAnimation.setValue(progress);
            
            if (e.currentPosition >= e.duration) {
              audioRecorderPlayer.current.stopPlayer();
              audioRecorderPlayer.current.removePlayBackListener();
              setIsPlaying(false);
              setPlayingId(null);
              setCurrentRecordingText('');
              progressAnimation.setValue(0);
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to play recording:', error);
      Alert.alert('Error', 'Failed to play recording. Please try again.');
    }
  };

  const TickMarks = () => {
    const marks = Array.from({ length: 60 }, (_, i) => i);
    const progressRotation = progressAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
    });
    
    return (
      <View style={styles.tickContainer}>
        {marks.map((i) => (
          <View
            key={i}
            style={[
              styles.tick,
              {
                transform: [
                  { rotate: `${i * 6}deg` },
                  { translateY: -100 },
                ],
              },
            ]}
          />
        ))}
        <Animated.View
          style={[
            styles.progressArc,
            {
              transform: [{ rotate: progressRotation }]
            }
          ]}
        />
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderTagList()}
        {renderRecordingModal()}
        {renderPlaybackScreen()}
        {renderAudioSettingsModal()}

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
            activationDistance={5}
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
    backgroundColor: '#DC2626',
  },
  intervalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  intervalValue: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
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
  editButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  rerecordButton: {
    marginRight: 8,
  },
  playbackScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  playbackBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backgroundImageContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  playbackOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    alignItems: 'center',
  },
  playbackTagContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  playbackTagLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 8,
  },
  playbackTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  playbackTagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playbackTagText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  playbackPlayButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  playbackToolbar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingBottom: 40,
  },
  playbackToolbarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(42, 55, 68, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playbackCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagModalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    width: '80%',
    maxHeight: '70%',
  },
  tagModalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: 'rgba(42, 55, 68, 0.8)',
  },
  tagModalButtonActive: {
    backgroundColor: '#FFD700',
  },
  tagModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  tagModalButtonTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  tickContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    position: 'absolute',
    width: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    top: '50%',
    left: '50%',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
  },
  circle1: {
    width: 200,
    height: 200,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  circle2: {
    width: 200,
    height: 200,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  circleOuter1: {
    width: 260,
    height: 260,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  circleOuter2: {
    width: 300,
    height: 300,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  circle3: {
    width: 100,
    height: 100,
    borderWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circlePattern: {
    position: 'absolute',
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playbackPlayButtonContainer: {
    position: 'absolute',
    left: '57%',
    top: '50%',
    width: 300,
    height: 300,
    transform: [{ translateX: -150 }, { translateY: -150 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 0,
  },
  settingsModalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingsModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  settingsModalSubtitle: {
    fontSize: 14,
    color: '#FFB800',
    marginBottom: 8,
  },
  settingsModalClose: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  settingsModalCloseText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsModalBody: {
    padding: 20,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  settingsSliderContainer: {
    flex: 1,
    marginLeft: 16,
  },
  settingsItemLabel: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 8,
  },
  settingsSlider: {
    width: '100%',
    height: 40,
  },
  intervalSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsToggleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 16,
  },
  progressArc: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '0deg' }],
  },
  recordingTextContainer: {
    position: 'absolute',
    bottom: '30%',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  recordingTextDisplay: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  recordingTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  recordingTag: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});

export default PassiveIncantationsScreen; 