import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { markExerciseAsCompleted } from '../../services/exerciseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'GoldenChecklist'>;

// Add type for custom items
type ChecklistItem = typeof CHECKLIST_ITEMS[0];

const CHECKLIST_ITEMS = [
  {
    id: 'sleptWell',
    title: 'Slept Well',
    subtitle: 'Quality sleep is crucial for health',
    physicalBenefits: [
      'No big liquid intake after 2 PM → Prevents nighttime bathroom trips',
      'No food past 4-5 PM → Allows digestion to complete before bed',
      'Dark room → Maximizes melatonin production',
      'Cold room (18-20°C) → Optimal temperature for deep sleep'
    ],
    mentalBenefits: [
      'Blue light blocking glasses 2h before bed → Protects natural melatonin',
      'Small movements every hour → Maintains circulation and reduces stiffness',
      'Regular workout → Improves sleep quality and duration',
      'Consistent sleep schedule → Regulates circadian rhythm'
    ]
  },
  {
    id: 'noViolentContent',
    title: 'No Violent Content',
    subtitle: 'Protect your subconscious mind',
    physicalBenefits: [
      'Reduces stress hormones like cortisol',
      'Lowers blood pressure and heart rate',
      'Improves sleep quality',
      'Reduces muscle tension'
    ],
    mentalBenefits: [
      'Maintains mental peace and clarity',
      'Protects subconscious from negative programming',
      'Reduces anxiety and stress levels',
      'Promotes positive thought patterns'
    ]
  },
  {
    id: 'training',
    title: 'Training/Fitness Exercise',
    subtitle: 'Become stronger',
    physicalBenefits: [
      'Builds muscle mass and strength',
      'Improves cardiovascular health',
      'Enhances flexibility and mobility',
      'Boosts metabolism and energy levels'
    ],
    mentalBenefits: [
      'Releases endorphins for mood elevation',
      'Builds discipline and mental toughness',
      'Increases self-confidence',
      'Reduces stress and anxiety'
    ]
  },
  {
    id: 'sunlight',
    title: '30 minutes of Sunlight on Skin',
    subtitle: 'GO OUTSIDE',
    physicalBenefits: [
      'Vitamin D production for bone health',
      'Strengthens immune system',
      'Regulates circadian rhythm',
      'Improves skin health'
    ],
    mentalBenefits: [
      'Boosts serotonin production',
      'Reduces seasonal depression',
      'Improves sleep quality',
      'Increases energy and alertness'
    ]
  },
  {
    id: 'food',
    title: 'Eat Whole Natural Foods',
    subtitle: 'Cut out processed foods and grains',
    physicalBenefits: [
      'Provides essential nutrients',
      'Supports digestive health',
      'Maintains stable blood sugar',
      'Strengthens immune system'
    ],
    mentalBenefits: [
      'Improves brain function',
      'Stabilizes mood',
      'Increases mental clarity',
      'Reduces inflammation-related depression'
    ]
  },
  {
    id: 'calories',
    title: 'Eating Under Calories Maintenance',
    subtitle: 'Control your daily intake',
    physicalBenefits: [
      'Promotes healthy weight management',
      'Reduces strain on organs',
      'Improves metabolic health',
      'Increases longevity'
    ],
    mentalBenefits: [
      'Builds self-control',
      'Increases mental discipline',
      'Improves relationship with food',
      'Boosts self-esteem through achievement'
    ]
  },
  {
    id: 'noSocialMedia',
    title: 'No Social Media Scrolling',
    subtitle: 'Protect your focus and time',
    physicalBenefits: [
      'Reduces eye strain and blue light exposure',
      'Better posture (less neck strain)',
      'Improved sleep quality',
      'More physical activity (less sitting)'
    ],
    mentalBenefits: [
      'Healthier dopamine system',
      'Better attention span and focus',
      'Reduced anxiety and FOMO',
      'Tools like Opal or Cold Turkey can help block access'
    ]
  },
  {
    id: 'noPorn',
    title: 'No Porn',
    subtitle: 'Stay focused and disciplined',
    physicalBenefits: [
      'Maintains healthy dopamine sensitivity',
      'Improves sleep quality',
      'Increases energy levels',
      'Better hormonal balance'
    ],
    mentalBenefits: [
      'Sharpens focus and concentration',
      'Builds self-control',
      'Improves relationships',
      'Reduces anxiety and shame'
    ]
  },
  {
    id: 'noAlcohol',
    title: 'No Alcohol',
    subtitle: 'Maintain clarity of mind',
    physicalBenefits: [
      'Protects liver health',
      'Improves sleep quality',
      'Better immune function',
      'Maintains healthy weight'
    ],
    mentalBenefits: [
      'Enhances mental clarity',
      'Stabilizes mood',
      'Reduces anxiety',
      'Improves decision-making'
    ]
  },
  {
    id: 'noSmoking',
    title: 'No Cigarettes',
    subtitle: 'Keep your lungs clean',
    physicalBenefits: [
      'Protects lung health',
      'Improves circulation',
      'Better oxygen absorption',
      'Reduces cancer risk'
    ],
    mentalBenefits: [
      'Reduces stress long-term',
      'Improves mental resilience',
      'Builds self-control',
      'Increases sense of freedom'
    ]
  },
  {
    id: 'noWeed',
    title: 'No Weed',
    subtitle: 'Stay sharp and focused',
    physicalBenefits: [
      'Better lung health',
      'Improved memory function',
      'Better sleep quality',
      'Maintains natural energy levels'
    ],
    mentalBenefits: [
      'Sharper cognitive function',
      'Better emotional regulation',
      'Increased motivation',
      'Improved mental clarity'
    ]
  },
  {
    id: 'meditation',
    title: 'Meditation',
    subtitle: 'At least 5 minutes',
    physicalBenefits: [
      'Lowers blood pressure',
      'Reduces stress hormones',
      'Improves immune function',
      'Better sleep quality'
    ],
    mentalBenefits: [
      'Reduces anxiety and stress',
      'Improves emotional control',
      'Increases focus and clarity',
      'Develops mindfulness'
    ]
  },
];

type CustomChecklistItem = {
  id: string;
  title: string;
  subtitle: string;
};

const BenefitsModal: React.FC<{
  item: typeof CHECKLIST_ITEMS[0];
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}> = ({ item, visible, onClose, onComplete }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>{item.title}</Text>
          
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsSectionTitle}>Physical Benefits</Text>
            {item.physicalBenefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <MaterialCommunityIcons name="circle-small" size={24} color="#FFD700" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsSectionTitle}>Mental Benefits</Text>
            {item.mentalBenefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <MaterialCommunityIcons name="circle-small" size={24} color="#FFD700" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.completeButton}
            onPress={onComplete}
          >
            <Text style={styles.completeButtonText}>I Understand</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const GoldenChecklistScreen: React.FC<Props> = ({ navigation }) => {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [customItems, setCustomItems] = useState<CustomChecklistItem[]>([]);
  const [newItem, setNewItem] = useState<{
    title: string;
    subtitle: string;
  }>({
    title: '',
    subtitle: '',
  });

  // Load both checked items and custom items when screen opens
  useEffect(() => {
    loadCheckedItems();
    loadCustomItems();
  }, []);

  const handleExit = () => {
    setShowExitModal(true);
  };

  const loadCheckedItems = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const storedItems = await AsyncStorage.getItem(`checklist_${today}`);
      if (storedItems) {
        setCheckedItems(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error('Error loading checked items:', error);
    }
  };

  const saveCheckedItems = async (items: string[]) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(`checklist_${today}`, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving checked items:', error);
    }
  };

  const handleCheckboxPress = async (itemId: string) => {
    const newCheckedItems = checkedItems.includes(itemId)
      ? checkedItems.filter(id => id !== itemId)
      : [...checkedItems, itemId];
    
    setCheckedItems(newCheckedItems);
    await saveCheckedItems(newCheckedItems);
  };

  const handleItemPress = (item: typeof CHECKLIST_ITEMS[0]) => {
    setSelectedItem(item);
  };

  const handleModalComplete = async () => {
    if (selectedItem) {
      const newCheckedItems = checkedItems.includes(selectedItem.id)
        ? checkedItems.filter(id => id !== selectedItem.id)
        : [...checkedItems, selectedItem.id];
      
      setCheckedItems(newCheckedItems);
      await saveCheckedItems(newCheckedItems);
      setSelectedItem(null);
    }
  };

  const handleComplete = async () => {
    if (checkedItems.length === CHECKLIST_ITEMS.length) {
      await markExerciseAsCompleted('golden-checklist', 'Golden Checklist');
      navigation.goBack();
    }
  };

  const loadCustomItems = async () => {
    try {
      const storedItems = await AsyncStorage.getItem('custom_checklist_items');
      if (storedItems) {
        setCustomItems(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error('Error loading custom items:', error);
    }
  };

  const saveCustomItems = async (items: CustomChecklistItem[]) => {
    try {
      await AsyncStorage.setItem('custom_checklist_items', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving custom items:', error);
    }
  };

  const handleAddItem = async () => {
    if (newItem.title.trim() === '') return;

    const newCustomItem: CustomChecklistItem = {
      id: `custom_${Date.now()}`,
      title: newItem.title,
      subtitle: newItem.subtitle,
    };

    const updatedCustomItems = [...customItems, newCustomItem];
    setCustomItems(updatedCustomItems);
    await saveCustomItems(updatedCustomItems);
    
    setNewItem({
      title: '',
      subtitle: '',
    });
    setShowAddItemModal(false);
  };

  const handleDeleteCustomItem = async (itemId: string) => {
    const updatedCustomItems = customItems.filter(item => item.id !== itemId);
    setCustomItems(updatedCustomItems);
    await saveCustomItems(updatedCustomItems);
    
    // Also remove from checked items if it was checked
    if (checkedItems.includes(itemId)) {
      const newCheckedItems = checkedItems.filter(id => id !== itemId);
      setCheckedItems(newCheckedItems);
      await saveCheckedItems(newCheckedItems);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.exitButton}
          onPress={handleExit}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Golden Checklist</Text>
        <Text style={styles.subtitle}>End of day review</Text>
        <Text style={styles.instruction}>Tap on any item to learn about its benefits for your physical and mental health</Text>

        <TouchableOpacity
          style={styles.addItemButton}
          onPress={() => setShowAddItemModal(true)}
        >
          <MaterialCommunityIcons name="plus-circle" size={24} color="#FFD700" />
          <Text style={styles.addItemButtonText}>Add Custom Item</Text>
        </TouchableOpacity>

        <View style={styles.checklistContainer}>
          {/* Custom Items */}
          {customItems.map((item) => (
            <View key={item.id} style={styles.checklistItem}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleCheckboxPress(item.id)}
              >
                <MaterialCommunityIcons
                  name={checkedItems.includes(item.id) ? "checkbox-marked" : "checkbox-blank-outline"}
                  size={24}
                  color={checkedItems.includes(item.id) ? "#FFD700" : "#666"}
                />
              </TouchableOpacity>
              <View style={styles.itemTextContainer}>
                <View style={styles.itemText}>
                  <Text style={[
                    styles.itemTitle,
                    checkedItems.includes(item.id) && styles.checkedItemTitle
                  ]}>{item.title}</Text>
                  <Text style={[
                    styles.itemSubtitle,
                    checkedItems.includes(item.id) && styles.checkedItemSubtitle
                  ]}>{item.subtitle}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteCustomItem(item.id)}
              >
                <MaterialCommunityIcons name="delete-outline" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Default Items */}
          {CHECKLIST_ITEMS.map((item) => (
            <View key={item.id} style={styles.checklistItem}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleCheckboxPress(item.id)}
              >
                <MaterialCommunityIcons
                  name={checkedItems.includes(item.id) ? "checkbox-marked" : "checkbox-blank-outline"}
                  size={24}
                  color={checkedItems.includes(item.id) ? "#FFD700" : "#666"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.itemTextContainer}
                onPress={() => handleItemPress(item)}
              >
                <View style={styles.itemText}>
                  <Text style={[
                    styles.itemTitle,
                    checkedItems.includes(item.id) && styles.checkedItemTitle
                  ]}>{item.title}</Text>
                  <Text style={[
                    styles.itemSubtitle,
                    checkedItems.includes(item.id) && styles.checkedItemSubtitle
                  ]}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Item Modal */}
      <Modal
        visible={showAddItemModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowAddItemModal(false)}
            >
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Add Custom Item</Text>

            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor="#666"
              value={newItem.title}
              onChangeText={(text) => setNewItem(prev => ({ ...prev, title: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Subtitle"
              placeholderTextColor="#666"
              value={newItem.subtitle}
              onChangeText={(text) => setNewItem(prev => ({ ...prev, subtitle: text }))}
            />

            <TouchableOpacity 
              style={[styles.modalButton, styles.addButton]}
              onPress={handleAddItem}
            >
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Benefits Modal (only for default items) */}
      {selectedItem && (
        <BenefitsModal
          item={selectedItem}
          visible={true}
          onClose={() => setSelectedItem(null)}
          onComplete={handleModalComplete}
        />
      )}

      <Modal
        visible={showExitModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Wait! Are you sure?</Text>
            <Text style={styles.modalText}>
              Don't worry - your checked items will be saved and will stay checked when you return. You can continue your review anytime today.
            </Text>
            <TouchableOpacity 
              style={[styles.modalButton, styles.continueButton]}
              onPress={() => setShowExitModal(false)}
            >
              <Text style={styles.continueButtonText}>Continue Review</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.exitModalButton]}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <Text style={styles.exitModalButtonText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={[
          styles.completeButton,
          checkedItems.length !== CHECKLIST_ITEMS.length && styles.completeButtonDisabled
        ]}
        onPress={handleComplete}
        disabled={checkedItems.length !== CHECKLIST_ITEMS.length}
      >
        <Text style={styles.completeButtonText}>
          {checkedItems.length === CHECKLIST_ITEMS.length
            ? "Complete Review"
            : `${CHECKLIST_ITEMS.length - checkedItems.length} items remaining`}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginBottom: 32,
    textAlign: 'center',
  },
  checklistContainer: {
    gap: 16,
  },
  checklistItem: {
    backgroundColor: '#151932',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    padding: 8,
    marginRight: 8,
  },
  itemTextContainer: {
    flex: 1,
    paddingVertical: 4,
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  checkedItemTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#888',
  },
  checkedItemSubtitle: {
    opacity: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#151932',
    margin: 20,
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
    padding: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
    marginTop: 8,
  },
  benefitsSection: {
    marginBottom: 24,
  },
  benefitsSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  completeButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    margin: 20,
  },
  completeButtonDisabled: {
    backgroundColor: 'rgba(255, 215, 0, 0.5)',
  },
  completeButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instruction: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
  },
  continueButton: {
    backgroundColor: '#FFD700',
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  exitModalButton: {
    backgroundColor: '#D32F2F',
  },
  exitModalButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#151932',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    borderStyle: 'dashed',
  },
  addItemButtonText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#FFD700',
    marginTop: 16,
  },
  addButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default GoldenChecklistScreen; 