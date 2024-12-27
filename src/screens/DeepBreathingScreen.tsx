import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BreathingAnimation from '../components/BreathingAnimation';

type Props = NativeStackScreenProps<RootStackParamList, 'DeepBreathing'>;

const renderIcon = (name: string, size: string | number, color: string) => {
  const Icon = MaterialCommunityIcons as any;
  return <Icon name={name} size={size} color={color} />;
};

const DeepBreathingScreen: React.FC<Props> = ({ navigation }) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [sound, setSound] = useState<any>(null);

  useEffect(() => {
    // Load the sound when component mounts
    const loadSound = async () => {
      const Sound = require('react-native-sound');
      Sound.setCategory('Playback');

      const natureSound = new Sound(require('../assets/audio/nature.wav'), (error: Error | null) => {
        if (error) {
          console.log('Failed to load the sound', error);
          return;
        }
        // Set looping to true for continuous play
        natureSound.setNumberOfLoops(-1);
        setSound(natureSound);
      });
    };

    loadSound();

    // Cleanup when component unmounts
    return () => {
      if (sound) {
        sound.stop();
        sound.release();
      }
    };
  }, []);

  const handleShowAnimation = () => {
    setShowAnimation(true);
    // Start playing the sound when animation starts
    if (sound) {
      sound.play();
    }
  };

  const handleCloseAnimation = () => {
    // First stop and release the nature sound
    if (sound) {
      sound.stop();
      sound.release();
      setSound(null);
    }
    
    // Then close the modal and navigate back
    setShowAnimation(false);
    navigation.goBack();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.stop();
        sound.release();
        setSound(null);
      }
    };
  }, [sound]);

  useEffect(() => {
    // Save the current status bar style
    const currentStyle = StatusBar.currentHeight;
    
    return () => {
      // Reset status bar on unmount
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#000000');
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000000"
        translucent={false}
      />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          {renderIcon("close", 24, "#FFFFFF")}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.illustration}>
          {/* Add your meditation illustration here */}
        </View>
        <Text style={styles.title}>Deep Breathing</Text>
        <Text style={styles.description}>
          Five deep breaths can help improve concentration and attention, allowing you
          to approach your daily tasks with greater ease and efficiency.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.watchButton}
        onPress={handleShowAnimation}
      >
        <Text style={styles.watchButtonText}>Watch the video</Text>
      </TouchableOpacity>

      <Modal
        visible={showAnimation}
        animationType="fade"
        transparent={false}
        onRequestClose={handleCloseAnimation}
        statusBarTranslucent={false}
      >
        <View style={[styles.modalContainer, { backgroundColor: '#000000' }]}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleCloseAnimation}
          >
            {renderIcon("close", 30, "#FFFFFF")}
          </TouchableOpacity>
          <BreathingAnimation 
            navigation={navigation} 
            onComplete={handleCloseAnimation}
          />
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  illustration: {
    width: 200,
    height: 200,
    marginBottom: 32,
    // Add your illustration styling here
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  watchButton: {
    backgroundColor: '#6366f1',
    marginHorizontal: 24,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  watchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 10,
    zIndex: 1,
  },
});

export default DeepBreathingScreen;
