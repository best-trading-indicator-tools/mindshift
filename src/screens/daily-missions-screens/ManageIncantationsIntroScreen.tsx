import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ProgressHeader from '../../components/ProgressHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageIncantationsIntro'>;

const introContent = [
  {
    title: "Customize Your Incantations",
    content: "Make these affirmations truly yours by managing them in the next screen.\n\nYou can reorder, edit, or remove any incantation to match your personal goals and beliefs."
  },
  {
    title: "Easy Drag & Drop",
    content: "Tap 'Edit' to start organizing.\n\nPress and hold any incantation to drag it to a new position.\n\nArrange them in the order that feels most powerful to you."
  },
  {
    title: "Edit & Delete",
    content: "While in edit mode, you'll see two icons:\n\n✏️ Yellow pencil to modify text\n🗑️ Red trash to remove\n\nCreate a set of incantations that resonates with your journey."
  }
];

const ManageIncantationsIntroScreen: React.FC<Props> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = introContent.length;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      navigation.navigate('ManageActiveIncantations');
    }
  };

  const handleExit = () => {
    navigation.goBack();
  };

  const currentContent = introContent[currentStep - 1];

  return (
    <View style={styles.container}>
      <ProgressHeader
        currentStep={currentStep}
        totalSteps={totalSteps}
        onExit={handleExit}
        onNext={handleNext}
        showNext={true}
      />

      <View style={styles.content}>
        <Text style={styles.title}>{currentContent.title}</Text>
        <Text style={styles.description}>{currentContent.content}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    opacity: 0.8,
  },
});

export default ManageIncantationsIntroScreen; 