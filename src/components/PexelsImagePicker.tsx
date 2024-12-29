import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { PEXELS_API_KEY } from '@env';

interface PexelsPhoto {
  id: string;
  src: {
    medium: string;
    original: string;
  };
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectPhotos: (photos: string[]) => void;
  initialSearchTerm: string;
}

const PexelsImagePicker: React.FC<Props> = ({
  visible,
  onClose,
  onSelectPhotos,
  initialSearchTerm,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [relatedSearches, setRelatedSearches] = useState<string[]>([]);

  const searchPhotos = async (query: string) => {
    try {
      setLoading(true);
      
      // Get related terms from Datamuse API
      console.log('Fetching suggestions for:', query);
      const suggestionsResponse = await fetch(
        `https://api.datamuse.com/words?ml=${encodeURIComponent(query)}&max=7`
      );
      if (suggestionsResponse.ok) {
        const suggestionsData = await suggestionsResponse.json();
        console.log('Datamuse response:', suggestionsData);
        const suggestions = suggestionsData.map((item: { word: string }) => 
          // Capitalize first letter of each word
          item.word.split(' ').map((word: string) => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
        );
        console.log('Processed suggestions:', suggestions);
        setRelatedSearches(suggestions);
      } else {
        console.error('Datamuse API error:', suggestionsResponse.status);
      }

      // Fetch photos from Pexels
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=30`,
        {
          headers: {
            'Authorization': PEXELS_API_KEY,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && initialSearchTerm) {
      setSearchTerm(initialSearchTerm);
      searchPhotos(initialSearchTerm);
    }
  }, [visible, initialSearchTerm]);

  const togglePhotoSelection = (photoUrl: string) => {
    setSelectedPhotos(prev => {
      if (prev.includes(photoUrl)) {
        return prev.filter(url => url !== photoUrl);
      }
      return [...prev, photoUrl];
    });
  };

  const handleAddPhotos = () => {
    onSelectPhotos(selectedPhotos);
    setSelectedPhotos([]);
    onClose();
  };

  const renderPhoto = ({ item }: { item: PexelsPhoto }) => (
    <TouchableOpacity
      style={[
        styles.photoItem,
        selectedPhotos.includes(item.src.original) && styles.selectedPhotoItem,
      ]}
      onPress={() => togglePhotoSelection(item.src.original)}
    >
      <Image source={{ uri: item.src.medium }} style={styles.photo} />
      {selectedPhotos.includes(item.src.original) && (
        <View style={styles.checkmark}>
          <MaterialCommunityIcons name="check-circle" size={24} color="#FFD700" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderSelectedThumbnail = (uri: string, index: number) => (
    <View key={uri} style={styles.thumbnailContainer}>
      <Image source={{ uri }} style={styles.thumbnail} />
      <TouchableOpacity
        style={styles.removeThumbnail}
        onPress={() => togglePhotoSelection(uri)}
      >
        <MaterialCommunityIcons name="close-circle" size={20} color="#000" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="chevron-left" size={32} color="#FF4B8C" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Photos</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={24} color="#666" />
            <TextInput
              style={styles.searchInput}
              value={searchTerm}
              onChangeText={(text) => {
                setSearchTerm(text);
                if (text.length > 2) {
                  searchPhotos(text);
                }
              }}
              placeholder="Search photos..."
            />
            {searchTerm ? (
              <TouchableOpacity
                onPress={() => {
                  setSearchTerm('');
                  searchPhotos('');
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <ScrollView horizontal style={styles.tagsContainer} showsHorizontalScrollIndicator={false}>
          {relatedSearches.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.tagButton}
              onPress={() => {
                setSearchTerm(tag);
                searchPhotos(tag);
              }}
            >
              <Text style={styles.tagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.poweredByContainer}>
          <Text style={styles.poweredByText}>Powered by Pexels™</Text>
          <TouchableOpacity style={styles.addFromPhone}>
            <MaterialCommunityIcons name="plus" size={20} color="#000" />
            <Text style={styles.addFromPhoneText}>Add from Phone</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
        ) : (
          <FlatList
            data={photos}
            renderItem={renderPhoto}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.photosGrid}
          />
        )}

        {selectedPhotos.length > 0 && (
          <View style={styles.bottomBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.selectedPhotosContainer}
            >
              {selectedPhotos.map((uri, index) => renderSelectedThumbnail(uri, index))}
            </ScrollView>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddPhotos}
            >
              <MaterialCommunityIcons name="arrow-right" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
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
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  tagsContainer: {
    paddingVertical: 8,
    paddingBottom: 26,
    marginBottom: 16,
  },
  tagButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    marginLeft: 16,
    minWidth: 80,
    alignItems: 'center',
    height: 36,
  },
  tagText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
  },
  poweredByContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  poweredByText: {
    color: '#666',
    fontSize: 14,
  },
  addFromPhone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addFromPhoneText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#000000',
  },
  photosGrid: {
    padding: 8,
  },
  photoItem: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedPhotoItem: {
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  loader: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  selectedPhotosContainer: {
    flex: 1,
    paddingTop: 8,
  },
  thumbnailContainer: {
    marginRight: 8,
    position: 'relative',
    marginTop: 4,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeThumbnail: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  addButton: {
    backgroundColor: '#FFD700',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});

export default PexelsImagePicker; 