import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { markDailyExerciseAsCompleted, markChallengeExerciseAsCompleted } from '../../../utils/exerciseCompletion';
import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
} from 'react-native-audio-recorder-player';
import { PermissionsAndroid } from 'react-native';
import OpenAI from 'openai';
import Config from 'react-native-config';
import LinearGradient from 'react-native-linear-gradient';

const openai = new OpenAI({
  apiKey: Config.OPENAI_API_KEY,
});

type Props = NativeStackScreenProps<RootStackParamList, 'DailyGratitude'>;

const MIN_ENTRIES = 1;

interface GratitudeEntry {
  what: string;
  why: string;
}

const DailyGratitudeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { context = 'daily', challengeId, returnTo } = route.params || {};
  const [showPostExercise, setShowPostExercise] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [entries, setEntries] = useState<GratitudeEntry[]>([{ what: '', why: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer());

  useEffect(() => {
    console.log('DailyGratitude screen mounted with route params:', route.params);
    
    const initializeAudioRecorder = async () => {
      try {
        if (Platform.OS === 'ios') {
          await audioRecorderPlayer.current.setSubscriptionDuration(0.1);
        }
      } catch (error) {
        console.error('Error initializing audio recorder:', error);
      }
    };

    initializeAudioRecorder();

    return () => {
      if (isRecording) {
        audioRecorderPlayer.current.stopRecorder().catch(() => {});
        audioRecorderPlayer.current.removeRecordBackListener();
      }
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
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

  const handleStartRecording = async (index: number) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please grant microphone access to record gratitudes.');
      return;
    }

    try {
      if (isRecording) {
        await audioRecorderPlayer.current.stopRecorder();
        audioRecorderPlayer.current.removeRecordBackListener();
      }

      setRecordingIndex(index);
      setIsRecording(true);
      setShowRecordingModal(true);

      // Configure recording options
      const audioSet = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: AVEncodingOption.aac,
      };

      // Start recording without saving to file
      await audioRecorderPlayer.current.startRecorder(undefined, audioSet);

      audioRecorderPlayer.current.addRecordBackListener((e) => {
        setRecordingDuration(e.currentPosition);
      });

    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      setShowRecordingModal(false);
      setRecordingIndex(null);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const handleStopRecording = async () => {
    if (recordingIndex === null || !isRecording) return;

    try {
      const audioPath = await audioRecorderPlayer.current.stopRecorder();
      audioRecorderPlayer.current.removeRecordBackListener();

      // Check if recording is too short (less than 1 second)
      if (recordingDuration < 1000) {
        Alert.alert('Recording Too Short', 'Please speak your gratitude clearly. Try recording again.');
        return;
      }

      setIsTranscribing(true);

      // Create form data for the API request
      const formData = new FormData();
      formData.append('file', {
        uri: audioPath,
        type: 'audio/m4a',
        name: 'audio.m4a'
      } as any);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en'); // Force English language
      formData.append('prompt', 'The audio is a gratitude statement starting with "I am grateful for" followed by a reason starting with "because"');

      // Make the API request directly using fetch
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Config.OPENAI_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const transcriptionResult = await response.json();
      
      // Check if transcription is empty or only contains whitespace
      if (!transcriptionResult.text?.trim()) {
        Alert.alert('No Speech Detected', 'No words were detected in your recording. Please try again and speak clearly.');
        return;
      }

      const { what, why } = parseGratitudeText(transcriptionResult.text);

      // If we don't have both parts, try to intelligently split the text
      if (!why) {
        const text = transcriptionResult.text.toLowerCase();
        if (text.includes('because')) {
          const parts = text.split(/because/i);
          const newWhat = parts[0].replace(/^(i am grateful for|i'm grateful for)/i, '').trim();
          const newWhy = parts[1].trim();
          if (newWhat && newWhy) {
            const newEntries = [...entries];
            newEntries[recordingIndex] = { what: newWhat, why: newWhy };
            setEntries(newEntries);
            return;
          }
        }
      }

      // Update the entry with transcribed text
      const newEntries = [...entries];
      newEntries[recordingIndex] = { what, why };
      setEntries(newEntries);

    } catch (error) {
      console.error('Failed to stop recording or transcribe:', error);
      Alert.alert('Error', 'Failed to process recording. Please try again.');
    } finally {
      setIsRecording(false);
      setShowRecordingModal(false);
      setRecordingIndex(null);
      setRecordingDuration(0);
      setIsTranscribing(false);
    }
  };

  const parseGratitudeText = (text: string): { what: string; why: string } => {
    // Remove any language prefixes like "Je suis reconnaissant pour"
    const cleanText = text.replace(/^(i am grateful for|i'm grateful for|je suis reconnaissant pour|je suis reconnaissante pour)/i, '').trim();
    
    // Try to split by "because" or "parce que"
    const becauseParts = cleanText.split(/\s+(?:because|parce que)\s+/i);
    
    if (becauseParts.length >= 2) {
      return {
        what: becauseParts[0].trim(),
        why: becauseParts.slice(1).join(' because ').trim(),
      };
    }
    
    return {
      what: cleanText,
      why: '',
    };
  };

  const handleAddEntry = () => {
    setEntries([...entries, { what: '', why: '' }]);
  };

  const handleUpdateEntry = (text: string, index: number, field: 'what' | 'why') => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: text };
    setEntries(newEntries);
  };

  const isEntryComplete = (entry: GratitudeEntry) => {
    return entry.what.trim().length > 0 && entry.why.trim().length > 0;
  };

  const isComplete = () => {
    return entries.filter(isEntryComplete).length >= MIN_ENTRIES;
  };

  const handleComplete = async () => {
    if (isComplete() && !isSubmitting) {
      try {
        setIsSubmitting(true);
        const validEntries = entries.filter(isEntryComplete);
        const entriesForAnalysis = validEntries.map(entry => `I am grateful for ${entry.what} because ${entry.why}`);

        if (validEntries.length >= MIN_ENTRIES) {
          navigation.navigate('GratitudeAnalysis', {
            entries: entriesForAnalysis,
            context: context,
            challengeId: challengeId,
            returnTo: returnTo
          });

          if (context === 'challenge' && challengeId) {
            const exerciseId = challengeId === '2' ? 'daily-gratitude-2' : 'daily-gratitude';
            await markChallengeExerciseAsCompleted(challengeId, exerciseId);
            if (route.params?.onComplete) {
              route.params.onComplete();
            }
          } else {
            await markDailyExerciseAsCompleted('daily-gratitude');
          }
        } else {
          Alert.alert('Cannot Complete', 'Please add at least one gratitude entry before completing.');
        }
      } catch (error) {
        console.error('Error completing gratitude exercise:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleExitPress = () => {
    setShowExitModal(true);
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    if (returnTo === 'ChallengeDetail' && challengeId) {
      navigation.navigate('ChallengeDetail', {
        challenge: {
          id: challengeId,
          title: 'Ultimate',
          duration: 21,
          description: 'Your subconscious mind shapes your reality.',
          image: require('../../../assets/illustrations/challenges/challenge-21.png')
        }
      });
    } else {
      navigation.navigate('MainTabs');
    }
  };

  const renderRecordingModal = () => (
    <Modal
      visible={showRecordingModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowRecordingModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.recordingModalContent}>
          <Text style={styles.recordingTitle}>
            Recording Gratitude...
          </Text>
          <Text style={styles.recordingInstructions}>
            Speak your complete gratitude{'\n'}
            Example: "I am grateful for sunny weather because it improves my mood"
          </Text>
          <Text style={styles.recordingTimer}>
            {new Date(recordingDuration).toISOString().substr(14, 5)}
          </Text>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingActive]}
            onPress={handleStopRecording}
          >
            <MaterialCommunityIcons
              name="stop"
              size={32}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <Text style={styles.recordingInstructions}>
            {isTranscribing ? 'Transcribing...' : 'Tap to stop recording'}
          </Text>
          {isTranscribing && (
            <ActivityIndicator style={{ marginTop: 16 }} color="#FFFFFF" />
          )}
        </View>
      </View>
    </Modal>
  );

  if (showPostExercise) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.postExerciseContent}>
          <MaterialCommunityIcons name="heart" size={60} color="#B91C1C" />
          <Text style={styles.postExerciseTitle}>Well Done!</Text>
          <Text style={styles.postExerciseText}>
            How do you feel after expressing gratitude?{'\n'}
            Take a moment to notice any positive changes in your mood.
          </Text>
          <TouchableOpacity 
            style={styles.completeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.completeButtonText}>I Feel Better</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient 
        colors={['#0F172A', '#1E3A5F', '#2D5F7C']} 
        style={styles.container}
        start={{x: 0.5, y: 0}}
        end={{x: 0.5, y: 1}}
      >
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity 
            style={styles.exitButton}
            onPress={handleExitPress}
          >
            <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.title}>What are you grateful for today?</Text>
            <Text style={styles.subtitle}>Type your gratitude or record it with your voice</Text>
            
            {entries.map((entry, index) => (
              <View key={index} style={styles.entryContainer}>
                <Text style={styles.entryNumber}>{index + 1}.</Text>
                <View style={styles.entryInputs}>
                  <View style={styles.inputContainer}>
                    <View style={styles.labelRow}>
                      <Text style={styles.inputLabel}>I am grateful for...</Text>
                      <TouchableOpacity
                        style={[styles.recordButton]}
                        onPress={() => handleStartRecording(index)}
                      >
                        <MaterialCommunityIcons
                          name="microphone"
                          size={24}
                          color="#FFFFFF"
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={[styles.input, styles.inputWithButton]}
                        value={entry.what}
                        onChangeText={(text) => handleUpdateEntry(text, index, 'what')}
                        placeholder="what are you grateful for?"
                        placeholderTextColor="rgba(255, 255, 255, 0.7)"
                        multiline
                      />
                    </View>
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>because...</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={[styles.input, styles.inputWithButton]}
                        value={entry.why}
                        onChangeText={(text) => handleUpdateEntry(text, index, 'why')}
                        placeholder="why are you grateful for it?"
                        placeholderTextColor="rgba(255, 255, 255, 0.7)"
                        multiline
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))}
            
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={handleAddEntry}
            >
              <Text style={styles.addButtonText}>+ Add Another</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity 
            style={[
              styles.completeButton,
              !isComplete() && styles.completeButtonDisabled
            ]}
            onPress={handleComplete}
            disabled={!isComplete()}
          >
            <Text style={styles.completeButtonText}>
              {isComplete() ? "I'm done" : `Add ${MIN_ENTRIES - entries.filter(isEntryComplete).length} More`}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>

      <Modal
        visible={showExitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Wait! Are you sure?</Text>
            <Text style={styles.modalText}>
              You're making progress! Continue practicing gratitude to maintain your positive mindset.
            </Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => setShowExitModal(false)}
            >
              <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalExitButton}
              onPress={handleConfirmExit}
            >
              <Text style={styles.exitText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {renderRecordingModal()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  exitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 12,
    marginTop: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    marginTop: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
    textAlign: 'center',
  },
  entryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  entryNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    marginRight: 10,
    marginTop: 12,
  },
  entryInputs: {
    flex: 1,
    gap: 12,
  },
  inputContainer: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    minHeight: 50,
    color: '#FFFFFF',
  },
  addButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginLeft: 25,
    padding: 10,
  },
  addButtonText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 50,
    paddingVertical: 20,
    borderRadius: 40,
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    zIndex: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  completeButtonDisabled: {
    opacity: 0.5,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  postExerciseContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
  },
  postExerciseTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  postExerciseText: {
    fontSize: 20,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    padding: 24,
    borderRadius: 16,
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
    marginBottom: 32,
    opacity: 0.8,
    lineHeight: 24,
  },
  continueButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
    width: '100%',
  },
  continueText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalExitButton: {
    backgroundColor: '#B91C1C',
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
  },
  exitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWithButton: {
    flex: 1,
  },
  recordButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  recordingActive: {
    backgroundColor: '#D4AF37',
  },
  recordingModalContent: {
    backgroundColor: '#1C1C1E',
    padding: 24,
    borderRadius: 16,
    width: '85%',
    alignItems: 'center',
  },
  recordingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  recordingTimer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 32,
  },
  recordingInstructions: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
    opacity: 0.8,
  },
});

export default DailyGratitudeScreen; 