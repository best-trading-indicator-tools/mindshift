import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import ExerciseIntroScreen from '../components/ExerciseIntroScreen';
import { createClient, Photos, ErrorResponse } from 'pexels';
import Config from 'react-native-config';

type Props = NativeStackScreenProps<RootStackParamList, 'VisionBoard'>;

// Initialize Pexels client with API key from environment variables
const pexelsClient = createClient(Config.PEXELS_API_KEY || '');

interface PexelsPhoto {
  id: number;
  src: {
    medium: string;
  };
  section?: string;
}

const VisionBoardScreen: React.FC<Props> = ({ navigation }) => {
  const [showIntro, setShowIntro] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<PexelsPhoto[]>([]);
  const [currentSection, setCurrentSection] = useState('');
  const [sections, setSections] = useState<string[]>([]);

  const searchPhotos = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await pexelsClient.photos.search({
        query: searchQuery,
        per_page: 20,
      });
      
      if ('photos' in response) {
        setPhotos(response.photos.map(photo => ({
          id: photo.id,
          src: { medium: photo.src.medium }
        })));
      } else {
        console.error('Error fetching photos:', response);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (photo: PexelsPhoto) => {
    if (selectedPhotos.find(p => p.id === photo.id)) {
      setSelectedPhotos(selectedPhotos.filter(p => p.id !== photo.id));
    } else {
      setSelectedPhotos([...selectedPhotos, { ...photo, section: currentSection }]);
    }
  };

  const handleAddSection = () => {
    if (currentSection && !sections.includes(currentSection)) {
      setSections([...sections, currentSection]);
      setCurrentSection('');
    }
  };

  if (showIntro) {
    return (
      <ExerciseIntroScreen
        title="Vision Board"
        description={
          "Create a visual representation of your goals and dreams.\n\n" +
          "Search for inspiring images that represent what you want to achieve.\n\n" +
          "Organize them into sections like Career, Health, Travel, etc."
        }
        buttonText="Start Creating"
        onStart={() => setShowIntro(false)}
        onExit={() => navigation.goBack()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Vision Board</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.sectionInput}>
          <TextInput
            style={styles.input}
            placeholder="Add a new section (e.g., Career, Health)"
            placeholderTextColor="#666"
            value={currentSection}
            onChangeText={setCurrentSection}
          />
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddSection}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section}</Text>
            <View style={styles.photoGrid}>
              {selectedPhotos
                .filter(photo => photo.section === section)
                .map((photo, photoIndex) => (
                  <Image
                    key={photoIndex}
                    source={{ uri: photo.src.medium }}
                    style={styles.selectedPhoto}
                  />
                ))}
            </View>
          </View>
        ))}

        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for images..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchPhotos}
          />
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={searchPhotos}
          >
            <MaterialCommunityIcons name="magnify" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6366f1" />
        ) : (
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handlePhotoSelect(photo)}
                style={[
                  styles.photoContainer,
                  selectedPhotos.find(p => p.id === photo.id) && styles.selectedPhotoContainer
                ]}
              >
                <Image
                  source={{ uri: photo.src.medium }}
                  style={styles.photo}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionInput: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  searchSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -4,
  },
  photoContainer: {
    width: (Dimensions.get('window').width - 40) / 2,
    height: (Dimensions.get('window').width - 40) / 2,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedPhotoContainer: {
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  selectedPhoto: {
    width: (Dimensions.get('window').width - 40) / 2,
    height: (Dimensions.get('window').width - 40) / 2,
    margin: 4,
    borderRadius: 8,
  },
});

export default VisionBoardScreen; 