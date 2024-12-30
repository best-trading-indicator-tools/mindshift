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
import { RootStackParamList } from '../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { MentorBoard } from '../types/mentorBoard';
import { markExerciseAsCompleted } from '../services/exerciseService';
import { loadMentorBoards, saveMentorBoard, deleteMentorBoard } from '../services/mentorBoardService';
import WikimediaImagePicker from '../components/WikimediaImagePicker';

type Props = NativeStackScreenProps<RootStackParamList, 'MentorBoard'>;

const MentorBoardScreen: React.FC<Props> = ({ navigation }) => {
  const [mentorBoards, setMentorBoards] = useState<MentorBoard[]>([]);
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<MentorBoard | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<MentorBoard | null>(null);

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

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {mentorBoards.map((board) => (
          <TouchableOpacity
            key={board.id}
            style={styles.boardCard}
            onPress={() => {
              setSelectedBoard(board);
              setShowImagePicker(true);
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
                  <MaterialCommunityIcons name="pencil" size={24} color="#6366f1" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteBoard(board);
                  }}
                >
                  <MaterialCommunityIcons name="delete" size={24} color="#E31837" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.mentorPreview}>
              {board.mentors.map((mentor, index) => {
                let imageStyle;
                const totalMentors = board.mentors.length;
                
                if (totalMentors === 1) {
                  imageStyle = styles.mentorImage1;
                } else if (totalMentors === 2) {
                  imageStyle = styles.mentorImage2;
                } else if (totalMentors <= 3) {
                  imageStyle = styles.mentorImage3;
                } else if (totalMentors <= 4) {
                  imageStyle = styles.mentorImage4;
                } else if (totalMentors <= 6) {
                  imageStyle = styles.mentorImage6;
                } else if (totalMentors <= 9) {
                  imageStyle = styles.mentorImage9;
                } else {
                  imageStyle = styles.mentorImage12;
                }

                return (
                  <Image
                    key={mentor.id}
                    source={{ uri: mentor.url }}
                    style={[
                      styles.mentorThumbnail,
                      imageStyle,
                      { borderWidth: 1, borderColor: '#000' }
                    ]}
                    resizeMode="cover"
                    onError={(e) => console.error('Image load error:', mentor.url, e.nativeEvent.error)}
                    onLoad={() => console.log('Image loaded successfully:', mentor.url)}
                  />
                );
              })}
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
          <View style={styles.modalContent}>
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
              
              const updatedBoard = {
                ...selectedBoard,
                mentors: [...selectedBoard.mentors, ...mentors],
              };
              console.log('Updated board:', updatedBoard);
              
              await saveMentorBoard(updatedBoard);
              setShowImagePicker(false);
              setSelectedBoard(null);
              // Force immediate state update
              setMentorBoards(prevBoards => {
                const newBoards = prevBoards.map(board => 
                  board.id === updatedBoard.id ? updatedBoard : board
                );
                console.log('New boards state:', newBoards);
                return newBoards;
              });
              // Also reload from storage to ensure consistency
              await loadBoards();
            } catch (error) {
              console.error('Error adding mentors:', error);
              Alert.alert('Error', 'Failed to add mentors. Please try again.');
            }
          }}
        />
      )}
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
    padding: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#6366F1',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
    width: '100%',
    minHeight: 100,
  },
  mentorThumbnail: {
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  mentorImage1: {
    width: '100%',
    aspectRatio: 1,
    minHeight: 300,
  },
  mentorImage2: {
    width: '48.5%',
    aspectRatio: 1,
    minHeight: 150,
  },
  mentorImage3: {
    width: '32%',
    aspectRatio: 1,
    minHeight: 120,
  },
  mentorImage4: {
    width: '48.5%',
    aspectRatio: 1,
    minHeight: 150,
  },
  mentorImage6: {
    width: '32%',
    aspectRatio: 1,
    minHeight: 100,
  },
  mentorImage9: {
    width: '32%',
    aspectRatio: 1,
    minHeight: 100,
  },
  mentorImage12: {
    width: '23.5%',
    aspectRatio: 1,
    minHeight: 80,
  },
  boardActions: {
    flexDirection: 'row',
    gap: 16,
    marginLeft: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 200,
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
    backgroundColor: '#6366F1',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MentorBoardScreen; 