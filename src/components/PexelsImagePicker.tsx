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
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { PEXELS_API_KEY } from '@env';
import { launchImageLibrary } from 'react-native-image-picker';

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
  onSelectPhotos: (photos: PexelsPhoto[]) => void;
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
          item.word.split(' ').map((word: string) => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
        );
        console.log('Processed suggestions:', suggestions);
        setRelatedSearches(suggestions);
      } else {
        console.error('Datamuse API error:', suggestionsResponse.status);
      }

      // Log the headers being sent with Bearer token
      console.log('Sending request to Pexels with headers:', {
        'Authorization': `Bearer ${PEXELS_API_KEY}`
      });

      // Fetch photos from Pexels
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=30`,
        {
          method: 'GET',
          headers: {
            'Authorization': PEXELS_API_KEY,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Pexels API error details:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Pexels response:', data);
      setPhotos(data.photos || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      Alert.alert(
        'Error',
        'Failed to fetch photos. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTagPress = (tag: string) => {
    console.log('Tag pressed:', tag);
    setSearchTerm(tag);
    searchPhotos(tag);
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
      // Check if adding would exceed the limit
      if (prev.length >= 10) {
        Alert.alert(
          'Photo Limit Reached',
          'You can only add up to 10 photos per section.',
          [{ text: 'OK', style: 'default' }]
        );
        return prev;
      }
      return [...prev, photoUrl];
    });
  };

  const handleAddPhotos = () => {
    const selectedPexelsPhotos = photos.filter(photo => 
      selectedPhotos.includes(photo.src.original)
    );
    onSelectPhotos(selectedPexelsPhotos);
    setSelectedPhotos([]);
    onClose();
  };

  const handleAddFromPhone = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 10 - selectedPhotos.length,
        quality: 1,
      });

      console.log('Image picker result:', result);

      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (result.errorCode) {
        console.error('ImagePicker Error:', result.errorMessage);
        Alert.alert(
          'Error',
          result.errorMessage || 'Failed to pick image from your phone',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      if (result.assets && result.assets.length > 0) {
        console.log('Selected assets:', result.assets);
        const newPhotos: PexelsPhoto[] = result.assets.map(asset => ({
          id: asset.fileName || Date.now().toString(),
          src: {
            medium: asset.uri || '',
            original: asset.uri || '',
          }
        }));

        // Add new photos to the photos array
        setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
        
        // Auto-select the newly added photos
        newPhotos.forEach(photo => {
          if (selectedPhotos.length < 10) {
            togglePhotoSelection(photo.src.original);
          }
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        'Error',
        'Failed to pick image from your phone. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const renderPhoto = ({ item }: { item: PexelsPhoto }) => {
    const isSelected = selectedPhotos.includes(item.src.original);
    const isDisabled = !isSelected && selectedPhotos.length >= 10;

    return (
      <TouchableOpacity
        style={[
          styles.photoItem,
          isSelected && styles.selectedPhotoItem,
          isDisabled && styles.disabledPhotoItem,
        ]}
        onPress={() => togglePhotoSelection(item.src.original)}
        disabled={isDisabled}
      >
        <Image source={{ uri: item.src.medium }} style={styles.photo} />
        {isSelected && (
          <View style={styles.checkmark}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#FFD700" />
          </View>
        )}
        {isDisabled && (
          <View style={styles.disabledOverlay}>
            <Text style={styles.disabledText}>Limit Reached</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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

        <View style={styles.tagsSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagScrollContent}
          >
            {relatedSearches.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagButton,
                  searchTerm === tag && styles.tagButtonActive
                ]}
                onPress={() => handleTagPress(tag)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.tagText,
                  searchTerm === tag && styles.tagTextActive
                ]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.poweredByContainer}>
          <Text style={styles.poweredByText}>Powered by Pexels™</Text>
          <TouchableOpacity 
            style={styles.addFromPhone}
            onPress={handleAddFromPhone}
          >
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
  tagsSection: {
    height: 60,
    marginBottom: 24,
  },
  tagButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tagButtonActive: {
    backgroundColor: '#FF4B8C',
  },
  tagText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
  },
  tagTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  tagScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  disabledPhotoItem: {
    opacity: 0.5,
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PexelsImagePicker; 