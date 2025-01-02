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
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { MentorBoard } from '../../types/mentorBoard';
import { markExerciseAsCompleted } from '../../services/exerciseService';
import { loadMentorBoards, saveMentorBoard, deleteMentorBoard } from '../../services/mentorBoardService';
import WikimediaImagePicker from '../../components/WikimediaImagePicker';
import DraggableCollage from '../../components/DraggableCollage';
import { runOnJS } from 'react-native-reanimated';

const DEFAULT_COLORS = [
  '#FFFFFF', // White
  '#F3F4F6', // Light Gray
  '#E5E7EB', // Gray
  '#FEF3C7', // Light Yellow
  '#DBEAFE', // Light Blue
  '#F3E8FF', // Light Purple
  '#ECFDF5', // Light Green
  '#FEE2E2', // Light Red
];

type Props = NativeStackScreenProps<RootStackParamList, 'MentorBoard'>;

const MentorBoardScreen: React.FC<Props> = ({ navigation }) => {
  const [mentorBoards, setMentorBoards] = useState<MentorBoard[]>([]);
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<MentorBoard | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<MentorBoard | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');

  useFocusEffect(
    React.useCallback(() => {
      loadBoards();
    }, [])
  );

  useEffect(() => {
    mentorBoards.forEach(board => {
      console.log(`Board ${board.name} has ${board.mentors.length} mentors:`, board.mentors);
    });
  }, [mentorBoards]);

  const loadBoards = async () => {
    try {
      console.log('Loading boards...');
      const boards = await loadMentorBoards();
      console.log('Loaded boards:', boards);
      setMentorBoards(boards);
      
      // Check if we should mark exercise as completed
      const hasCompletedBoard = boards.some(board => board.mentors.length > 0);
      if (hasCompletedBoard) {
        await markExerciseAsCompleted('mentor-board', 'Mentor Board');
      }
    } catch (error) {
      console.error('Error loading mentor boards:', error);
      Alert.alert('Error', 'Failed to load mentor boards. Please try again.');
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;

    try {
      const newBoard: MentorBoard = {
        id: Date.now().toString(),
        name: newBoardName.trim(),
        mentors: [],
        createdAt: new Date().toISOString(),
      };

      await saveMentorBoard(newBoard);
      await loadBoards();
      setShowNewBoardModal(false);
      setNewBoardName('');
    } catch (error) {
      console.error('Error creating mentor board:', error);
    }
  };

  const handleEditBoard = async () => {
    if (!editingBoard || !editingBoard.name.trim()) return;

    try {
      await saveMentorBoard(editingBoard);
      await loadBoards();
      setShowEditModal(false);
      setEditingBoard(null);
    } catch (error) {
      console.error('Error updating mentor board:', error);
    }
  };

  const handleDeleteBoard = async (board: MentorBoard) => {
    Alert.alert(
      'Delete Mentor Board',
      `Are you sure you want to delete "${board.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMentorBoard(board.id);
              await loadBoards();
            } catch (error) {
              console.error('Error deleting mentor board:', error);
            }
          },
        },
      ]
    );
  };

  const handleColorSelect = async (color: string) => {
    setSelectedColor(color);
    await AsyncStorage.setItem('mentor_board_background', color);
    setShowColorPicker(false);
  };

  useEffect(() => {
    const loadSavedColor = async () => {
      const savedColor = await AsyncStorage.getItem('mentor_board_background');
      if (savedColor) {
        setSelectedColor(savedColor);
      }
    };
    loadSavedColor();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mentor Boards</Text>
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
            <Text style={styles.exitButtonText}>Exit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowNewBoardModal(true)}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {mentorBoards.map((board) => (
          <TouchableOpacity
            key={board.id}
            style={styles.boardCard}
            onPress={() => {
              navigation.navigate('MentorBoardDetails', { boardId: board.id });
            }}
          >
            <View style={styles.boardHeader}>
              <View style={styles.boardTitleSection}>
                <Text style={styles.boardName}>{board.name}</Text>
                <Text style={styles.mentorCount}>{board.mentors.length} Mentors</Text>
              </View>
              <View style={styles.boardActions}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setEditingBoard(board);
                    setShowEditModal(true);
                  }}
                >
                  <MaterialCommunityIcons name="pencil" size={24} color="#666666" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteBoard(board);
                  }}
                >
                  <MaterialCommunityIcons name="delete" size={24} color="#E31837" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setShowColorPicker(true);
                  }}
                >
                  <MaterialCommunityIcons name="dots-horizontal" size={24} color="#666666" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.mentorPreview}>
              {board.mentors.length > 0 ? (
                <DraggableCollage 
                  key={`${board.id}-${board.mentors.length}`}
                  mentors={board.mentors} 
                  containerHeight={500}
                  backgroundColor={selectedColor}
                  onReorder={async (newOrder) => {
                    const updatedBoard = {
                      ...board,
                      mentors: newOrder,
                    };
                    
                    // First update local state
                    runOnJS(setMentorBoards)(prevBoards => 
                      prevBoards.map(b => 
                        b.id === board.id ? updatedBoard : b
                      )
                    );
                    
                    // Then save to storage
                    await runOnJS(saveMentorBoard)(updatedBoard);
                  }}
                />
              ) : (
                <TouchableOpacity 
                  style={[styles.emptyPreview, { backgroundColor: selectedColor, height: 500 }]}
                  onPress={() => {
                    setSelectedBoard(board);
                    setShowImagePicker(true);
                  }}
                >
                  <Text style={styles.emptyText}>Tap to add mentors</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
              <Text style={styles.modalTitle}>Create New Mentor Board</Text>
              <TextInput
                style={styles.input}
                value={newBoardName}
                onChangeText={setNewBoardName}
                placeholder="Mentor Board Name"
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
          <View style={[styles.modalContent, styles.editModalContent]}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Edit Mentor Board</Text>
            <TextInput
              style={styles.input}
              value={editingBoard?.name || ''}
              onChangeText={(text) => editingBoard && setEditingBoard({...editingBoard, name: text})}
              placeholder="Board Name"
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

      {/* Wikimedia Image Picker */}
      {selectedBoard && (
        <WikimediaImagePicker
          visible={showImagePicker}
          onClose={() => {
            setShowImagePicker(false);
            setSelectedBoard(null);
          }}
          onSelectMentors={async (mentors) => {
            if (!selectedBoard) return;
            
            try {
              console.log('Current board:', selectedBoard);
              console.log('Adding mentors:', mentors);
              
              // Get the latest board state to ensure we have the most recent mentors
              const boards = await loadMentorBoards();
              const currentBoard = boards.find(b => b.id === selectedBoard.id);
              
              if (!currentBoard) {
                throw new Error('Board not found');
              }

              // Check if adding these mentors would exceed the limit
              if (currentBoard.mentors.length + mentors.length > 15) {
                Alert.alert(
                  'Mentor Limit Reached',
                  `You can only have up to 15 mentors per board. You currently have ${currentBoard.mentors.length} mentors and are trying to add ${mentors.length} more.`
                );
                return;
              }
              
              const updatedBoard = {
                ...currentBoard,
                mentors: [...currentBoard.mentors, ...mentors],
              };
              console.log('Updated board:', updatedBoard);
              
              // Save to storage first
              await saveMentorBoard(updatedBoard);
              
              // Then update local state
              setMentorBoards(prevBoards => 
                prevBoards.map(board => 
                  board.id === updatedBoard.id ? updatedBoard : board
                )
              );
              
              setShowImagePicker(false);
              setSelectedBoard(null);
            } catch (error) {
              console.error('Error adding mentors:', error);
              Alert.alert('Error', 'Failed to add mentors. Please try again.');
            }
          }}
        />
      )}

      {/* Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowColorPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Choose Background Color</Text>
            <View style={styles.colorGrid}>
              {DEFAULT_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    color === selectedColor && styles.selectedColor,
                  ]}
                  onPress={() => handleColorSelect(color)}
                />
              ))}
            </View>
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
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exitButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#FCD34D',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  boardCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
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
  },
  boardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  boardTitleSection: {
    flex: 1,
  },
  boardName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  mentorCount: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  mentorPreview: {
    width: '100%',
    minHeight: 100,
    marginVertical: 8,
  },
  emptyPreview: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  emptyText: {
    color: '#666666',
    fontSize: 16,
  },
  boardActions: {
    flexDirection: 'row',
    gap: 16,
    marginLeft: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    minHeight: 200,
    width: '100%',
  },
  editModalContent: {
    minHeight: 0,
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
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#E31837',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 40,
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  colorButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
});

export default MentorBoardScreen; 