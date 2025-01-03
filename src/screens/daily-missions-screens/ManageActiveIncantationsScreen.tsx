import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, Modal, TextInput } from 'react-native';
import { Button, ListItem } from '@rneui/themed';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runOnJS } from 'react-native-reanimated';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageActiveIncantations'>;

type IncantationItem = {
  id: string;
  text: string;
};

const STORAGE_KEY = '@active_incantations';

const defaultIncantationsText = [
  "I am a beacon of positivity",
  "I am always in motion",
  "I live each day as if it were my last",
  "I eat slowly",
  "I am grateful for this day",
  "My current limits are false",
  "I speak with intention",
  "I embody my ultra EGO every day",
  "I know I can accomplish the impossible",
  "Today, I will be pleasantly surprised",
  "I easily face and overcome challenges",
  "The harder it is, the better",
  "Having to decide to do these activities doesn't drain me",
  "I sleep wonderfully well",
  "Disciplined life makes me happy",
  "I achieve my goals effortlessly",
  "I honor my worth",
  "I work until 9pm",
  "I am pure energy",
  "I earn money easily and effortlessly",
  "I love working on my projects every day",
  "I have amazing friends",
  "I use my time to do things that matter to me",
  "I do my abs every day",
  "Today is a special day for me",
  "My life is a series of good decisions",
  "I only consume content that positively changes my life",
  "I learn from all experiences in life",
  "I train for an hour every day",
  "I have positive and optimistic thoughts today",
  "I am at peace",
  "I love my life",
  "I speak slowly",
  "I deliberately take a pause after each sentence",
  "I train every day",
  "I open my heart for wonderful things to come to me",
  "I am grateful for every moment of life",
  "My friends and family are extraordinary",
  "My daily decisions lead to my goals",
  "I am charismatic",
  "My life is important, the smallest actions can make a difference",
  "I love myself for who I am",
  "I deserve the love I receive",
  "I am a source of inspiration for those around me",
  "I speak with a deep, descending voice",
  "I accomplish everything I invest myself in",
  "I am grateful for the riches in my life",
  "I stretch every evening",
  "Every hour, I get up and do a physical exercise",
  "I speak very fluently",
  "I am a successful person",
  "When I am determined, nothing can stop me",
  "I don't eat after 4pm",
  "I open my mouth wide when I speak",
  "I master my emotions and can change my state in an instant",
  "My body is my temple",
  "I have fulfilling relationships",
  "I feel joy at this precise moment",
  "By allowing myself to be happy, I inspire others to be happy too",
  "My heart overflows with joy and love",
  "I smile and my day lights up",
  "I start my day with a positive attitude",
  "I am grateful to have woken up this morning",
  "I over-articulate",
  "I always give my best",
  "I have complete confidence in myself",
  "I am safe",
  "I am free from negative thoughts",
  "I know I can do it",
  "I love myself and I am in perfect health",
  "I am fortunate",
  "I have a deep voice",
  "I read 50 pages a day",
  "I work on my back every day",
  "Making money is easy for me",
  "I deserve to be happy",
  "I have a sense of humor and love laughing with people I love",
  "I nourish my body with healthy foods",
  "I trust my inner wisdom and intuition",
  "I love my work and have excellent results",
  "I am the architect of my life",
  "This day is going to be wonderfully good",
  "My mind is filled with positive thoughts and my heart with love",
  "This morning, I say thank you to life",
  "Today, I will be the best version of myself",
  "I move fast (Tate)",
  "I am focused on my goal",
  "I attract everything I desire",
  "I am patient and serene",
  "Each day is a new opportunity to do what I love",
  "I decide that today will be a great day",
  "I attract good people into my life",
  "I believe in myself and my abilities",
  "I have a lot of value",
  "I am at peace with my past",
  "I dare to step out of my comfort zone",
  "Day by day, I feel better and better",
  "I decide to give up my negative thoughts",
  "I deserve the best that life has to offer",
  "I welcome change with open arms",
  "I am strong and ambitious",
  "I have an impactful voice",
  "I stretch every day",
  "I am an accomplished person",
  "I dare to dream big",
  "I am free",
  "I feel in harmony with everything around me",
  "I express myself with ease",
  "I hold the keys to my success",
  "I succeed in everything I undertake",
  "I connect to the present moment and fully live this day",
  "I treat myself with the respect I deserve",
  "I overflow with energy. I sleep wonderfully well",
  "Every day, I create the life of my dreams",
  "I am perseverant and never give up",
  "I am a magnet that attracts fortune",
  "I exceed my limits every day",
  "I enjoy every second given to me",
  "I focus my attention on positive things",
  "I am an incredible person",
  "I listen to my intuitions",
  "I celebrate even my smallest successes",
  "I am creative and have lots of good ideas",
  "I am pure energy",
  "I live my life with enthusiasm and passion",
  "I am open to the magic of life",
  "I am the master of my thoughts and actions"
];

const ManageActiveIncantationsScreen: React.FC<Props> = ({ navigation }) => {
  const [incantations, setIncantations] = useState<IncantationItem[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingIncantation, setEditingIncantation] = useState<IncantationItem | null>(null);
  const [editingText, setEditingText] = useState('');

  // Add ref for the scroll view
  const scrollRef = React.useRef(null);

  useEffect(() => {
    loadIncantations();
  }, []);

  const loadIncantations = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setIncantations(JSON.parse(stored));
      } else {
        const defaults = defaultIncantationsText.map((text, index) => ({
          id: `incantation-${Date.now()}-${index}`,
          text,
        }));
        setIncantations(defaults);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      }
    } catch (error) {
      console.error('Error loading incantations:', error);
    }
  };

  const saveNewOrder = async (recordingsToSave: IncantationItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recordingsToSave));
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleDragEnd = useCallback(({ data }: { data: IncantationItem[], from: number, to: number }) => {
    setIncantations(data);
    // Defer the storage operation
    requestAnimationFrame(() => {
      saveNewOrder(data).catch(console.error);
    });
  }, []);

  const handleDeleteIncantation = async (item: IncantationItem) => {
    const newIncantations = incantations.filter(i => i.id !== item.id);
    setIncantations(newIncantations);
    await saveNewOrder(newIncantations);
  };

  const handleSaveEdit = async () => {
    const newIncantations = incantations.map(item => 
      item.id === editingIncantation?.id ? { ...item, text: editingText } : item
    );
    setIncantations(newIncantations);
    await saveNewOrder(newIncantations);
    setEditModalVisible(false);
  };

  const Header = React.memo(() => (
    <View style={styles.header}>
      <Text style={styles.title}>Incantations</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity onPress={() => setIsEditMode(!isEditMode)}>
          <Text style={styles.editButton}>
            {isEditMode ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => navigation.navigate('ActiveIncantationsExercise', { 
            incantations: incantations.map(item => item.text) 
          })}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerIcon}
          onPress={() => setShowExitModal(true)}
        >
          <MaterialCommunityIcons name="logout" size={24} color="#E31837" />
        </TouchableOpacity>
      </View>
    </View>
  ));

  // Memoize renderItem function
  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<IncantationItem>) => {
    if (!isEditMode) {
      return (
        <View style={[styles.recordingItem, { opacity: isActive ? 0.5 : 1 }]}>
          <View style={styles.recordingContent}>
            <View style={styles.recordingInfo}>
              <Text style={styles.recordingText} numberOfLines={2}>
                {item?.text || 'No text available'}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        onLongPress={drag}
        disabled={isActive}
        delayLongPress={150}
        style={[
          styles.recordingItem,
          styles.recordingItemEdit,
          isActive && styles.draggingItem
        ]}
      >
        <View style={styles.recordingContent}>
          <MaterialCommunityIcons 
            name="menu" 
            size={24} 
            color="#FFFFFF" 
            style={styles.dragHandle}
          />
          <View style={styles.recordingInfo}>
            <Text style={styles.recordingText} numberOfLines={2}>
              {item?.text || 'No text available'}
            </Text>
          </View>
          <View style={styles.editActions}>
            <TouchableOpacity 
              style={styles.editIcon}
              onPress={() => handleEditIncantation(item)}
            >
              <MaterialCommunityIcons name="pencil" size={22} color="#E6B800" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.editIcon}
              onPress={() => handleDeleteIncantation(item)}
            >
              <MaterialCommunityIcons name="delete" size={22} color="#E31837" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [isEditMode]); // Only re-create when isEditMode changes

  const handleEditIncantation = (item: IncantationItem) => {
    setEditingIncantation(item);
    setEditingText(item.text);
    setEditModalVisible(true);
  };

  const renderListenAllButton = () => (
    <TouchableOpacity
      style={styles.listenAllButton}
      onPress={() => {/* handle listen all */}}
    >
      <Text style={styles.listenAllText}>Listen All</Text>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Header />
          <DraggableFlatList<IncantationItem>
            data={incantations}
            onDragEnd={handleDragEnd}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            dragItemOverflow={false}
            activationDistance={3}
            autoscrollSpeed={50}
          />
          {renderListenAllButton()}
          
          <Modal
            visible={showExitModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowExitModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Wait! Are you sure?</Text>
                <Text style={styles.modalText}>
                  You're making progress! Continue practicing to maintain your results.
                </Text>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => setShowExitModal(false)}
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exitButton}
                  onPress={() => {
                    setShowExitModal(false);
                    navigation.navigate('MainTabs');
                  }}
                >
                  <Text style={styles.exitText}>Exit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            visible={editModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setEditModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Incantation</Text>
                <TextInput
                  style={styles.editInput}
                  value={editingText}
                  onChangeText={setEditingText}
                  multiline
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 140,
  },
  itemContainer: {
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E2E',
    paddingVertical: 12,
  },
  itemText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  recordingItem: {
    backgroundColor: '#2A3744',
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    height: 64,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordingItemEdit: {
    backgroundColor: '#1F2937',
  },
  recordingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  recordingInfo: {
    flex: 1,
    marginLeft: 8,
  },
  recordingText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  draggingItem: {
    backgroundColor: '#1E1E1E',
  },
  dragHandle: {
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3744',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editButton: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  nextButton: {
    backgroundColor: '#E6B800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  nextButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '600',
  },
  headerIcon: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    opacity: 0.8,
  },
  continueButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
    width: '100%',
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  exitButton: {
    backgroundColor: '#E31837',
    paddingVertical: 16,
    borderRadius: 30,
  },
  exitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editIcon: {
    padding: 4,
  },
  editInput: {
    color: '#FFFFFF',
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    borderRadius: 8,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#E31837',
    paddingVertical: 16,
    borderRadius: 30,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  listenAllButton: {
    backgroundColor: '#E6B800',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  listenAllText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  dragHandleContainer: {
    padding: 8,
    marginRight: 4,
  },
});

export default ManageActiveIncantationsScreen; 