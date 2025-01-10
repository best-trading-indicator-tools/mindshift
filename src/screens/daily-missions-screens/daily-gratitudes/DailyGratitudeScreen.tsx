import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { markDailyExerciseAsCompleted } from '../../../utils/exerciseCompletion';

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

  useEffect(() => {
    console.log('DailyGratitude screen mounted with route params:', route.params);
  }, [route.params]);

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
        if (context === 'challenge' && challengeId) {
          const validEntries = entries.filter(isEntryComplete);
          if (validEntries.length >= MIN_ENTRIES) {
            if (route.params?.onComplete) {
              route.params.onComplete();
            }
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
            Alert.alert('Cannot Complete', 'Please add at least one gratitude entry before completing.');
          }
        } else {
          await markDailyExerciseAsCompleted('daily-gratitude');
          setShowPostExercise(true);
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
    if (returnTo) {
      navigation.navigate('ChallengeDetail', {
        challenge: {
          id: challengeId || '1',
          title: 'Ultimate',
          duration: 21,
          description: 'Your subconscious mind shapes your reality.',
          image: require('../../../assets/illustrations/challenges/challenge-21.png')
        }
      });
    } else {
      navigation.replace('MainTabs');
    }
  };

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
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity 
          style={styles.exitButton}
          onPress={handleExitPress}
        >
          <MaterialCommunityIcons name="close" size={24} color="#B91C1C" />
        </TouchableOpacity>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.title}>What are you grateful for today?</Text>
          
          {entries.map((entry, index) => (
            <View key={index} style={styles.entryContainer}>
              <Text style={styles.entryNumber}>{index + 1}.</Text>
              <View style={styles.entryInputs}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>I am grateful for...</Text>
                  <TextInput
                    style={styles.input}
                    value={entry.what}
                    onChangeText={(text) => handleUpdateEntry(text, index, 'what')}
                    placeholder="what are you grateful for?"
                    placeholderTextColor="#666"
                    multiline
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>because...</Text>
                  <TextInput
                    style={styles.input}
                    value={entry.why}
                    onChangeText={(text) => handleUpdateEntry(text, index, 'why')}
                    placeholder="why are you grateful for it?"
                    placeholderTextColor="#666"
                    multiline
                  />
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  exitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 30,
    textAlign: 'center',
  },
  entryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  entryNumber: {
    color: '#000000',
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
  inputLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
    marginLeft: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    minHeight: 50,
    color: '#000000',
  },
  addButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginLeft: 25,
    padding: 10,
  },
  addButtonText: {
    color: '#B91C1C',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#B91C1C',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
});

export default DailyGratitudeScreen; 