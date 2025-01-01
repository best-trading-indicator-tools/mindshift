import AsyncStorage from '@react-native-async-storage/async-storage';

const QUESTIONNAIRE_STATUS_KEY = '@questionnaire_status';
const QUESTIONNAIRE_RESPONSES_KEY = '@questionnaire_responses';

export type QuestionnaireStatus = 'not_started' | 'in_progress' | 'completed';

export type ScaleQuestion = {
  id: number;
  question: string;
  type: 'scale';
  options: number[];
};

export type FrequencyQuestion = {
  id: number;
  question: string;
  type: 'frequency';
  options: string[];
};

export type Question = ScaleQuestion | FrequencyQuestion;

export const questions: Question[] = [
  {
    id: 1,
    question: 'How would you rate your overall stress level?',
    type: 'scale',
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 2,
    question: 'How often do you experience nightmares or disturbing dreams?',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Very Often']
  },
  {
    id: 3,
    question: 'Do you find yourself overthinking during sleep or having racing thoughts?',
    type: 'scale',
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 4,
    question: 'How often do you experience physical anxiety symptoms (heart palpitations, tension, etc.)?',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Very Often']
  },
  {
    id: 5,
    question: 'Do you feel in control of your emotions throughout the day?',
    type: 'scale',
    options: [1, 2, 3, 4, 5]
  },
  {
    id: 6,
    question: 'How often do negative thoughts interfere with your daily activities?',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Very Often']
  },
  {
    id: 7,
    question: 'How would you rate your ability to let go of past experiences?',
    type: 'scale',
    options: [1, 2, 3, 4, 5]
  }
];

export const getQuestionnaireStatus = async (): Promise<QuestionnaireStatus> => {
  try {
    const status = await AsyncStorage.getItem(QUESTIONNAIRE_STATUS_KEY);
    return (status as QuestionnaireStatus) || 'not_started';
  } catch (error) {
    console.error('Error getting questionnaire status:', error);
    return 'not_started';
  }
};

export const setQuestionnaireStatus = async (status: QuestionnaireStatus): Promise<void> => {
  try {
    await AsyncStorage.setItem(QUESTIONNAIRE_STATUS_KEY, status);
  } catch (error) {
    console.error('Error setting questionnaire status:', error);
  }
};

export const getQuestionnaireResponses = async () => {
  try {
    const responses = await AsyncStorage.getItem(QUESTIONNAIRE_RESPONSES_KEY);
    return responses ? JSON.parse(responses) : null;
  } catch (error) {
    console.error('Error getting questionnaire responses:', error);
    return null;
  }
};

export const saveQuestionnaireResponses = async (responses: any) => {
  try {
    await AsyncStorage.setItem(QUESTIONNAIRE_RESPONSES_KEY, JSON.stringify(responses));
  } catch (error) {
    console.error('Error saving questionnaire responses:', error);
  }
};

export const markQuestionnaireCompleted = async (): Promise<void> => {
  await setQuestionnaireStatus('completed');
}; 