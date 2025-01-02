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
import { RootStackParamList } from '../../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VisionBoard, VisionBoardSection } from './VisionBoardScreen';
import PexelsImagePicker from '../../components/PexelsImagePicker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { markExerciseAsCompleted } from '../../services/exerciseService';

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
  const [showPexelsPicker, setShowPexelsPicker] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);

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
          
          // Mark vision board as completed when first section is created
          if (currentBoard.sections.length === 0) {
            await markExerciseAsCompleted('vision-board', 'Vision Board');
          }
          
          // Store the section ID and show Pexels picker
          setCurrentSectionId(newSection.id);
          setShowPexelsPicker(true);
        }
      }
    } catch (error) {
      console.error('Error creating section:', error);
    }
  };

  const handleSelectPhotos = async (photos: any[]) => {
    setShowPexelsPicker(false);
    
    if (!currentSectionId) return;

    try {
      const storedBoards = await AsyncStorage.getItem('vision_boards');
      if (storedBoards) {
        const boards: VisionBoard[] = JSON.parse(storedBoards);
        const currentBoard = boards.find(b => b.id === route.params.boardId);
        
        if (currentBoard) {
          const updatedSections = currentBoard.sections.map(section =>
            section.id === currentSectionId
              ? {
                  ...section,
                  photos: photos.map(p => p.src?.large || p.src?.medium || p.src?.original),
                }
              : section
          );

          const updatedBoard = {
            ...currentBoard,
            sections: updatedSections,
          };

          const updatedBoards = boards.map(b => 
            b.id === currentBoard.id ? updatedBoard : b
          );

          await AsyncStorage.setItem('vision_boards', JSON.stringify(updatedBoards));
          
          // Navigate back to VisionBoardSections with refresh
          navigation.navigate('VisionBoardSections', {
            boardId: route.params.boardId,
            refresh: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('Error saving photos:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={32} color="#E31837" />
        </TouchableOpacity>
      </View>
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

      <PexelsImagePicker
        visible={showPexelsPicker}
        onClose={() => setShowPexelsPicker(false)}
        onSelectPhotos={handleSelectPhotos}
        initialSearchTerm={sectionName}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
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
    borderBottomColor: '#E31837',
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
    backgroundColor: '#E31837',
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