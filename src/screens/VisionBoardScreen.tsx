import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
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

type Props = NativeStackScreenProps<RootStackParamList, 'VisionBoard'>;

const VisionBoardScreen: React.FC<Props> = ({ navigation }) => {
  const [sections, setSections] = useState<VisionBoardSection[]>([]);

  const loadSections = async () => {
    try {
      const storedSections = await AsyncStorage.getItem('vision_board_sections');
      if (storedSections) {
        setSections(JSON.parse(storedSections));
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  // Use useFocusEffect instead of useEffect to reload sections when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadSections();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vision Board</Text>
      </View>

      <ScrollView style={styles.content}>
        {sections.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={styles.sectionButton}
            onPress={() => navigation.navigate('VisionBoardSection', { sectionId: section.id })}
          >
            <Text style={styles.sectionName}>{section.name}</Text>
            <Text style={styles.photoCount}>{section.photos.length} Photos</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.newSectionButton}
          onPress={() => navigation.navigate('NewVisionBoardSection')}
        >
          <Text style={styles.newSectionButtonText}>+ New Section</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.exitButton}
          onPress={() => navigation.navigate('MainTabs')}
        >
          <MaterialCommunityIcons name="exit-to-app" size={24} color="#000000" />
          <Text style={styles.exitButtonText}>Exit Vision Board</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionButton: {
    backgroundColor: '#1E1E3D',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  sectionName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  photoCount: {
    fontSize: 16,
    color: '#888888',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    gap: 12,
  },
  newSectionButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  newSectionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  exitButton: {
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 30,
    gap: 8,
  },
  exitButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default VisionBoardScreen; 