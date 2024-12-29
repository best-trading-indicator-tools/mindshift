import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { VisionBoardSection } from './VisionBoardScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'NewVisionBoardSection'>;

const SUGGESTED_SECTIONS = [
  'Travel',
  'Health',
  'Family',
  'Friends',
  'Work',
  'Fun',
  'Business',
  'Finance',
  'Wealth',
  'Self-Care',
];

const NewVisionBoardSectionScreen: React.FC<Props> = ({ navigation }) => {
  const [sectionName, setSectionName] = useState('');

  const handleCreateSection = async () => {
    if (!sectionName.trim()) return;

    try {
      // Load existing sections
      const storedSections = await AsyncStorage.getItem('vision_board_sections');
      const sections: VisionBoardSection[] = storedSections ? JSON.parse(storedSections) : [];

      // Create new section
      const newSection: VisionBoardSection = {
        id: Date.now().toString(),
        name: sectionName.trim(),
        photos: [],
      };

      // Save updated sections
      const updatedSections = [...sections, newSection];
      await AsyncStorage.setItem('vision_board_sections', JSON.stringify(updatedSections));

      // Navigate back to vision board
      navigation.goBack();
    } catch (error) {
      console.error('Error creating new section:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Great! Let's give a name to your new section.</Text>
      
      <TextInput
        style={styles.input}
        value={sectionName}
        onChangeText={setSectionName}
        placeholder="Finance"
        placeholderTextColor="#666"
        autoFocus
      />

      <Text style={styles.suggestedTitle}>or pick one from below</Text>

      <View style={styles.suggestedContainer}>
        {SUGGESTED_SECTIONS.map((section) => (
          <TouchableOpacity
            key={section}
            style={styles.suggestionButton}
            onPress={() => setSectionName(section)}
          >
            <Text style={styles.suggestionText}>{section}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.continueButton, !sectionName.trim() && styles.continueButtonDisabled]}
        onPress={handleCreateSection}
        disabled={!sectionName.trim()}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#151932',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 24,
  },
  suggestedTitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
    textAlign: 'center',
  },
  suggestedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  suggestionButton: {
    backgroundColor: '#151932',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  continueButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 'auto',
    marginBottom: 20,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default NewVisionBoardSectionScreen; 