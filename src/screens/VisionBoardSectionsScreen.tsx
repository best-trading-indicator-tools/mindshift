import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { VisionBoard } from './VisionBoardScreen';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'VisionBoardSections'>;

const PLACEHOLDER_COLORS = {
  mint: '#E1F8E7',
  lavender: '#E8E6FF',
  peach: '#FFE8E1',
  yellow: '#FFF8E1',
};

interface PhotoPlaceholderProps {
  color: string;
  onPress: () => void;
}

const PhotoPlaceholder: React.FC<PhotoPlaceholderProps> = ({ color, onPress }) => (
  <TouchableOpacity 
    style={[styles.placeholder, { backgroundColor: color }]}
    onPress={onPress}
  >
    <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
  </TouchableOpacity>
);

const VisionBoardSectionsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { boardId } = route.params;
  const [board, setBoard] = React.useState<VisionBoard | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadBoard();
    }, [])
  );

  const loadBoard = async () => {
    try {
      const storedBoards = await AsyncStorage.getItem('vision_boards');
      if (storedBoards) {
        const boards: VisionBoard[] = JSON.parse(storedBoards);
        const currentBoard = boards.find(b => b.id === boardId);
        if (currentBoard) {
          setBoard(currentBoard);
        }
      }
    } catch (error) {
      console.error('Error loading board:', error);
    }
  };

  if (!board) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={32} color="#FF4B8C" />
        </TouchableOpacity>
        <Text style={styles.title}>{board.name}</Text>
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
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.boardInfo}>
          <View style={styles.photoInfo}>
            <Text style={styles.totalPhotos}>0 Photos</Text>
            <Text style={styles.seeAll}>See All</Text>
          </View>
        </View>

        {board.sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionName}>{section.name}</Text>
            <View style={styles.photoGrid}>
              <PhotoPlaceholder 
                color={PLACEHOLDER_COLORS.mint} 
                onPress={() => navigation.navigate('VisionBoardSection', { 
                  boardId: board.id,
                  sectionId: section.id,
                  sectionName: section.name,
                })}
              />
              <PhotoPlaceholder 
                color={PLACEHOLDER_COLORS.lavender}
                onPress={() => navigation.navigate('VisionBoardSection', { 
                  boardId: board.id,
                  sectionId: section.id,
                  sectionName: section.name,
                })}
              />
              <View style={styles.smallPhotos}>
                <PhotoPlaceholder 
                  color={PLACEHOLDER_COLORS.peach}
                  onPress={() => navigation.navigate('VisionBoardSection', { 
                    boardId: board.id,
                    sectionId: section.id,
                    sectionName: section.name,
                  })}
                />
                <PhotoPlaceholder 
                  color={PLACEHOLDER_COLORS.yellow}
                  onPress={() => navigation.navigate('VisionBoardSection', { 
                    boardId: board.id,
                    sectionId: section.id,
                    sectionName: section.name,
                  })}
                />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity 
        style={styles.newSectionButton}
        onPress={() => navigation.navigate('NewVisionBoardSection', { boardId: board.id })}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
        <Text style={styles.newSectionText}>New Section</Text>
      </TouchableOpacity>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  exitButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFD700',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  boardInfo: {
    marginBottom: 24,
  },
  photoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalPhotos: {
    fontSize: 16,
    color: '#666666',
  },
  seeAll: {
    fontSize: 16,
    color: '#FF4B8C',
  },
  section: {
    marginBottom: 24,
  },
  sectionName: {
    fontSize: 20,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 8,
    height: 200,
  },
  placeholder: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallPhotos: {
    flex: 1,
    gap: 8,
  },
  newSectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4B8C',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 100,
    position: 'absolute',
    bottom: 34,
    right: 24,
    gap: 8,
  },
  newSectionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default VisionBoardSectionsScreen; 