import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Text,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import EmptyVisionBoardSection from '../components/EmptyVisionBoardSection';
import PexelsImagePicker from '../components/PexelsImagePicker';
import { VisionBoard, VisionBoardSection } from './VisionBoardScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'VisionBoardSection'>;

const VisionBoardSectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const [showPexelsPicker, setShowPexelsPicker] = useState(false);
  const { boardId, sectionId, sectionName } = route.params;

  const handleAddPhotos = () => {
    setShowPexelsPicker(true);
  };

  const handleHelpPress = () => {
    // TODO: Implement help modal or navigation
    console.log('Help pressed');
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
        <View style={styles.headerTitle}>
          <Text style={styles.title}>{sectionName}</Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <MaterialCommunityIcons name="dots-horizontal" size={24} color="#FF4B8C" />
        </TouchableOpacity>
      </View>

      <EmptyVisionBoardSection
        sectionName={sectionName}
        onAddPhotos={handleAddPhotos}
        onHelpPress={handleHelpPress}
      />

      <PexelsImagePicker
        visible={showPexelsPicker}
        onClose={() => setShowPexelsPicker(false)}
        onSelectPhotos={(photos) => {
          // TODO: Handle selected photos
          console.log('Selected photos:', photos);
          setShowPexelsPicker(false);
        }}
        initialSearchTerm={sectionName}
      />
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
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

export default VisionBoardSectionScreen; 