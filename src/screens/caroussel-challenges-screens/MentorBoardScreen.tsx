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
import { markChallengeExerciseAsCompleted, markDailyExerciseAsCompleted } from '../../utils/exerciseCompletion';
import { loadMentorBoards, saveMentorBoard, deleteMentorBoard } from '../../services/mentorBoardService';
import WikimediaImagePicker from '../../components/WikimediaImagePicker';
import DraggableCollage from '../../components/DraggableCollage';
import { runOnJS } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

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

const MentorBoardScreen: React.FC<Props> = ({ navigation, route }) => {
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
        if (route.params?.context === 'challenge' && route.params.challengeId) {
          await markChallengeExerciseAsCompleted(route.params.challengeId, 'mentor-board');
        } else {
          await markDailyExerciseAsCompleted('mentor-board');
        }
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
      
      // Use the appropriate completion function based on context
      if (route.params?.context === 'challenge' && route.params.challengeId) {
        await markChallengeExerciseAsCompleted(route.params.challengeId, 'mentor-board');
      } else {
        await markDailyExerciseAsCompleted('mentor-board');
      }
      
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
    <LinearGradient 
      colors={['#0F172A', '#1E3A5F', '#2D5F7C']} 
      style={styles.container}
      start={{x: 0.5, y: 0}}
      end={{x: 0.5, y: 1}}
    >
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Mentor Boards</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.exitButton}
              onPress={async () => {
                // Check if there's at least one board with mentors
                const hasCompletedBoard = mentorBoards.some(board => board.mentors.length > 0);
                
                if (hasCompletedBoard) {
                  if (route.params?.context === 'challenge' && route.params.challengeId) {
                    await markChallengeExerciseAsCompleted(route.params.challengeId, 'mentor-board');
                  } else {
                    await markDailyExerciseAsCompleted('mentor-board');
                  }
                }

                if ((route.params?.returnTo === 'ChallengeDetail' || route.params?.context === 'challenge') && route.params.challengeId) {
                  navigation.navigate('ChallengeDetail', {
                    challenge: {
                      id: route.params.challengeId,
                      title: 'Ultimate',
                      duration: 21,
                      description: 'Create your own board of mentors to inspire and guide you.',
                      image: require('../../assets/illustrations/challenges/challenge-21.png')
                    }
                  });
                } else {
                  navigation.navigate('MainTabs');
                }
              }}
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

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {mentorBoards.length === 0 ? (
            <TouchableOpacity 
              style={styles.emptyStateContainer}
              onPress={() => setShowNewBoardModal(true)}
            >
              <Image 
                source={require('../../assets/illustrations/mentorboard.jpg')}
                style={styles.emptyStateImage}
                resizeMode="contain"
              />
              <Text style={styles.emptyStateText}>Tap to create your first mentor board</Text>
            </TouchableOpacity>
          ) : (
            mentorBoards.map((board) => (
              <TouchableOpacity
                key={board.id}
                style={styles.boardCard}
                onPress={() => {
                  navigation.navigate('MentorBoardDetails', { 
                    boardId: board.id,
                    context: route.params?.context,
                    challengeId: route.params?.challengeId,
                    returnTo: route.params?.returnTo
                  });
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
                      <MaterialCommunityIcons name="plus" size={32} color="#000000" />
                      <Text style={[styles.emptyText, { color: '#000000', marginTop: 12 }]}>Click to add mentors</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
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
                
                // Mark exercise as completed when mentors are added
                if (updatedBoard.mentors.length > 0) {
                  if (route.params?.context === 'challenge' && route.params.challengeId) {
                    await markChallengeExerciseAsCompleted(route.params.challengeId, 'mentor-board');
                  } else {
                    await markDailyExerciseAsCompleted('mentor-board');
                  }
                }
                
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#D4AF37',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '600',
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
    backgroundColor: 'transparent',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  boardCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#FFFFFF',
  },
  mentorCount: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.7)',
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
    backgroundColor: '#1E293B',
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
    color: '#FFFFFF',
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#D4AF37',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  emptyStateImage: {
    width: '100%',
    height: 300,
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default MentorBoardScreen; 