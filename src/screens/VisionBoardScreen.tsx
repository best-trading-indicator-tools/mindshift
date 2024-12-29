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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';

export interface VisionBoardSection {
  id: string;
  name: string;
  photos: string[];
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
        setVisionBoards(JSON.parse(storedBoards));
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
            style={styles.boardCard}
            onPress={() => navigation.navigate('VisionBoardSections', { boardId: board.id })}
          >
            <View style={styles.boardHeader}>
              <Text style={styles.boardName}>{board.name}</Text>
              <Text style={styles.sectionCount}>{board.sections.length} Sections</Text>
            </View>
            <View style={styles.boardActions}>
              <TouchableOpacity
                onPress={() => {
                  setEditingBoard(board);
                  setShowEditModal(true);
                }}
              >
                <MaterialCommunityIcons name="pencil" size={24} color="#6366f1" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteBoard(board)}>
                <MaterialCommunityIcons name="delete" size={24} color="#FF4B8C" />
              </TouchableOpacity>
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
    backgroundColor: '#121212',
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
    backgroundColor: '#6366f1',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  boardCard: {
    backgroundColor: '#1E1E3D',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  boardHeader: {
    marginBottom: 12,
  },
  boardName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionCount: {
    fontSize: 16,
    color: '#888888',
    marginTop: 4,
  },
  boardActions: {
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
    marginBottom: 24,
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

export default VisionBoardScreen; 