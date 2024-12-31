import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  Image,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MentorBoard, MentorImage } from '../types/mentorBoard';
import { loadMentorBoards, saveMentorBoard } from '../services/mentorBoardService';
import WikimediaImagePicker from '../components/WikimediaImagePicker';

type Props = NativeStackScreenProps<RootStackParamList, 'MentorBoardDetails'>;

const MentorBoardDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { boardId } = route.params;
  const [board, setBoard] = useState<MentorBoard | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  useEffect(() => {
    loadBoard();
  }, []);

  const loadBoard = async () => {
    try {
      const boards = await loadMentorBoards();
      const currentBoard = boards.find(b => b.id === boardId);
      if (currentBoard) {
        setBoard(currentBoard);
      }
    } catch (error) {
      console.error('Error loading board:', error);
      Alert.alert('Error', 'Failed to load mentor board');
    }
  };

  const handleDeleteMentor = async (mentorToDelete: MentorImage) => {
    if (!board) return;

    Alert.alert(
      'Delete Mentor',
      'Are you sure you want to remove this mentor from the board?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedBoard = {
                ...board,
                mentors: board.mentors.filter(mentor => mentor.id !== mentorToDelete.id),
              };
              await saveMentorBoard(updatedBoard);
              setBoard(updatedBoard);
            } catch (error) {
              console.error('Error deleting mentor:', error);
              Alert.alert('Error', 'Failed to delete mentor');
            }
          },
        },
      ]
    );
  };

  const renderMentorItem = ({ item: mentor }: { item: MentorImage }) => (
    <View style={styles.mentorItem}>
      <Image source={{ uri: mentor.url }} style={styles.mentorImage} />
      <View style={styles.mentorInfo}>
        <Text style={styles.mentorName}>{mentor.name}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteMentor(mentor)}
      >
        <MaterialCommunityIcons name="close" size={20} color="#666666" />
      </TouchableOpacity>
    </View>
  );

  if (!board) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>{board.name}</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={board.mentors}
        renderItem={renderMentorItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowImagePicker(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
          <Text style={[styles.buttonText, styles.addButtonText]}>Add Mentors</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.doneButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.buttonText, styles.doneButtonText]}>Done</Text>
        </TouchableOpacity>
      </View>

      <WikimediaImagePicker
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelectMentors={async (newMentors) => {
          if (!board) return;

          try {
            // Check if adding these mentors would exceed the limit
            if (board.mentors.length + newMentors.length > 15) {
              Alert.alert(
                'Mentor Limit Reached',
                `You can only have up to 15 mentors per board. You currently have ${board.mentors.length} mentors and are trying to add ${newMentors.length} more.`
              );
              return;
            }

            const updatedBoard = {
              ...board,
              mentors: [...board.mentors, ...newMentors],
            };
            await saveMentorBoard(updatedBoard);
            setBoard(updatedBoard);
            setShowImagePicker(false);
          } catch (error) {
            console.error('Error adding mentors:', error);
            Alert.alert('Error', 'Failed to add mentors');
          }
        }}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  mentorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  mentorImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  mentorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mentorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    zIndex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E31837',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  doneButton: {
    flex: 1,
    backgroundColor: '#FCD34D',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  doneButtonText: {
    color: '#000000',
  },
  addButtonText: {
    color: '#FFFFFF',
  },
});

export default MentorBoardDetailsScreen; 