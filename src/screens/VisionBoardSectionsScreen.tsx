import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { VisionBoard, VisionBoardSection } from './VisionBoardScreen';
import PexelsImagePicker from '../components/PexelsImagePicker';

type Props = NativeStackScreenProps<RootStackParamList, 'VisionBoardSections'>;

const SUGGESTED_SECTIONS = [
  'Health',
  'Finances',
  'Career',
  'Relationships',
  'Personal Growth',
  'Travel',
  'Family',
  'Spirituality',
  'Home',
  'Hobbies',
];

const VisionBoardSectionsScreen: React.FC<Props> = ({ navigation, route }) => {
  const [board, setBoard] = useState<VisionBoard | null>(null);
  const [showNewSectionModal, setShowNewSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSection, setEditingSection] = useState<VisionBoardSection | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPexelsPicker, setShowPexelsPicker] = useState(false);
  const [selectedSection, setSelectedSection] = useState<VisionBoardSection | null>(null);

  useEffect(() => {
    loadBoard();
  }, []);

  const loadBoard = async () => {
    try {
      const storedBoards = await AsyncStorage.getItem('vision_boards');
      if (storedBoards) {
        const boards: VisionBoard[] = JSON.parse(storedBoards);
        const currentBoard = boards.find(b => b.id === route.params.boardId);
        if (currentBoard) {
          setBoard(currentBoard);
        }
      }
    } catch (error) {
      console.error('Error loading board:', error);
    }
  };

  const handleCreateSection = async () => {
    if (!board || !newSectionName.trim()) return;

    try {
      const newSection: VisionBoardSection = {
        id: Date.now().toString(),
        name: newSectionName.trim(),
        photos: [],
      };

      const updatedBoard = {
        ...board,
        sections: [...board.sections, newSection],
      };

      const storedBoards = await AsyncStorage.getItem('vision_boards');
      if (storedBoards) {
        const boards: VisionBoard[] = JSON.parse(storedBoards);
        const updatedBoards = boards.map(b => 
          b.id === board.id ? updatedBoard : b
        );
        await AsyncStorage.setItem('vision_boards', JSON.stringify(updatedBoards));
        setBoard(updatedBoard);
        setShowNewSectionModal(false);
        setNewSectionName('');
      }
    } catch (error) {
      console.error('Error creating section:', error);
    }
  };

  const handleEditSection = async () => {
    if (!board || !editingSection || !editingSection.name.trim()) return;

    try {
      const updatedBoard = {
        ...board,
        sections: board.sections.map(section =>
          section.id === editingSection.id ? editingSection : section
        ),
      };

      const storedBoards = await AsyncStorage.getItem('vision_boards');
      if (storedBoards) {
        const boards: VisionBoard[] = JSON.parse(storedBoards);
        const updatedBoards = boards.map(b => 
          b.id === board.id ? updatedBoard : b
        );
        await AsyncStorage.setItem('vision_boards', JSON.stringify(updatedBoards));
        setBoard(updatedBoard);
        setShowEditModal(false);
        setEditingSection(null);
      }
    } catch (error) {
      console.error('Error updating section:', error);
    }
  };

  const handleDeleteSection = async (section: VisionBoardSection) => {
    if (!board) return;

    Alert.alert(
      'Delete Section',
      `Are you sure you want to delete "${section.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedBoard = {
                ...board,
                sections: board.sections.filter(s => s.id !== section.id),
              };

              const storedBoards = await AsyncStorage.getItem('vision_boards');
              if (storedBoards) {
                const boards: VisionBoard[] = JSON.parse(storedBoards);
                const updatedBoards = boards.map(b => 
                  b.id === board.id ? updatedBoard : b
                );
                await AsyncStorage.setItem('vision_boards', JSON.stringify(updatedBoards));
                setBoard(updatedBoard);
              }
            } catch (error) {
              console.error('Error deleting section:', error);
            }
          },
        },
      ]
    );
  };

  const handleSavePhotos = async (photos: string[]) => {
    if (!board || !selectedSection) return;

    try {
      const updatedSection = {
        ...selectedSection,
        photos: [...selectedSection.photos, ...photos],
      };

      const updatedBoard = {
        ...board,
        sections: board.sections.map(s => 
          s.id === selectedSection.id ? updatedSection : s
        ),
      };

      const storedBoards = await AsyncStorage.getItem('vision_boards');
      if (storedBoards) {
        const boards: VisionBoard[] = JSON.parse(storedBoards);
        const updatedBoards = boards.map(b => 
          b.id === board.id ? updatedBoard : b
        );
        await AsyncStorage.setItem('vision_boards', JSON.stringify(updatedBoards));
        setBoard(updatedBoard);
      }
    } catch (error) {
      console.error('Error saving photos:', error);
    }
  };

  if (!board) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={32} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{board.name}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.exitButton}
            onPress={() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            }}
          >
            <MaterialCommunityIcons name="exit-to-app" size={24} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowNewSectionModal(true)}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {board.sections.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={styles.sectionCard}
            onPress={() => {
              setSelectedSection(section);
              setShowPexelsPicker(true);
            }}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionName}>{section.name}</Text>
              <Text style={styles.photoCount}>{section.photos.length} Photos</Text>
            </View>
            <View style={styles.sectionActions}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setEditingSection(section);
                  setShowEditModal(true);
                }}
              >
                <MaterialCommunityIcons name="pencil" size={24} color="#6366f1" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteSection(section);
                }}
              >
                <MaterialCommunityIcons name="delete" size={24} color="#FF4B8C" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* New Section Modal */}
      <Modal
        visible={showNewSectionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewSectionModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNewSectionModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Create New Section</Text>
            <TextInput
              style={styles.input}
              value={newSectionName}
              onChangeText={setNewSectionName}
              placeholder="Health, Finance, etc."
              placeholderTextColor="#666"
              autoFocus
            />
            <TouchableOpacity 
              style={styles.suggestionsButton}
              onPress={() => setShowSuggestions(!showSuggestions)}
            >
              <Text style={styles.suggestionsButtonText}>
                {showSuggestions ? 'Hide Suggestions' : 'Show Suggestions'}
              </Text>
            </TouchableOpacity>

            {showSuggestions && (
              <View style={styles.suggestionsContainer}>
                {SUGGESTED_SECTIONS.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion}
                    style={styles.suggestionChip}
                    onPress={() => {
                      setNewSectionName(suggestion);
                      setShowSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={[styles.createButton, !newSectionName.trim() && styles.createButtonDisabled]}
              onPress={handleCreateSection}
              disabled={!newSectionName.trim()}
            >
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Section Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Edit Section</Text>
            <TextInput
              style={styles.input}
              value={editingSection?.name || ''}
              onChangeText={(text) => editingSection && setEditingSection({...editingSection, name: text})}
              placeholder="Section Name"
              placeholderTextColor="#666"
              autoFocus
            />
            <TouchableOpacity 
              style={[styles.createButton, !editingSection?.name.trim() && styles.createButtonDisabled]}
              onPress={handleEditSection}
              disabled={!editingSection?.name.trim()}
            >
              <Text style={styles.createButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Pexels Image Picker */}
      <PexelsImagePicker
        visible={showPexelsPicker}
        onClose={() => {
          setShowPexelsPicker(false);
          setSelectedSection(null);
        }}
        onSelectPhotos={handleSavePhotos}
        initialSearchTerm={selectedSection?.name || ''}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#6366f1',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionCard: {
    backgroundColor: '#1E1E3D',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  photoCount: {
    fontSize: 16,
    color: '#888888',
    marginTop: 4,
  },
  sectionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E3D',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 12,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#151932',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  suggestionsButton: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  suggestionsButtonText: {
    color: '#6366f1',
    fontSize: 16,
    textAlign: 'center',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  suggestionChip: {
    backgroundColor: '#151932',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  createButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exitButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFD700',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VisionBoardSectionsScreen; 