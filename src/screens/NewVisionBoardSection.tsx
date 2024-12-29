import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VisionBoard, VisionBoardSection } from './VisionBoardScreen';

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

const NewVisionBoardSection: React.FC<Props> = ({ navigation, route }) => {
  const [sectionName, setSectionName] = useState('');

  const handleCreateSection = async () => {
    if (!sectionName.trim()) return;

    try {
      const storedBoards = await AsyncStorage.getItem('vision_boards');
      if (storedBoards) {
        const boards: VisionBoard[] = JSON.parse(storedBoards);
        const currentBoard = boards.find(b => b.id === route.params.boardId);
        
        if (currentBoard) {
          const newSection: VisionBoardSection = {
            id: Date.now().toString(),
            name: sectionName.trim(),
            photos: [],
          };

          const updatedBoard = {
            ...currentBoard,
            sections: [...currentBoard.sections, newSection],
          };

          const updatedBoards = boards.map(b => 
            b.id === currentBoard.id ? updatedBoard : b
          );

          await AsyncStorage.setItem('vision_boards', JSON.stringify(updatedBoards));
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Error creating section:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Great! Let's give a name to your{'\n'}new section.</Text>
        
        <TextInput
          style={styles.input}
          value={sectionName}
          onChangeText={setSectionName}
          placeholder="Name your section"
          placeholderTextColor="#999999"
          autoFocus
        />

        <Text style={styles.subtitle}>or pick one from below</Text>

        <View style={styles.suggestionsContainer}>
          {SUGGESTED_SECTIONS.map((section) => (
            <TouchableOpacity
              key={section}
              style={styles.suggestionChip}
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 40,
    lineHeight: 36,
  },
  input: {
    fontSize: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#FF4B8C',
    paddingVertical: 8,
    marginBottom: 32,
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#999999',
    marginBottom: 24,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: -4,
  },
  suggestionChip: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 16,
    color: '#000000',
  },
  continueButton: {
    backgroundColor: '#FF4B8C',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default NewVisionBoardSection; 