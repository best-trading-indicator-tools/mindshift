import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ProgressHeader from '../../components/ProgressHeader';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SunBreathTutorial'>;

const tutorialSteps = [
  {
    title: "The Breath of the Sun",
    content: "A powerful breathing exercise to absorb light and release negativity.\n\nTake 5 deep breaths while visualizing golden light entering your body, then release dark clouds of negativity.",
    icon: "white-balance-sunny"
  },
  {
    title: "Breathe In Light",
    content: "As you breathe in, imagine drawing in golden sunlight through your nose. Visualize this light filling your entire body with warmth and positive energy.",
    icon: "weather-sunny"
  },
  {
    title: "Hold the Light",
    content: "Briefly hold your breath, allowing the light to spread throughout your body, energizing every cell.",
    icon: "star-four-points"
  },
  {
    title: "Release Darkness",
    content: "As you exhale through your mouth, visualize dark clouds of negativity leaving your body, carried away by your breath.",
    icon: "weather-cloudy"
  },
  {
    title: "Practice Flow",
    content: "We'll guide you through 5 complete breath cycles.\n\nEach cycle includes a 4-second inhale, 1-second hold, and 6-second exhale.",
    icon: "repeat"
  }
];

const SunBreathTutorialScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigation.navigate('SunBreathExercise');
    }
  };

  const handleExit = () => {
    navigation.navigate('MainTabs');
  };

  const currentTutorial = tutorialSteps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <ProgressHeader
        currentStep={currentStep + 1}
        totalSteps={tutorialSteps.length}
        onExit={handleExit}
        onNext={handleNext}
        showNext={true}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.exitButton}
            onPress={handleExit}
          >
            <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <MaterialCommunityIcons 
          name={currentTutorial.icon} 
          size={100} 
          color="#FFD700" 
        />
        
        <Text style={styles.title}>{currentTutorial.title}</Text>
        <Text style={styles.description}>{currentTutorial.content}</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {currentStep === tutorialSteps.length - 1 ? "Start Exercise" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 30,
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 16,
  },
  exitButton: {
    padding: 8,
  },
});

export default SunBreathTutorialScreen; 