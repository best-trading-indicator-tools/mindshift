import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Modal,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import PexelsImagePicker from '../../components/PexelsImagePicker';
import { VisionBoard } from './VisionBoardScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'VisionBoardSectionPhotos'>;

interface PexelsPhoto {
  src: {
    large?: string;
    medium?: string;
    original?: string;
  };
}

const VisionBoardSectionPhotosScreen: React.FC<Props> = ({ navigation, route }) => {
  const [showPexelsPicker, setShowPexelsPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [captions, setCaptions] = useState<{ [key: string]: string }>({});
  const { boardId, sectionId, sectionName } = route.params;

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const storedBoards = await AsyncStorage.getItem('vision_boards');
      if (storedBoards) {
        const boards: VisionBoard[] = JSON.parse(storedBoards);
        const currentBoard = boards.find(b => b.id === boardId);
        if (currentBoard) {
          const section = currentBoard.sections.find(s => s.id === sectionId);
          if (section) {
            setPhotos(section.photos.map(url => ({ src: { original: url } })));
          }
        }
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const handleAddPhotos = () => {
    setShowPexelsPicker(true);
  };

  const handleSelectPhotos = async (newPhotos: PexelsPhoto[]) => {
    const updatedPhotos = [...photos, ...newPhotos];
    setPhotos(updatedPhotos);
    setShowPexelsPicker(false);

    // Immediately save to AsyncStorage
    try {
      const storedBoards = await AsyncStorage.getItem('vision_boards');
      if (storedBoards) {
        const boards: VisionBoard[] = JSON.parse(storedBoards);
        const currentBoard = boards.find(b => b.id === boardId);
        if (currentBoard) {
          const updatedSections = currentBoard.sections.map(section =>
            section.id === sectionId 
              ? { 
                  ...section, 
                  photos: updatedPhotos.map(p => p.src?.large || p.src?.medium || p.src?.original),
                  layout: undefined // Force layout regeneration
                }
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
        }
      }
    } catch (error) {
      console.error('Error saving photos:', error);
    }
  };

  const handleRemovePhoto = (index: number) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => {
            setPhotos(photos.filter((_, i) => i !== index));
            const newCaptions = { ...captions };
            delete newCaptions[index];
            setCaptions(newCaptions);
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
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
              ? { 
                  ...section, 
                  photos: photos.map(p => p.src?.large || p.src?.medium || p.src?.original),
                  description,
                  captions,
                  layout: undefined // Force layout regeneration
                }
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
          
          // Navigate back to VisionBoardSections and force a refresh
          navigation.navigate('VisionBoardSections', { 
            boardId,
            refresh: Date.now() // Add a timestamp to force refresh
          });
        }
      }
    } catch (error) {
      console.error('Error saving photos:', error);
    }
  };

  const handleDeleteSection = async () => {
    Alert.alert(
      'Delete Section',
      'Are you sure you want to delete this section?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
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
                  const updatedSections = currentBoard.sections.filter(s => s.id !== sectionId);
                  const updatedBoard = { ...currentBoard, sections: updatedSections };
                  const updatedBoards = boards.map(b => b.id === boardId ? updatedBoard : b);
                  await AsyncStorage.setItem('vision_boards', JSON.stringify(updatedBoards));
                  navigation.navigate('VisionBoardSections', { boardId });
                }
              }
            } catch (error) {
              console.error('Error deleting section:', error);
            }
          }
        }
      ]
    );
  };

  const renderMenu = () => (
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
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              navigation.navigate('VisionBoardEditSectionName', { 
                boardId,
                sectionId,
                currentName: sectionName
              });
            }}
          >
            <Text style={styles.menuItemText}>Edit Section's Name</Text>
            <MaterialCommunityIcons name="pencil" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={[styles.menuItem, styles.deleteItem]}
            onPress={() => {
              setShowMenu(false);
              handleDeleteSection();
            }}
          >
            <Text style={[styles.menuItemText, styles.deleteText]}>Delete Section</Text>
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF4B4B" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <LinearGradient 
      colors={['#0F172A', '#1E3A5F', '#2D5F7C']} 
      style={styles.container}
      start={{x: 0.5, y: 0}}
      end={{x: 0.5, y: 1}}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="chevron-left" size={32} color="#D4AF37" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>{sectionName}</Text>
          </View>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setShowMenu(true)}
          >
            <MaterialCommunityIcons name="dots-horizontal" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView style={styles.content}>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Add description..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              multiline
              value={description}
              onChangeText={setDescription}
            />
            
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image 
                  source={{ uri: photo.src.large || photo.src.medium || photo.src.original }}
                  style={styles.photo}
                />
                <TouchableOpacity 
                  style={styles.removePhotoButton}
                  onPress={() => handleRemovePhoto(index)}
                >
                  <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <TextInput
                  style={styles.captionInput}
                  placeholder="Add caption..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={captions[index]}
                  onChangeText={(text) => setCaptions({ ...captions, [index]: text })}
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.bottomButtons}>
            <TouchableOpacity 
              style={styles.addPhotosButton}
              onPress={handleAddPhotos}
            >
              <MaterialCommunityIcons name="image-plus" size={24} color="#FFFFFF" />
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

        <PexelsImagePicker
          visible={showPexelsPicker}
          onClose={() => setShowPexelsPicker(false)}
          onSelectPhotos={handleSelectPhotos}
          initialSearchTerm={sectionName}
        />
        {renderMenu()}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
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
    color: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  descriptionInput: {
    fontSize: 17,
    color: '#FFFFFF',
    marginBottom: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    minHeight: 100,
  },
  photoContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionInput: {
    fontSize: 15,
    color: '#FFFFFF',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  bottomButtons: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 50,
    gap: 12,
    justifyContent: 'flex-end',
  },
  addPhotosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    padding: 12,
    borderRadius: 8,
    width: '45%',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  addPhotosText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    padding: 12,
    borderRadius: 8,
    width: '45%',
  },
  doneButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    width: '80%',
    maxWidth: 300,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  deleteText: {
    color: '#FF4B4B',
  },
  deleteItem: {
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderTopWidth: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VisionBoardSectionPhotosScreen; 