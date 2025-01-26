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
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';

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
        await Promise.all([
          saveQuestionnaireResponses(newAnswers),
          markQuestionnaireCompleted()
        ]);
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
    <LinearGradient 
      colors={['#0F172A', '#1E3A5F', '#2D5F7C']}
      style={styles.container}
      start={{x: 0.5, y: 0}}
      end={{x: 0.5, y: 1}}
    >
      <SafeAreaView style={styles.safeContainer}>
        <QuestionnaireProgressHeader
          currentStep={currentQuestionIndex + 1}
          totalSteps={totalQuestions}
          onBack={handleBack}
          showBackButton={currentQuestionIndex > 0}
        />
        
        <View style={styles.content}>
          {currentQuestionIndex === 0 && (
            <View style={styles.lottieContainer}>
              <LottieView
                source={require('../../assets/illustrations/questionnaire/question-1.lottie')}
                autoPlay
                loop
                style={styles.lottieAnimation}
              />
            </View>
          )}
          {currentQuestionIndex === 1 && (
            <View style={[styles.lottieContainer, { marginBottom: 16 }]}>
              <LottieView
                source={require('../../assets/illustrations/questionnaire/question-2.lottie')}
                autoPlay
                loop
                style={styles.lottieAnimation}
              />
            </View>
          )}
          {currentQuestionIndex === 2 && (
            <View style={[styles.lottieContainer, { height: 160 }]}>
              <LottieView
                source={require('../../assets/illustrations/questionnaire/question-3.lottie')}
                autoPlay
                loop
                style={styles.lottieAnimation}
              />
            </View>
          )}
          {currentQuestionIndex === 3 && (
            <View style={[styles.lottieContainer, { height: 160, marginBottom: 16 }]}>
              <LottieView
                source={require('../../assets/illustrations/questionnaire/question-4.lottie')}
                autoPlay
                loop
                style={styles.lottieAnimation}
              />
            </View>
          )}
          {currentQuestionIndex === 4 && (
            <View style={[styles.lottieContainer, { height: 160, marginBottom: 16 }]}>
              <LottieView
                source={require('../../assets/illustrations/questionnaire/question-5.lottie')}
                autoPlay
                loop
                style={styles.lottieAnimation}
              />
            </View>
          )}
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </View>
          {renderOptions()}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  lottieContainer: {
    width: '100%',
    height: 200,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  questionContainer: {
    marginBottom: 40,
    paddingHorizontal: 0,
    width: '100%',
    alignSelf: 'center',
  },
  questionText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    paddingHorizontal: 4,
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  scaleOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scaleOptionText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  frequencyContainer: {
    paddingHorizontal: 20,
  },
  frequencyOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  frequencyOptionText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedOption: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  selectedOptionText: {
    color: '#D4AF37',
  },
});

export default QuestionnaireScreen; 