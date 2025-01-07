import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { VisionBoard } from './VisionBoardScreen';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { LayoutTile, RowConfig } from '../../types/layout';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

type Props = NativeStackScreenProps<RootStackParamList, 'VisionBoardSections'>;

interface ExtendedRouteParams {
  boardId: string;
  refresh?: number;
  context?: 'daily' | 'challenge';
  challengeId?: string;
}

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

// Constants for layout
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
const GAP_SIZE = 2;
const PADDING_SIZE = 2;
const SECTION_PADDING = 2;
const SECTION_SIZE = windowWidth * 0.95;
const MAX_SECTION_HEIGHT = windowHeight * 0.4;
const MAX_PHOTOS_PER_SECTION = 10;

interface Section {
  id: string;
  name: string;
  photos: string[];
  description?: string;
  captions?: { [key: string]: string };
  layout?: LayoutTile[];
}

// Shuffle array helper
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Generate a random number between min and max (inclusive)
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Update generateRandomLayout function
const generateRandomLayout = (photoCount: number, containerWidth: number): LayoutTile[] => {
  if (photoCount === 0) return [];
  
  // Special case for 1 photo
  if (photoCount === 1) {
    return [{
      x: 0,
      y: 0,
      width: containerWidth,
      height: containerWidth * 0.7,
      isWide: true
    }];
  }

  const tiles: LayoutTile[] = [];
  const GAP = GAP_SIZE;
  let currentY = 0;

  // For 7 photos (like in the screenshot), create a specific layout
  if (photoCount === 7) {
    // First row: 3 equal squares
    const topRowPhotoSize = (containerWidth - 2 * GAP) / 3;
    for (let i = 0; i < 3; i++) {
      tiles.push({
        x: i * (topRowPhotoSize + GAP),
        y: 0,
        width: topRowPhotoSize,
        height: topRowPhotoSize,
        isWide: false
      });
    }

    currentY = topRowPhotoSize + GAP;

    // Second row: 2 photos (one wider)
    const middleRowHeight = topRowPhotoSize * 0.8;
    const middlePhoto1Width = (containerWidth - GAP) * 0.4;
    const middlePhoto2Width = containerWidth - middlePhoto1Width - GAP;

    // Left photo in middle row
    tiles.push({
      x: 0,
      y: currentY,
      width: middlePhoto1Width,
      height: middleRowHeight,
      isWide: false
    });

    // Right (wider) photo in middle row
    tiles.push({
      x: middlePhoto1Width + GAP,
      y: currentY,
      width: middlePhoto2Width,
      height: middleRowHeight,
      isWide: true
    });

    currentY += middleRowHeight + GAP;

    // Last row: 2 photos
    const bottomRowHeight = topRowPhotoSize * 0.8;
    const bottomPhoto1Width = (containerWidth - GAP) * 0.4;
    const bottomPhoto2Width = containerWidth - bottomPhoto1Width - GAP;

    // Left photo in bottom row
    tiles.push({
      x: 0,
      y: currentY,
      width: bottomPhoto1Width,
      height: bottomRowHeight,
      isWide: false
    });

    // Right photo in bottom row
    tiles.push({
      x: bottomPhoto1Width + GAP,
      y: currentY,
      width: bottomPhoto2Width,
      height: bottomRowHeight,
      isWide: true
    });

    return tiles;
  }

  // For other numbers of photos, create a balanced layout
  let remainingPhotos = photoCount;
  while (remainingPhotos > 0) {
    let photosInRow = Math.min(3, remainingPhotos);
    const photoWidth = (containerWidth - (photosInRow - 1) * GAP) / photosInRow;
    const photoHeight = photoWidth;

    for (let i = 0; i < photosInRow; i++) {
      tiles.push({
        x: i * (photoWidth + GAP),
        y: currentY,
        width: photoWidth,
        height: photoHeight,
        isWide: false
      });
    }

    currentY += photoHeight + GAP;
    remainingPhotos -= photosInRow;
  }

  return tiles;
};

const VisionBoardSectionsScreen: React.FC<Props> = ({ navigation, route }) => {
  const params = route.params as ExtendedRouteParams;
  const { boardId } = params;
  const [board, setBoard] = React.useState<VisionBoard | null>(null);
  const [showMenu, setShowMenu] = React.useState(false);
  const [selectedSection, setSelectedSection] = React.useState<{ id: string, name: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isReorderMode, setIsReorderMode] = React.useState(false);

  const handleExit = () => {
    if (params.context === 'challenge' && params.challengeId) {
      navigation.navigate('ChallengeDetail', {
        challenge: {
          id: params.challengeId,
          title: 'Ultimate',
          duration: 21,
          description: '',
          image: null
        }
      });
    } else {
      navigation.navigate('MainTabs');
    }
  };

  const loadBoard = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const storedBoards = await AsyncStorage.getItem('vision_boards');
      
      if (!storedBoards) {
        setError('No boards found');
        return;
      }

      const boards: VisionBoard[] = JSON.parse(storedBoards);
      const currentBoard = boards.find(b => b.id === boardId);
      
      if (!currentBoard) {
        setError('Board not found');
        return;
      }

      // Generate layouts for sections that need them
      const updatedBoard = {
        ...currentBoard,
        sections: currentBoard.sections.map(section => {
          if (!section.layout || section.layout.length !== section.photos.length) {
            return {
              ...section,
              layout: generateRandomLayout(
                section.photos.length,
                SECTION_SIZE - (SECTION_PADDING * 2)
              )
            };
          }
          return section;
        })
      };
      
      // Save the updated layouts back to storage
      const updatedBoards = boards.map(b => 
        b.id === boardId ? updatedBoard : b
      );
      await AsyncStorage.setItem('vision_boards', JSON.stringify(updatedBoards));
      
      setBoard(updatedBoard);
    } catch (error) {
      console.error('Error in loadBoard:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  React.useEffect(() => {
    loadBoard();
  }, [loadBoard, route.params?.refresh]);

  const saveNewOrder = async (newSections: Section[]) => {
    try {
      const storedBoards = await AsyncStorage.getItem('vision_boards');
      if (storedBoards) {
        const boards: VisionBoard[] = JSON.parse(storedBoards);
        const updatedBoards = boards.map(b => {
          if (b.id === boardId) {
            return { ...b, sections: newSections };
          }
          return b;
        });
        await AsyncStorage.setItem('vision_boards', JSON.stringify(updatedBoards));
      }
    } catch (error) {
      console.error('Error saving new order:', error);
    }
  };

  const renderSectionItem = ({ item, drag, isActive }: RenderItemParams<Section>) => (
    <ScaleDecorator>
      <TouchableOpacity
        onLongPress={isReorderMode ? drag : undefined}
        disabled={!isReorderMode}
        delayLongPress={200}
        style={[
          styles.sectionWrapper,
          isActive && styles.draggingSection,
          isReorderMode && styles.reorderSection
        ]}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderContent}>
            <Text style={styles.sectionName}>{item.name}</Text>
            {isReorderMode ? (
              <MaterialCommunityIcons 
                name="drag" 
                size={24} 
                color="#666666"
                style={styles.dragHandle}
              />
            ) : (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => {
                  setSelectedSection(item);
                  setShowMenu(true);
                }}
              >
                <MaterialCommunityIcons name="dots-horizontal" size={18} color="#666666" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.divider} />
        </View>
        <View style={styles.sectionContent}>
          {item.photos.length > 0 ? (
            renderCollageLayout(item.photos, item)
          ) : (
            <View style={styles.emptyCollageContainer}>
              <PhotoPlaceholder 
                color={PLACEHOLDER_COLORS.mint}
                onPress={() => navigation.navigate('VisionBoardSectionPhotos', { 
                  boardId: boardId,
                  sectionId: item.id,
                  sectionName: item.name,
                })}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </ScaleDecorator>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4B8C" />
          <Text style={styles.loadingText}>Loading board...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadBoard}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!board) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No board data available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadBoard}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleDeleteSection = (sectionId: string) => {
    Alert.alert(
      'Delete Section',
      'Are you sure you want to delete this section?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const storedBoards = await AsyncStorage.getItem('vision_boards');
              if (storedBoards) {
                const boards: VisionBoard[] = JSON.parse(storedBoards);
                const currentBoard = boards.find(b => b.id === boardId);
                if (currentBoard) {
                  const updatedSections = currentBoard.sections.filter(s => s.id !== sectionId);
                  const updatedBoard = { ...currentBoard, sections: updatedSections };
                  const updatedBoards = boards.map(b => b.id === boardId ? updatedBoard : b);
                  await AsyncStorage.setItem('vision_boards', JSON.stringify(updatedBoards));
                  setBoard(updatedBoard);
                }
              }
            } catch (error) {
              console.error('Error deleting section:', error);
            }
          }
        }
      ]
    );
  };

  const renderCollageLayout = (photos: string[], section: Section) => {
    if (!photos || photos.length === 0) {
      return (
        <View style={styles.emptyCollageContainer}>
          <PhotoPlaceholder 
            color={PLACEHOLDER_COLORS.mint}
            onPress={() => navigation.navigate('VisionBoardSectionPhotos', { 
              boardId: boardId,
              sectionId: section.id,
              sectionName: section.name,
            })}
          />
        </View>
      );
    }

    let layout = section.layout;
    if (!layout || layout.length !== photos.length) {
      layout = generateRandomLayout(photos.length, windowWidth - (PADDING_SIZE * 2) - (SECTION_PADDING * 2));
    }

    // Calculate exact container dimensions
    const maxY = Math.max(...layout.map(tile => tile.y + tile.height));
    const finalHeight = maxY; // Removed extra padding
    
    return (
      <TouchableOpacity 
        style={[
          styles.collageContainer,
          {
            height: finalHeight,
          }
        ]}
        onPress={() => navigation.navigate('VisionBoardSectionPhotos', { 
          boardId: boardId,
          sectionId: section.id,
          sectionName: section.name,
        })}
      >
        <View style={[styles.dynamicGrid, { height: finalHeight }]}>
          {photos.map((photo, index) => {
            const tile = layout[index];
            if (!tile) return null;

            return (
              <View
                key={index}
                style={[
                  styles.imageContainer,
                  {
                    position: 'absolute',
                    width: tile.width,
                    height: tile.height,
                    transform: [
                      { translateX: tile.x },
                      { translateY: tile.y }
                    ]
                  }
                ]}
              >
                <Image 
                  source={{ uri: photo }}
                  style={styles.collageImage}
                />
                <LinearGradient
                  colors={['rgba(255,255,255,0.8)', 'transparent']}
                  start={{x: 0.5, y: 0}}
                  end={{x: 0.5, y: 0.3}}
                  style={styles.topGradient}
                />
                <LinearGradient
                  colors={['rgba(255,255,255,0.8)', 'transparent']}
                  start={{x: 0.5, y: 1}}
                  end={{x: 0.5, y: 0.7}}
                  style={styles.bottomGradient}
                />
              </View>
            );
          })}
        </View>
      </TouchableOpacity>
    );
  };

  const getRandomHeight = () => {
    // Generate random heights between 150 and 350
    return Math.floor(Math.random() * (350 - 150 + 1)) + 150;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (isReorderMode) {
                setIsReorderMode(false);
              } else {
                navigation.goBack();
              }
            }}
          >
            <MaterialCommunityIcons 
              name={isReorderMode ? "close" : "chevron-left"} 
              size={32} 
              color="#FF4B8C" 
            />
          </TouchableOpacity>
          <Text style={styles.title}>
            {isReorderMode ? "Reorder Sections" : board?.name}
          </Text>
          <View style={styles.headerRight}>
            {isReorderMode ? (
              <TouchableOpacity 
                style={styles.doneButton}
                onPress={() => setIsReorderMode(false)}
              >
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.exitButton}
                onPress={handleExit}
              >
                <Text style={styles.exitText}>Exit</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {board && (
          <DraggableFlatList
            data={board.sections}
            onDragEnd={({ data }) => {
              setBoard(prev => prev ? { ...prev, sections: data } : null);
              saveNewOrder(data);
            }}
            keyExtractor={(item) => item.id}
            renderItem={renderSectionItem}
            dragItemOverflow={true}
            activationDistance={20}
            contentContainerStyle={styles.sectionsContainer}
          />
        )}

        {!isReorderMode && (
          <TouchableOpacity 
            style={styles.newSectionButton}
            onPress={() => navigation.navigate('NewVisionBoardSection', { boardId: board?.id })}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
            <Text style={styles.newSectionText}>New Section</Text>
          </TouchableOpacity>
        )}

        <Modal
          visible={showMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          >
            <View style={styles.menuContainer}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  if (selectedSection?.id && selectedSection?.name) {
                    navigation.navigate('VisionBoardEditSectionName', { 
                      boardId,
                      sectionId: selectedSection.id,
                      currentName: selectedSection.name
                    });
                  }
                }}
              >
                <Text style={styles.menuItemText}>Edit Section's Name</Text>
                <MaterialCommunityIcons name="pencil" size={20} color="#000000" />
              </TouchableOpacity>
              
              <View style={styles.menuDivider} />
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  setIsReorderMode(true);
                }}
              >
                <Text style={styles.menuItemText}>Move Section</Text>
                <MaterialCommunityIcons name="drag" size={20} color="#000000" />
              </TouchableOpacity>
              
              <View style={styles.menuDivider} />
              
              <TouchableOpacity 
                style={[styles.menuItem, styles.deleteItem]}
                onPress={() => {
                  setShowMenu(false);
                  if (selectedSection) {
                    handleDeleteSection(selectedSection.id);
                  }
                }}
              >
                <Text style={[styles.menuItemText, styles.deleteText]}>Delete Section</Text>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF0000" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
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
    width: 'auto',
  },
  exitButton: {
    backgroundColor: '#FFD700',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  exitText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: PADDING_SIZE,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
  },
  boardInfo: {
    marginBottom: 24,
    paddingHorizontal: 8,
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
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  photoGrid: {
    marginBottom: 24,
  },
  masonryLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    alignItems: 'flex-start',
  },
  masonryItem: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  hero: {
    width: '100%',
    aspectRatio: 1.8,
  },
  vertical: {
    width: '40%',
    aspectRatio: 0.8,
  },
  horizontal: {
    width: '59.5%',
    aspectRatio: 1.4,
  },
  medium: {
    width: '49.5%',
    aspectRatio: 1.2,
  },
  small: {
    width: '32.5%',
    aspectRatio: 1,
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
    backgroundColor: '#E31837',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 100,
    position: 'absolute',
    bottom: 60,
    right: 24,
    gap: 8,
  },
  newSectionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  collageContainer: {
    overflow: 'hidden',
    borderRadius: 12,
    width: '100%',
  },
  photoGroup: {
    flexDirection: 'row',
    gap: GAP_SIZE,
    flex: 1,
  },
  imageContainer: {
    overflow: 'hidden',
    borderRadius: 8,
  },
  fullSize: {
    width: '100%',
    height: '100%',
  },
  halfSize: {
    flex: 1,
    height: '100%',
  },
  thirdSize: {
    flex: 1,
    height: '100%',
  },
  quarterSize: {
    flex: 1,
    height: '100%',
  },
  tallVariant: {
    flex: 2,
  },
  collageImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '15%',
  },
  leftBlur: {
    left: 0,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  rightBlur: {
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  emptyCollageContainer: {
    flexDirection: 'row',
    gap: GAP_SIZE,
    height: (SECTION_SIZE - (SECTION_PADDING * 2)) / 3, // One third of container width for square
  },
  leftGradient: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '20%',
  },
  rightGradient: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '20%',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '20%',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '20%',
  },
  sectionWrapper: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    paddingHorizontal: 16,
  },
  sectionContent: {
    marginTop: 4,
    paddingBottom: 16,
  },
  warningBubble: {
    backgroundColor: 'rgba(255, 75, 106, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    marginBottom: 16,
    alignSelf: 'center',
  },
  warningText: {
    color: '#FF4B6A',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionHeader: {
    paddingTop: 16,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    width: '100%',
  },
  stackedContainer: {
    flex: 1,
    height: (SECTION_SIZE - (SECTION_PADDING * 2)) / 2,
    gap: GAP_SIZE,
  },
  stackedWide: {
    width: '100%',
    height: ((SECTION_SIZE - (SECTION_PADDING * 2)) / 2 - GAP_SIZE) / 2,
  },
  dynamicGrid: {
    position: 'relative',
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '80%',
    maxWidth: 300,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#000000',
  },
  deleteText: {
    color: '#FF0000',
  },
  deleteItem: {
    borderTopColor: '#E5E5E5',
    borderTopWidth: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 16,
  },
  menuButton: {
    padding: 4,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666666',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF4B8C',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF4B8C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 100,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    color: '#FF4B8C',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  draggingSection: {
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    transform: [{ scale: 1.02 }],
  },
  reorderSection: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  dragHandle: {
    padding: 8,
    marginLeft: 8,
  },
  doneButton: {
    backgroundColor: '#E31837',
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionsContainer: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#F5F5F5',
  },
});

export default VisionBoardSectionsScreen; 