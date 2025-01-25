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
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { searchWikimediaImages } from '../services/mentorBoardService';
import { WikimediaSearchResult, MentorImage } from '../types/mentorBoard';
import LinearGradient from 'react-native-linear-gradient';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectMentors: (mentors: MentorImage[]) => void;
  initialSearchTerm?: string;
}

interface WikidataSuggestion {
  label: string;
  description: string;
}

const WikimediaImagePicker: React.FC<Props> = ({
  visible,
  onClose,
  onSelectMentors,
  initialSearchTerm = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [results, setResults] = useState<WikimediaSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<WikimediaSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<WikidataSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (visible && initialSearchTerm) {
      handleSearch();
    }
    return () => {
      setSelectedImages([]);
    };
  }, [visible, initialSearchTerm]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);
    setShowSuggestions(false);
    setSuggestions([]);

    try {
      const searchResults = await searchWikimediaImages(searchTerm);
      setResults(searchResults);
    } catch (err) {
      setError('Failed to search images. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectImage = (image: WikimediaSearchResult) => {
    setSelectedImages(prev => {
      const isSelected = prev.some(selected => selected.pageid === image.pageid);
      if (isSelected) {
        return prev.filter(selected => selected.pageid !== image.pageid);
      } else {
        return [...prev, image];
      }
    });
  };

  const handleConfirmSelection = () => {
    console.log('Selected images:', selectedImages);
    const mentors = selectedImages.map(image => {
      const imageUrl = image.originalimage?.source || image.thumbnail?.source;
      if (!imageUrl) {
        console.error('No valid URL found for image:', image);
        return undefined;
      }

      const secureUrl = imageUrl.replace(/^http:/, 'https:');
      console.log('Original URL:', imageUrl);
      console.log('Secure URL:', secureUrl);

      const mentor: MentorImage = {
        id: Date.now().toString() + '-' + image.pageid,
        url: secureUrl,
        name: image.title.replace('File:', '').split('.')[0],
        description: '',
        source: 'Wikimedia Commons',
        sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(image.title.replace('File:', ''))}`,
      };
      console.log('Created mentor:', mentor);
      return mentor;
    }).filter((mentor): mentor is MentorImage => mentor !== undefined);

    console.log('Final mentors array:', mentors);
    if (mentors.length === 0) {
      Alert.alert('Error', 'No valid images selected');
      return;
    }

    onSelectMentors(mentors);
    
    setSelectedImages([]);
    setResults([]);
    setSearchTerm('');
  };

  const handleClose = () => {
    setSearchTerm(initialSearchTerm);
    setResults([]);
    setSelectedImages([]);
    onClose();
  };

  const fetchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // Using Wikidata API to search for people and fictional characters
      const url = `https://www.wikidata.org/w/api.php?` +
        `action=wbsearchentities&` +
        `search=${encodeURIComponent(query)}&` +
        `language=en&` +
        `limit=10&` +
        `format=json&` +
        `origin=*&` +
        `type=item`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const suggestions = data.search
          .filter((item: any) => item.description && (
            // Famous people categories
            item.description.toLowerCase().includes('actor') ||
            item.description.toLowerCase().includes('actress') ||
            item.description.toLowerCase().includes('entrepreneur') ||
            item.description.toLowerCase().includes('founder') ||
            item.description.toLowerCase().includes('character') ||
            item.description.toLowerCase().includes('philosopher') ||
            item.description.toLowerCase().includes('scientist') ||
            item.description.toLowerCase().includes('artist') ||
            item.description.toLowerCase().includes('leader') ||
            item.description.toLowerCase().includes('athlete') ||
            item.description.toLowerCase().includes('influencer') ||
            item.description.toLowerCase().includes('celebrity') ||
            item.description.toLowerCase().includes('personality') ||
            item.description.toLowerCase().includes('businessman') ||
            item.description.toLowerCase().includes('businesswoman') ||
            item.description.toLowerCase().includes('fighter') ||
            item.description.toLowerCase().includes('boxer') ||
            item.description.toLowerCase().includes('kickboxer') ||
            item.description.toLowerCase().includes('martial artist') ||
            item.description.toLowerCase().includes('author') ||
            item.description.toLowerCase().includes('writer') ||
            item.description.toLowerCase().includes('speaker') ||
            item.description.toLowerCase().includes('coach') ||
            // Also include if the description mentions social media
            item.description.toLowerCase().includes('youtuber') ||
            item.description.toLowerCase().includes('streamer') ||
            item.description.toLowerCase().includes('social media') ||
            item.description.toLowerCase().includes('internet')
          ))
          .map((item: any) => ({
            label: item.label,
            description: item.description
          }));

        setSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const renderImageItem = ({ item }: { item: WikimediaSearchResult }) => {
    const isSelected = selectedImages.some(selected => selected.pageid === item.pageid);

    return (
      <TouchableOpacity
        style={[styles.imageItem, isSelected && styles.selectedImageItem]}
        onPress={() => handleSelectImage(item)}
      >
        <Image
          source={{ uri: item.thumbnail?.source }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <LinearGradient 
        colors={['#0F172A', '#1E3A5F', '#2D5F7C']} 
        style={styles.container}
        start={{x: 0.5, y: 0}}
        end={{x: 0.5, y: 1}}
      >
        <SafeAreaView style={styles.safeContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.title}>Choose a Mentor</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for mentors..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={searchTerm}
                onChangeText={(text) => {
                  setSearchTerm(text);
                  fetchSuggestions(text);
                }}
                onSubmitEditing={() => {
                  handleSearch();
                  setShowSuggestions(false);
                  setSuggestions([]);
                }}
                returnKeyType="search"
              />
              <TouchableOpacity 
                style={styles.searchButton} 
                onPress={() => {
                  handleSearch();
                  setShowSuggestions(false);
                  setSuggestions([]);
                }}
              >
                <MaterialCommunityIcons name="magnify" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.label}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setSearchTerm(suggestion.label);
                      setShowSuggestions(false);
                      setSuggestions([]);
                      handleSearch();
                    }}
                  >
                    <MaterialCommunityIcons name="account" size={20} color="#666666" />
                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionText}>{suggestion.label}</Text>
                      <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
              </View>
            ) : error ? (
              <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleSearch}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : results.length === 0 ? (
              <View style={styles.centerContainer}>
                <Text style={styles.noResultsText}>
                  {searchTerm ? 'No results found' : 'Search for mentors to get started'}
                </Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={results}
                  renderItem={renderImageItem}
                  keyExtractor={(item) => item.pageid.toString()}
                  numColumns={3}
                  contentContainerStyle={styles.gridContainer}
                />
                {selectedImages.length > 0 && (
                  <View style={styles.bottomBar}>
                    <ScrollView 
                      horizontal 
                      style={styles.selectedImagesScroll}
                      contentContainerStyle={styles.selectedImagesContent}
                    >
                      {selectedImages.map((image) => (
                        <TouchableOpacity
                          key={image.pageid}
                          style={styles.selectedThumbnailContainer}
                          onPress={() => handleSelectImage(image)}
                        >
                          <Image
                            source={{ uri: image.thumbnail?.source }}
                            style={styles.selectedThumbnail}
                          />
                          <View style={styles.removeButton}>
                            <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TouchableOpacity
                      style={styles.nextButton}
                      onPress={handleConfirmSelection}
                    >
                      <MaterialCommunityIcons name="arrow-right" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  safeContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  searchButton: {
    width: 44,
    height: 44,
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContainer: {
    padding: 8,
  },
  imageItem: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedImageItem: {
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'transparent',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#D4AF37',
    borderRadius: 8,
  },
  retryText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  noResultsText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  selectedImagesScroll: {
    flex: 1,
  },
  selectedImagesContent: {
    paddingRight: 16,
    gap: 8,
  },
  selectedThumbnailContainer: {
    position: 'relative',
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FF0000',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 156 : 140,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  suggestionTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  suggestionText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  suggestionDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
});

export default WikimediaImagePicker; 