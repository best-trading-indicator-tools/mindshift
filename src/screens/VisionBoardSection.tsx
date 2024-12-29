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
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { VisionBoard, VisionBoardSection } from './VisionBoardScreen';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import PexelsImagePicker from '../components/PexelsImagePicker';

type Props = NativeStackScreenProps<RootStackParamList, 'VisionBoardSection'>;

const PlaceholderImage = () => (
  <View style={styles.placeholderImage}>
    <MaterialCommunityIcons name="hand-peace" size={80} color="#FFB6C1" />
    <View style={styles.placeholderFrame}>
      <MaterialCommunityIcons name="chart-line-variant" size={24} color="#FFD700" />
    </View>
  </View>
);

const VisionBoardSectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const [board, setBoard] = useState<VisionBoard | null>(null);
  const [section, setSection] = useState<VisionBoardSection | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const [showPexelsPicker, setShowPexelsPicker] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadBoardAndSection();
  }, []);

  const loadBoardAndSection = async () => {
    try {
      const storedBoards = await AsyncStorage.getItem('vision_boards');
      if (storedBoards) {
        const boards: VisionBoard[] = JSON.parse(storedBoards);
        const currentBoard = boards.find(b => b.id === route.params.boardId);
        if (currentBoard) {
          setBoard(currentBoard);
          const currentSection = currentBoard.sections.find(s => s.id === route.params.sectionId);
          if (currentSection) {
            setSection(currentSection);
            setNewName(currentSection.name);
          }
        }
      }
    } catch (error) {
      console.error('Error loading board and section:', error);
    }
  };

  const handleEditName = async () => {
    if (!board || !section || !newName.trim()) return;

    try {
      const updatedBoard = {
        ...board,
        sections: board.sections.map(s => {
          if (s.id === section.id) {
            return { ...s, name: newName.trim() };
          }
          return s;
        }),
      };

      const storedBoards = await AsyncStorage.getItem('vision_boards');
      if (storedBoards) {
        const boards: VisionBoard[] = JSON.parse(storedBoards);
        const updatedBoards = boards.map(b => 
          b.id === board.id ? updatedBoard : b
        );
        await AsyncStorage.setItem('vision_boards', JSON.stringify(updatedBoards));
        setBoard(updatedBoard);
        setSection({ ...section, name: newName.trim() });
        setShowEditName(false);
        setShowMenu(false);
      }
    } catch (error) {
      console.error('Error updating section name:', error);
    }
  };

  const handleDeletePhoto = async (photoIndex: number) => {
    if (!board || !section) return;

    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedSection = {
                ...section,
                photos: section.photos.filter((_, index) => index !== photoIndex),
              };

              const updatedBoard = {
                ...board,
                sections: board.sections.map(s => 
                  s.id === section.id ? updatedSection : s
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
                setSection(updatedSection);
              }
            } catch (error) {
              console.error('Error deleting photo:', error);
            }
          },
        },
      ]
    );
  };

  const handleSelectPhotos = async () => {
    setShowPexelsPicker(true);
  };

  const handlePhonePicker = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 0,
        quality: 0.8,
      });

      if (result.assets && section) {
        const newPhotos = result.assets
          .map((asset: Asset) => asset.uri || '')
          .filter((uri: string) => uri !== '');

        await savePhotos(newPhotos);
      }
    } catch (error) {
      console.error('Error selecting photos:', error);
    }
  };

  const savePhotos = async (newPhotos: string[]) => {
    if (!board || !section) return;

    try {
      const updatedBoard = {
        ...board,
        sections: board.sections.map(s => {
          if (s.id === section.id) {
            return {
              ...s,
              photos: [...s.photos, ...newPhotos],
            };
          }
          return s;
        }),
      };

      const storedBoards = await AsyncStorage.getItem('vision_boards');
      if (storedBoards) {
        const boards: VisionBoard[] = JSON.parse(storedBoards);
        const updatedBoards = boards.map(b => 
          b.id === board.id ? updatedBoard : b
        );
        await AsyncStorage.setItem('vision_boards', JSON.stringify(updatedBoards));
        loadBoardAndSection();
      }
    } catch (error) {
      console.error('Error saving photos:', error);
    }
  };

  const handleEditNamePress = () => {
    setShowMenu(false);
    setTimeout(() => setShowEditName(true), 100);
  };

  if (!board || !section) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={32} color="#FF4B8C" />
        </TouchableOpacity>
        <Text style={styles.title}>{section.name}</Text>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowMenu(true)}
        >
          <MaterialCommunityIcons name="dots-horizontal" size={24} color="#FF4B8C" />
        </TouchableOpacity>
      </View>

      {section.photos.length === 0 ? (
        <View style={styles.emptyContent}>
          <PlaceholderImage />
          <Text style={styles.emptyStateTitle}>
            Start manifesting your {section.name}
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleSelectPhotos}
          >
            <MaterialCommunityIcons name="image-plus" size={24} color="#000000" />
            <Text style={styles.addButtonText}>Add Photos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.helpButton}>
            <MaterialCommunityIcons name="help-circle-outline" size={20} color="#666" />
            <Text style={styles.helpButtonText}>Check how to select photos</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.photoGrid}>
            {section.photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity 
                  style={styles.deletePhotoButton}
                  onPress={() => handleDeletePhoto(index)}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <TouchableOpacity 
            style={[styles.addButton, styles.addMoreButton]}
            onPress={handleSelectPhotos}
          >
            <MaterialCommunityIcons name="image-plus" size={24} color="#000000" />
            <Text style={styles.addButtonText}>Add More Photos</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuModal}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleEditNamePress}
            >
              <Text style={styles.menuItemText}>Edit Section's Name</Text>
              <MaterialCommunityIcons name="pencil" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Name Modal */}
      <Modal
        visible={showEditName}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditName(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditName(false)}
        >
          <View style={styles.editNameModal}>
            <View style={styles.handle} />
            <Text style={styles.editNameTitle}>Edit Section's Name</Text>
            <TextInput
              style={styles.editNameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter new name"
              autoFocus
            />
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleEditName}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Pexels Image Picker */}
      <PexelsImagePicker
        visible={showPexelsPicker}
        onClose={() => setShowPexelsPicker(false)}
        onSelectPhotos={savePhotos}
        initialSearchTerm={section.name}
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
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    width: '48%',
    aspectRatio: 1,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  deletePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderFrame: {
    position: 'absolute',
    top: 40,
    right: 40,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 32,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginBottom: 24,
    gap: 8,
    width: '100%',
  },
  addMoreButton: {
    marginTop: 12,
  },
  addButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  helpButtonText: {
    color: '#000000',
    fontSize: 16,
    flex: 1,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuModal: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 200,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemText: {
    fontSize: 17,
    color: '#000000',
    marginRight: 12,
  },
  editNameModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDDDDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  editNameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000000',
  },
  editNameInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default VisionBoardSectionScreen; 