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
import { RootStackParamList } from '../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { VisionBoard } from './VisionBoardScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'EditSectionName'>;

const EditSectionNameScreen: React.FC<Props> = ({ navigation, route }) => {
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
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Error updating section name:', error);
      Alert.alert('Error', 'Failed to update section name');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={32} color="#FF4B8C" />
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
          placeholderTextColor="#999999"
          autoFocus
          maxLength={50}
        />
      </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
    marginLeft: 40, // To center the title accounting for the save button
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveText: {
    color: '#FF4B8C',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  input: {
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingVertical: 8,
    color: '#000000',
  },
});

export default EditSectionNameScreen; 