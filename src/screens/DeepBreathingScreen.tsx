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
import ExerciseIntroScreen from '../components/ExerciseIntroScreen';
import ExitExerciseButton from '../components/ExitExerciseButton';

type Props = NativeStackScreenProps<RootStackParamList, 'DeepBreathing'>;

const DeepBreathingScreen: React.FC<Props> = ({ navigation }) => {
  const [showIntro, setShowIntro] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);

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

  if (showIntro) {
    return (
      <ExerciseIntroScreen
        title="Deep Breathing"
        description={
          "Take a moment to find peace and calmness.\n\n" +
          "Follow the guided breathing exercise to reduce stress and anxiety.\n\n" +
          "This practice will help you relax and center yourself."
        }
        buttonText="Start Exercise"
        onStart={() => {
          setShowIntro(false);
          setShowAnimation(true);
        }}
        onExit={() => navigation.goBack()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000000"
        translucent={false}
      />
      <View style={styles.content}>
        {showAnimation && (
          <BreathingAnimation
            navigation={navigation}
            onComplete={() => navigation.goBack()}
          />
        )}
      </View>
      <View style={styles.exitButtonContainer}>
        <ExitExerciseButton onExit={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  exitButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
});

export default DeepBreathingScreen;
