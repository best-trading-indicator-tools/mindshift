import React, { useState } from 'react';
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
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import ExerciseIntroScreen from '../components/ExerciseIntroScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { markExerciseAsCompleted } from '../services/exerciseService';

type Props = NativeStackScreenProps<RootStackParamList, 'Gratitude'>;

const MIN_ENTRIES = 5;

const GratitudeScreen: React.FC<Props> = ({ navigation }) => {
  const [showPostExercise, setShowPostExercise] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [entries, setEntries] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddEntry = () => {
    setEntries([...entries, '']);
  };

  const handleUpdateEntry = (text: string, index: number) => {
    const newEntries = [...entries];
    newEntries[index] = text;
    setEntries(newEntries);
  };

  const isComplete = () => {
    return entries.filter(entry => entry.trim().length > 0).length >= MIN_ENTRIES;
  };

  const handleComplete = async () => {
    if (isComplete() && !isSubmitting) {
      try {
        setIsSubmitting(true);
        await markExerciseAsCompleted('gratitude', 'Daily Gratitude');
        setShowPostExercise(true);
      } catch (error) {
        console.error('Error completing gratitude exercise:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleExit = () => {
    setShowExitModal(true);
  };

  if (showPostExercise) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#3730A3', '#6366F1']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.postExerciseContent}>
            <MaterialCommunityIcons name="heart" size={60} color="#FFFFFF" />
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
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#3730A3', '#6366F1']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity 
            style={styles.exitButton}
            onPress={handleExit}
          >
            <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.title}>What are you grateful for today?</Text>
            
            {entries.map((entry, index) => (
              <View key={index} style={styles.entryContainer}>
                <Text style={styles.entryNumber}>{index + 1}.</Text>
                <TextInput
                  style={styles.input}
                  value={entry}
                  onChangeText={(text) => handleUpdateEntry(text, index)}
                  placeholder="I'm grateful for..."
                  placeholderTextColor="#666"
                  multiline
                />
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
              {isComplete() ? "I'm done" : `Add ${MIN_ENTRIES - entries.filter(e => e.trim().length > 0).length} More`}
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
              onPress={() => navigation.navigate('MainTabs')}
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
  },
  gradient: {
    flex: 1,
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
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
  },
  entryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  entryNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    marginRight: 10,
    marginTop: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  completeButtonText: {
    color: '#6366F1',
    fontSize: 22,
    fontWeight: '600',
  },
  postExerciseContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  postExerciseTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  postExerciseText: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
    backgroundColor: '#E31837',
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

export default GratitudeScreen; 