import React, { useState } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { LayoutTile } from '../types/layout';
import { markExerciseAsCompleted } from '../services/exerciseService';

export interface VisionBoardSection {
  id: string;
  name: string;
  photos: string[];
  description?: string;
  captions?: { [key: string]: string };
  layout?: LayoutTile[];
}

export interface VisionBoard {
  id: string;
  name: string;
  sections: VisionBoardSection[];
  createdAt: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'VisionBoard'>;

const VisionBoardScreen: React.FC<Props> = ({ navigation }) => {
  const [visionBoards, setVisionBoards] = useState<VisionBoard[]>([]);
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<VisionBoard | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadVisionBoards();
    }, [])
  );

  const loadVisionBoards = async () => {
    try {
      const storedBoards = await AsyncStorage.getItem('vision_boards');
      if (storedBoards) {
        const boards: VisionBoard[] = JSON.parse(storedBoards);
        setVisionBoards(boards);
        
        // Check if we should mark exercise as completed
        const hasCompletedBoard = boards.some((board: VisionBoard) => board.sections.length > 0);
        if (hasCompletedBoard) {
          await markExerciseAsCompleted('vision-board', 'Vision Board');
        }
      }
    } catch (error) {
      console.error('Error loading vision boards:', error);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;

    try {
      const newBoard: VisionBoard = {
        id: Date.now().toString(),
        name: newBoardName.trim(),
        sections: [],
        createdAt: new Date().toISOString(),
      };

      const updatedBoards = [...visionBoards, newBoard];
      await AsyncStorage.setItem('vision_boards', JSON.stringify(updatedBoards));
      setVisionBoards(updatedBoards);
      setShowNewBoardModal(false);
      setNewBoardName('');
    } catch (error) {
      console.error('Error creating vision board:', error);
    }
  };

  const handleEditBoard = async () => {
    if (!editingBoard || !editingBoard.name.trim()) return;

    try {
      const updatedBoards = visionBoards.map(board => 
        board.id === editingBoard.id ? editingBoard : board
      );
      await AsyncStorage.setItem('vision_boards', JSON.stringify(updatedBoards));
      setVisionBoards(updatedBoards);
      setShowEditModal(false);
      setEditingBoard(null);
    } catch (error) {
      console.error('Error updating vision board:', error);
    }
  };

  const handleDeleteBoard = async (board: VisionBoard) => {
    Alert.alert(
      'Delete Vision Board',
      `Are you sure you want to delete "${board.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedBoards = visionBoards.filter(b => b.id !== board.id);
              await AsyncStorage.setItem('vision_boards', JSON.stringify(updatedBoards));
              setVisionBoards(updatedBoards);
            } catch (error) {
              console.error('Error deleting vision board:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vision Boards</Text>
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
            onPress={() => setShowNewBoardModal(true)}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {visionBoards.map((board) => (
          <TouchableOpacity
            key={board.id}
            style={[
              styles.boardCard,
              styles.boardCardWithImage,
              (!board.sections.length || !board.sections[0].photos.length) && styles.boardCardEmpty
            ]}
            onPress={() => {
              if (board.sections.length === 0) {
                navigation.navigate('NewVisionBoardSection', { boardId: board.id });
              } else {
                navigation.navigate('VisionBoardSections', { boardId: board.id });
              }
            }}
          >
            {board.sections.length > 0 && board.sections[0].photos.length > 0 ? (
              <Image
                source={{ uri: board.sections[0].photos[0] }}
                style={styles.previewImage}
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <MaterialCommunityIcons name="image-area" size={120} color="#666666" />
              </View>
            )}
            <View style={[
              styles.boardHeader,
              board.sections.length > 0 && board.sections[0].photos.length > 0 && styles.boardHeaderOverImage
            ]}>
              <View style={styles.boardTitleRow}>
                <View>
                  <Text style={[
                    styles.boardName,
                    board.sections.length > 0 && board.sections[0].photos.length > 0 && styles.textOverImage
                  ]}>{board.name}</Text>
                  <Text style={[
                    styles.sectionCount,
                    board.sections.length > 0 && board.sections[0].photos.length > 0 && styles.textOverImage
                  ]}>{board.sections.length} {board.sections.length <= 1 ? 'Section' : 'Sections'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => {
                    Alert.alert(
                      board.name,
                      '',
                      [
                        {
                          text: "Edit Board's Name",
                          onPress: () => {
                            setEditingBoard(board);
                            setShowEditModal(true);
                          }
                        },
                        {
                          text: 'Share With Friends',
                          onPress: () => {
                            // TODO: Implement share functionality
                          }
                        },
                        {
                          text: 'Delete Board',
                          style: 'destructive',
                          onPress: () => handleDeleteBoard(board)
                        },
                        {
                          text: 'Cancel',
                          style: 'cancel'
                        }
                      ]
                    );
                  }}
                >
                  <View style={[
                    styles.menuButtonCircle,
                    board.sections.length > 0 && board.sections[0].photos.length > 0 && styles.menuButtonOverImage
                  ]}>
                    <MaterialCommunityIcons 
                      name="dots-horizontal" 
                      size={20} 
                      color={board.sections.length > 0 && board.sections[0].photos.length > 0 ? "#FFFFFF" : "#666666"} 
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity 
        style={styles.createNewBoardButton}
        onPress={() => setShowNewBoardModal(true)}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" style={styles.createButtonIcon} />
        <Text style={styles.createNewBoardText}>Create a New Board</Text>
      </TouchableOpacity>

      {/* New Board Modal */}
      <Modal
        visible={showNewBoardModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewBoardModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNewBoardModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalContent}>
              <View style={styles.handle} />
              <Text style={styles.modalTitle}>Create New Vision Board</Text>
              <TextInput
                style={styles.input}
                value={newBoardName}
                onChangeText={setNewBoardName}
                placeholder="Vision Board 2025"
                placeholderTextColor="#666"
                autoFocus
              />
              <TouchableOpacity 
                style={[styles.createButton, !newBoardName.trim() && styles.createButtonDisabled]}
                onPress={handleCreateBoard}
                disabled={!newBoardName.trim()}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* Edit Board Modal */}
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
            <Text style={styles.modalTitle}>Edit Vision Board</Text>
            <TextInput
              style={styles.input}
              value={editingBoard?.name || ''}
              onChangeText={(text) => editingBoard && setEditingBoard({...editingBoard, name: text})}
              placeholder="Vision Board Name"
              placeholderTextColor="#666"
              autoFocus
            />
            <TouchableOpacity 
              style={[styles.createButton, !editingBoard?.name.trim() && styles.createButtonDisabled]}
              onPress={handleEditBoard}
              disabled={!editingBoard?.name.trim()}
            >
              <Text style={styles.createButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000000',
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#E31837',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  boardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
    padding: 0,
    height: 200,
  },
  boardCardWithImage: {
    padding: 0,
    height: 200,
  },
  previewImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  boardHeader: {
    padding: 20,
  },
  boardHeaderOverImage: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    height: '100%',
  },
  textOverImage: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  menuButtonOverImage: {
    borderColor: '#FFFFFF',
  },
  boardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  boardName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  sectionCount: {
    fontSize: 16,
    color: '#666666',
  },
  menuButton: {
    padding: 4,
  },
  menuButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#666666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createNewBoardButton: {
    backgroundColor: '#E31837',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  createButtonIcon: {
    marginRight: 8,
  },
  createNewBoardText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  keyboardAvoidingView: {
    width: '100%',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    paddingTop: 12,
    margin: 20,
    shadowColor: '#000',
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#000000',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#E31837',
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
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boardCardEmpty: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
});

export default VisionBoardScreen; 