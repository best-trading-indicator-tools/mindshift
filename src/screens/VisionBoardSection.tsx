import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'VisionBoardSection'>;

const PREDEFINED_SECTIONS = [
  'Travel',
  'Health',
  'Family',
  'Friends',
  'Work',
  'Fun',
  'Business',
  'Finance',
  'Wealth',
  'Self-Care',
];

const VisionBoardSection: React.FC<Props> = ({ navigation }) => {
  const [sectionName, setSectionName] = useState('');

  const handleContinue = () => {
    if (sectionName.trim()) {
      // Handle section creation
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.title}>
            Great! Let's give a name to your{'\n'}new section.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Name your section"
            placeholderTextColor="#999999"
            value={sectionName}
            onChangeText={setSectionName}
            autoFocus
          />

          <Text style={styles.orText}>or pick one from below</Text>

          <View style={styles.predefinedSections}>
            {PREDEFINED_SECTIONS.map((section, index) => (
              <TouchableOpacity
                key={index}
                style={styles.sectionButton}
                onPress={() => setSectionName(section)}
              >
                <Text style={styles.sectionButtonText}>{section}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 40,
    lineHeight: 40,
  },
  input: {
    fontSize: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#FF69B4',
    paddingVertical: 8,
    marginBottom: 24,
    color: '#000000',
  },
  orText: {
    fontSize: 16,
    color: '#999999',
    marginBottom: 16,
  },
  predefinedSections: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginBottom: 8,
  },
  sectionButtonText: {
    fontSize: 16,
    color: '#000000',
  },
  continueButton: {
    backgroundColor: '#FF69B4',
    padding: 16,
    borderRadius: 30,
    marginHorizontal: 24,
    marginBottom: Platform.OS === 'ios' ? 34 : 24,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default VisionBoardSection; 