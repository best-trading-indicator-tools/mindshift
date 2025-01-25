import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { VisionBoard } from './VisionBoardScreen';
import LinearGradient from 'react-native-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'VisionBoardEditSectionName'>;

const VisionBoardEditSectionNameScreen: React.FC<Props> = ({ navigation, route }) => {
  const { boardId, sectionId, currentName } = route.params;
  const [newName, setNewName] = useState(currentName);

  const handleSave = async () => {
    if (!newName?.trim()) {
      Alert.alert('Error', 'Please enter a section name');
      return;
    }

    try {
      const storedBoards = await AsyncStorage.getItem('vision_boards');
      if (storedBoards) {
        const boards: VisionBoard[] = JSON.parse(storedBoards);
        const currentBoard = boards.find(b => b.id === boardId);
        if (currentBoard) {
          const updatedSections = currentBoard.sections.map(section => 
            section.id === sectionId ? { ...section, name: newName.trim() } : section
          );
          const updatedBoard = { ...currentBoard, sections: updatedSections };
          const updatedBoards = boards.map(b => b.id === boardId ? updatedBoard : b);
          await AsyncStorage.setItem('vision_boards', JSON.stringify(updatedBoards));
          navigation.navigate('VisionBoardSections', { 
            boardId, 
            refresh: Date.now() 
          });
        }
      }
    } catch (error) {
      console.error('Error updating section name:', error);
      Alert.alert('Error', 'Failed to update section name');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient 
        colors={['#0F172A', '#1E3A5F', '#2D5F7C']} 
        style={styles.container}
        start={{x: 0.5, y: 0}}
        end={{x: 0.5, y: 1}}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="chevron-left" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Section Name</Text>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder="Enter section name"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            autoFocus
            maxLength={50}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginLeft: 40,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  input: {
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    color: '#FFFFFF',
  },
});

export default VisionBoardEditSectionNameScreen; 