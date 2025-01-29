import React, { useState, useEffect } from 'react';
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

// Exporter les animations pour pouvoir les précharger
export const LOTTIE_ANIMATIONS: Record<number, any> = {
  0: require('../../assets/illustrations/questionnaire/question-1.lottie'),
  1: require('../../assets/illustrations/questionnaire/question-2.lottie'),
  2: require('../../assets/illustrations/questionnaire/question-3.lottie'),
  3: require('../../assets/illustrations/questionnaire/question-4.lottie'),
  4: require('../../assets/illustrations/questionnaire/question-5.lottie'),
  5: require('../../assets/illustrations/questionnaire/question-6.lottie'),
  6: require('../../assets/illustrations/questionnaire/question-7.lottie'),
} as const;

const QuestionnaireScreen: React.FC<Props> = ({ navigation }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);

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
      setIsTransitioning(true);
      setAnswers(newAnswers);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
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
      <View style={questionStyles.frequencyContainer}>
        {question.options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              currentQuestionIndex === 3 ? questionStyles.frequencyOption : styles.frequencyOption,
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

  const getQuestionSpecificStyles = () => {
    // Ajustements spécifiques pour la question 4 (index 3)
    if (currentQuestionIndex === 3) {
      return {
        lottieContainer: {
          ...styles.lottieContainer,
          height: 140, // Réduire la hauteur de l'image
          marginBottom: 10, // Réduire l'espace sous l'image
        },
        questionContainer: {
          ...styles.questionContainer,
          marginBottom: 15, // Réduire l'espace sous la question
        },
        questionText: {
          ...styles.questionText,
          fontSize: 28, // Réduire légèrement la taille du texte
        },
        frequencyContainer: {
          ...styles.frequencyContainer,
          marginTop: 0,
          paddingHorizontal: 20,
        },
        frequencyOption: {
          ...styles.frequencyOption,
          marginBottom: 8, // Réduire l'espace entre les options
          padding: 14, // Réduire légèrement le padding des options
        }
      };
    }
    return {
      lottieContainer: styles.lottieContainer,
      questionContainer: styles.questionContainer,
      questionText: styles.questionText,
      frequencyContainer: styles.frequencyContainer,
      frequencyOption: styles.frequencyOption,
    };
  };

  const questionStyles = getQuestionSpecificStyles();

  // Rendu de toutes les animations
  const renderAllAnimations = () => {
    return Object.values(LOTTIE_ANIMATIONS).map((animation, index) => (
      <View 
        key={index} 
        style={[
          styles.lottieContainer,
          // On cache les animations qui ne correspondent pas à la question actuelle
          { opacity: currentQuestionIndex === index ? 1 : 0,
            position: currentQuestionIndex === index ? 'relative' : 'absolute' }
        ]}
      >
        <LottieView
          source={animation}
          autoPlay={currentQuestionIndex === index}
          loop
          style={styles.lottieAnimation}
        />
      </View>
    ));
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
          {/* Au lieu d'avoir une seule animation qui change,
              on a toutes les animations déjà chargées */}
          {/* {renderAllAnimations()} */}
          
          <View style={questionStyles.questionContainer}>
            <Text style={questionStyles.questionText}>{currentQuestion.question}</Text>
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
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  lottieContainer: {
    width: '100%',
    height: 160,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  questionContainer: {
    marginBottom: 30,
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
    marginTop: 10,
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