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
import LinearGradient from 'react-native-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient 
        colors={['#0F172A', '#1E3A5F', '#2D5F7C']} 
        style={styles.container}
        start={{x: 0.5, y: 0}}
        end={{x: 0.5, y: 1}}
      >
        <SafeAreaView style={styles.container}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="chevron-left" size={32} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>Great! Let's give a name to your{'\n'}new section.</Text>
            
            <TextInput
              style={styles.input}
              value={sectionName}
              onChangeText={setSectionName}
              placeholder="Name your section"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />

            <Text style={styles.orText}>or pick one from below</Text>

            <View style={styles.suggestionsContainer}>
              {SUGGESTED_SECTIONS.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  style={styles.suggestionButton}
                  onPress={() => setSectionName(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
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

        <PexelsImagePicker
          visible={showPexelsPicker}
          onClose={() => setShowPexelsPicker(false)}
          onSelectPhotos={handleSelectPhotos}
          initialSearchTerm={sectionName}
        />
      </LinearGradient>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginLeft: 16,
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
  },
  input: {
    fontSize: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    color: '#FFFFFF',
    marginBottom: 24,
  },
  orText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 40,
  },
  suggestionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
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