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
            <MaterialCommunityIcons name="pencil" size={20} color="#000000" />
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
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF0000" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

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
          <MaterialCommunityIcons name="dots-horizontal" size={24} color="#666666" />
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
                placeholderTextColor="#999999"
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
            <MaterialCommunityIcons name="image-plus" size={24} color="#FF4B4B" />
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
  headerRight: {
    width: 40,
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
    backgroundColor: '#000000',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionInput: {
    fontSize: 15,
    color: '#666666',
    padding: 16,
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
    backgroundColor: '#FFE4E4',
    padding: 12,
    borderRadius: 8,
    width: '45%',
  },
  addPhotosText: {
    color: '#FF4B4B',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF0000',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '80%',
    maxWidth: 300,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    color: '#000000',
  },
  deleteText: {
    color: '#FF0000',
  },
  deleteItem: {
    borderTopColor: '#E5E5E5',
    borderTopWidth: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
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