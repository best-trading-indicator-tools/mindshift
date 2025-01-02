import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import QuestionnaireProgressHeader from '../../components/QuestionnaireProgressHeader';
import { 
  questions, 
  markQuestionnaireCompleted, 
  saveQuestionnaireResponses,
  Question, 
  ScaleQuestion, 
  FrequencyQuestion 
} from '../../services/questionnaireService';

type Props = NativeStackScreenProps<RootStackParamList, 'Questionnaire'>;

const QuestionnaireScreen: React.FC<Props> = ({ navigation }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleAnswer = async (answer: number | string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    
    if (currentQuestionIndex < totalQuestions - 1) {
      setAnswers(newAnswers);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      try {
        // Save answers and mark as completed before any navigation
        await Promise.all([
          saveQuestionnaireResponses(newAnswers),
          markQuestionnaireCompleted()
        ]);
        // Navigate to login screen after all async operations are complete
        navigation.replace('Login');
      } catch (error) {
        console.error('Error completing questionnaire:', error);
      }
    }
  };

  const renderScaleOptions = (question: ScaleQuestion) => {
    return (
      <View style={styles.scaleContainer}>
        {question.options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.scaleOption,
              answers[question.id] === option && styles.selectedOption
            ]}
            onPress={() => handleAnswer(option)}
          >
            <Text style={[
              styles.scaleOptionText,
              answers[question.id] === option && styles.selectedOptionText
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderFrequencyOptions = (question: FrequencyQuestion) => {
    return (
      <View style={styles.frequencyContainer}>
        {question.options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.frequencyOption,
              answers[question.id] === option && styles.selectedOption
            ]}
            onPress={() => handleAnswer(option)}
          >
            <Text style={[
              styles.frequencyOptionText,
              answers[question.id] === option && styles.selectedOptionText
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderOptions = () => {
    if (currentQuestion.type === 'scale') {
      return renderScaleOptions(currentQuestion);
    }
    return renderFrequencyOptions(currentQuestion);
  };

  return (
    <SafeAreaView style={styles.container}>
      <QuestionnaireProgressHeader
        currentStep={currentQuestionIndex + 1}
        totalSteps={totalQuestions}
        onBack={handleBack}
        showBackButton={currentQuestionIndex > 0}
      />
      
      <View style={styles.content}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>
        {renderOptions()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  questionContainer: {
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  scaleOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E1E1E',
  },
  scaleOptionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  frequencyContainer: {
    paddingHorizontal: 20,
  },
  frequencyOption: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1E1E1E',
  },
  frequencyOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedOption: {
    borderColor: '#6366f1',
    backgroundColor: '#1E1E1E',
  },
  selectedOptionText: {
    color: '#6366f1',
  },
});

export default QuestionnaireScreen; 