import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  sectionName: string;
  onAddPhotos: () => void;
  onHelpPress: () => void;
}

const EmptyVisionBoardSection: React.FC<Props> = ({
  sectionName,
  onAddPhotos,
  onHelpPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        <Image 
          source={require('../assets/illustrations/visionboard-handup-icon.png')}
          style={styles.illustrationImage}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Start manifesting your {sectionName}</Text>

      <TouchableOpacity style={styles.addButton} onPress={onAddPhotos}>
        <MaterialCommunityIcons name="image-plus" size={24} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add Photos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.helpButton} onPress={onHelpPress}>
        <MaterialCommunityIcons name="help-circle-outline" size={20} color="#666666" />
        <Text style={styles.helpButtonText}>Check how to select photos</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#666666" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  illustration: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 32,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#FF4B6A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 24,
    width: 'auto',
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  helpButtonText: {
    color: '#000000',
    fontSize: 16,
    flex: 1,
    marginLeft: 8,
  },
});

export default EmptyVisionBoardSection; 