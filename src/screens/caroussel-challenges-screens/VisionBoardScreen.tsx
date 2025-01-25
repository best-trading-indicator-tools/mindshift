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
import { RootStackParamList } from '../../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { LayoutTile } from '../../types/layout';
import { markExerciseAsCompleted } from '../../services/exerciseService';
import { markChallengeExerciseAsCompleted } from '../../utils/exerciseCompletion';
import LinearGradient from 'react-native-linear-gradient';
import { markCarouselExerciseAsCompleted } from '../../utils/exerciseCompletion';

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

const VisionBoardScreen: React.FC<Props> = ({ navigation, route }) => {
  const [visionBoards, setVisionBoards] = useState<VisionBoard[]>([]);
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<VisionBoard | null>(null);

  const handleExit = () => {
    if ((route.params?.returnTo === 'ChallengeDetail' || route.params?.context === 'challenge') && route.params.challengeId) {
      navigation.navigate('ChallengeDetail', {
        challenge: {
          id: route.params.challengeId,
          title: 'Ultimate',
          duration: 21,
          description: 'Visualize your dreams and manifest your future.',
          image: require('../../assets/illustrations/challenges/challenge-21.png')
        }
      });
    } else {
      navigation.navigate('MainTabs');
    }
  };

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
          if (route.params?.context === 'challenge' && route.params.challengeId) {
            await markChallengeExerciseAsCompleted(route.params.challengeId, 'vision-board');
          } else {
            await markCarouselExerciseAsCompleted('vision-board');
          }
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
    <LinearGradient 
      colors={['#0F172A', '#1E3A5F', '#2D5F7C']} 
      style={styles.container}
      start={{x: 0.5, y: 0}}
      end={{x: 0.5, y: 1}}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Vision Boards</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.exitButton}
              onPress={handleExit}
            >
              <Text style={styles.exitText}>Exit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowNewBoardModal(true)}
            >
              <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentContainer}>
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
                    navigation.navigate('NewVisionBoardSection', { 
                      boardId: board.id,
                      context: route.params?.context,
                      challengeId: route.params?.challengeId,
                      returnTo: route.params?.returnTo
                    });
                  } else {
                    navigation.navigate('VisionBoardSections', { 
                      boardId: board.id,
                      context: route.params?.context,
                      challengeId: route.params?.challengeId,
                      returnTo: route.params?.returnTo
                    });
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
        </View>

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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
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
    color: '#FFFFFF',
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#D4AF37',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: 'transparent',
    paddingBottom: 100,
  },
  boardCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionCount: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
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
    backgroundColor: '#D4AF37',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    paddingTop: 12,
    margin: 20,
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
    color: '#FFFFFF',
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#D4AF37',
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
    backgroundColor: '#D4AF37',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  exitText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '600',
  },
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boardCardEmpty: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default VisionBoardScreen; 