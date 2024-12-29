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
        <View style={styles.handContainer}>
          <View style={styles.hand}>
            <View style={styles.palm} />
            <View style={styles.thumb} />
          </View>
          <View style={styles.frameContainer}>
            <View style={styles.frame}>
              <MaterialCommunityIcons name="chart-line-variant" size={16} color="#FFD700" />
            </View>
          </View>
        </View>
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
    width: 120,
    height: 120,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  hand: {
    width: 80,
    height: 80,
    backgroundColor: '#FF4B8C',
    borderRadius: 40,
    transform: [{ rotate: '45deg' }],
  },
  palm: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    width: 30,
    height: 40,
    backgroundColor: '#FF4B8C',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    transform: [{ translateX: -15 }],
  },
  thumb: {
    position: 'absolute',
    top: '50%',
    right: -10,
    width: 20,
    height: 30,
    backgroundColor: '#FF4B8C',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    transform: [{ translateY: -15 }],
  },
  frameContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  frame: {
    width: 32,
    height: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 32,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#FF4B8C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginBottom: 24,
    width: '100%',
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