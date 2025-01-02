import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Text,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import PexelsImagePicker from '../../components/PexelsImagePicker';
import { VisionBoard, VisionBoardSection } from './VisionBoardScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'VisionBoardSection'>;

interface PexelsPhoto {
  src: {
    large?: string;
    medium?: string;
    original?: string;
  };
}

const VisionBoardSectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const [showPexelsPicker, setShowPexelsPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<PexelsPhoto[]>([]);
  const { boardId, sectionId, sectionName } = route.params;

  useEffect(() => {
    setNewSectionName(sectionName);
  }, [sectionName]);

  const handleAddPhotos = () => {
    setShowPexelsPicker(true);
  };

  const handleSelectPhotos = async (photos: PexelsPhoto[]) => {
    setSelectedPhotos(photos);
    setShowPexelsPicker(false);
  };

  const handleDone = async () => {
    try {
      const storedBoards = await AsyncStorage.getItem('vision_boards');
      if (storedBoards) {
        const boards: VisionBoard[] = JSON.parse(storedBoards);
        const currentBoard = boards.find(b => b.id === boardId);
        
        if (currentBoard) {
          const updatedSections = currentBoard.sections.map(section =>
            section.id === sectionId 
              ? { ...section, photos: selectedPhotos.map(p => p.src?.large || p.src?.medium || p.src?.original) }
              : section
          );

          const updatedBoard = {
            ...currentBoard,
            sections: updatedSections,
          };

          const updatedBoards = boards.map(b => 
            b.id === boardId ? updatedBoard : b
          );

          await AsyncStorage.setItem('vision_boards', JSON.stringify(updatedBoards));
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Error saving photos:', error);
    }
  };

  const handleHelpPress = () => {
    // TODO: Implement help modal or navigation
    console.log('Help pressed');
  };

  const handleEditName = async () => {
    if (!newSectionName.trim()) return;

    try {
      const storedBoards = await AsyncStorage.getItem('vision_boards');
      if (storedBoards) {
        const boards: VisionBoard[] = JSON.parse(storedBoards);
        const currentBoard = boards.find(b => b.id === boardId);
        
        if (currentBoard) {
          const updatedSections = currentBoard.sections.map(section =>
            section.id === sectionId ? { ...section, name: newSectionName.trim() } : section
          );

          const updatedBoard = {
            ...currentBoard,
            sections: updatedSections,
          };

          const updatedBoards = boards.map(b => 
            b.id === boardId ? updatedBoard : b
          );

          await AsyncStorage.setItem('vision_boards', JSON.stringify(updatedBoards));
          navigation.setParams({ sectionName: newSectionName.trim() });
          setShowEditNameModal(false);
          setShowMenu(false);
        }
      }
    } catch (error) {
      console.error('Error updating section name:', error);
    }
  };

  const handleMoveSection = () => {
    // TODO: Implement section reordering
    setShowMenu(false);
  };

  const handleDeleteSection = async () => {
    Alert.alert(
      'Delete Section',
      `Are you sure you want to delete "${sectionName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const storedBoards = await AsyncStorage.getItem('vision_boards');
              if (storedBoards) {
                const boards: VisionBoard[] = JSON.parse(storedBoards);
                const currentBoard = boards.find(b => b.id === boardId);
                
                if (currentBoard) {
                  const updatedSections = currentBoard.sections.filter(
                    section => section.id !== sectionId
                  );

                  const updatedBoard = {
                    ...currentBoard,
                    sections: updatedSections,
                  };

                  const updatedBoards = boards.map(b => 
                    b.id === boardId ? updatedBoard : b
                  );

                  await AsyncStorage.setItem('vision_boards', JSON.stringify(updatedBoards));
                  navigation.goBack();
                }
              }
            } catch (error) {
              console.error('Error deleting section:', error);
            }
          },
        },
      ]
    );
    setShowMenu(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={32} color="#FF4B8C" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>{sectionName}</Text>
        </View>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowMenu(true)}
        >
          <MaterialCommunityIcons name="dots-horizontal" size={24} color="#FF4B8C" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.content}>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Add description..."
            placeholderTextColor="#999999"
            multiline
          />
          
          {selectedPhotos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image 
                source={{ uri: photo.src.large || photo.src.medium || photo.src.original }}
                style={styles.photo}
              />
              <TouchableOpacity style={styles.removePhotoButton}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TextInput
                style={styles.captionInput}
                placeholder="Add caption..."
                placeholderTextColor="#999999"
              />
            </View>
          ))}
        </ScrollView>

        <View style={styles.bottomButtons}>
          <TouchableOpacity 
            style={styles.addPhotosButton}
            onPress={handleAddPhotos}
          >
            <MaterialCommunityIcons name="image-plus" size={24} color="#FF4B8C" />
            <Text style={styles.addPhotosText}>Add Photos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.doneButton}
            onPress={handleDone}
          >
            <MaterialCommunityIcons name="check" size={24} color="#FFFFFF" />
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Section Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="none"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setShowEditNameModal(true);
              }}
            >
              <Text style={styles.menuItemText}>Edit Section's Name</Text>
              <MaterialCommunityIcons name="pencil" size={20} color="#000000" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleMoveSection}
            >
              <Text style={styles.menuItemText}>Move Section</Text>
              <MaterialCommunityIcons name="arrow-all" size={20} color="#000000" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity 
              style={[styles.menuItem, styles.deleteItem]}
              onPress={handleDeleteSection}
            >
              <Text style={[styles.menuItemText, styles.deleteText]}>Delete Section</Text>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF0000" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Name Modal */}
      <Modal
        visible={showEditNameModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowEditNameModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditNameModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Edit Section's Name</Text>
            <TextInput
              style={styles.input}
              value={newSectionName}
              onChangeText={setNewSectionName}
              placeholder="Section name"
              placeholderTextColor="#666666"
              autoFocus
            />
            <TouchableOpacity 
              style={[styles.saveButton, !newSectionName.trim() && styles.saveButtonDisabled]}
              onPress={handleEditName}
              disabled={!newSectionName.trim()}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalContent: {
    position: 'absolute',
    top: 70,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: 220,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#000000',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 17,
    color: '#000000',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  deleteItem: {
    marginTop: 0,
  },
  deleteText: {
    color: '#FF0000',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  input: {
    fontSize: 17,
    borderBottomWidth: 1,
    borderBottomColor: '#FF4B8C',
    paddingVertical: 8,
    marginBottom: 24,
    color: '#000000',
  },
  saveButton: {
    backgroundColor: '#FF4B8C',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  descriptionInput: {
    fontSize: 17,
    color: '#666666',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  photoContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photo: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  captionInput: {
    fontSize: 15,
    color: '#666666',
    padding: 16,
  },
  bottomButtons: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 34,
    gap: 12,
  },
  addPhotosButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 75, 140, 0.1)',
    paddingVertical: 16,
    borderRadius: 100,
    gap: 8,
  },
  addPhotosText: {
    color: '#FF4B8C',
    fontSize: 17,
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4B8C',
    paddingVertical: 16,
    borderRadius: 100,
    gap: 8,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default VisionBoardSectionScreen; 