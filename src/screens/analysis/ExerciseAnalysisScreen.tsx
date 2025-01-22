import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { config } from '../../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingProgressBar from '../../components/ProgressBar';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseAnalysis'>;

interface AnalysisResult {
  emotionalTone: {
    primary: string;
    secondary: string[];
    intensity: number;
  };
  themes: {
    name: string;
    frequency: number;
    examples: string[];
  }[];
  insights: {
    main: string;
    suggestion: string;
    celebration: string;
    nextFocus: string;
  };
}

const ExerciseAnalysisScreen: React.FC<Props> = ({ navigation, route }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAnalysisPrompt = (exerciseType: string, entries: string[]) => {
    switch (exerciseType) {
      case 'gratitude':
        return `You are an AI coach analyzing gratitude entries. Respond ONLY with a JSON object in this exact format:
          {
            "emotionalTone": {
              "primary": "string with main emotion",
              "secondary": ["array of other emotions"],
              "intensity": number between 1-10
            },
            "themes": [
              {
                "name": "string with theme name",
                "frequency": number of occurrences,
                "examples": ["array of example quotes"]
              }
            ],
            "insights": {
              "main": "string with main observation",
              "suggestion": "string with growth suggestion",
              "celebration": "string with celebration message",
              "nextFocus": "string with suggested focus"
            }
          }

          Analyze these gratitude entries:
          ${JSON.stringify(entries)}`;

      case 'checklist':
        return `You are an AI coach analyzing achievement entries. Respond ONLY with a JSON object in this exact format:
          {
            "emotionalTone": {
              "primary": "string with main emotion",
              "secondary": ["array of other emotions"],
              "intensity": number between 1-10
            },
            "themes": [
              {
                "name": "string with theme name",
                "frequency": number of occurrences,
                "examples": ["array of example quotes"]
              }
            ],
            "insights": {
              "main": "string with main observation",
              "suggestion": "string with growth suggestion",
              "celebration": "string with celebration message",
              "nextFocus": "string with suggested focus"
            }
          }

          Analyze these achievement entries:
          ${JSON.stringify(entries)}`;

      case 'incantations':
        return `You are an AI coach analyzing affirmations. Respond ONLY with a JSON object in this exact format:
          {
            "emotionalTone": {
              "primary": "string with main emotion",
              "secondary": ["array of other emotions"],
              "intensity": number between 1-10
            },
            "themes": [
              {
                "name": "string with theme name",
                "frequency": number of occurrences,
                "examples": ["array of example quotes"]
              }
            ],
            "insights": {
              "main": "string with main observation",
              "suggestion": "string with growth suggestion",
              "celebration": "string with celebration message",
              "nextFocus": "string with suggested focus"
            }
          }

          Analyze these affirmations:
          ${JSON.stringify(entries)}`;

      default:
        return '';
    }
  };

  const analyzeEntries = async () => {
    try {
      const { exerciseType, entries } = route.params;
      console.log('Starting analysis for:', { exerciseType, entries });
      
      if (!config.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is missing');
      }

      const prompt = getAnalysisPrompt(exerciseType, entries);
      console.log('Using prompt:', prompt);

      const requestBody = {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an AI coach that analyzes user entries and provides insights. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      };

      console.log('Making OpenAI request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('Raw OpenAI response:', responseText);

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('Parsed OpenAI response:', data);
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from OpenAI: missing content');
      }

      const content = data.choices[0].message.content;
      console.log('Content to parse:', content);

      const analysisResult = JSON.parse(content.trim());
      console.log('Parsed analysis result:', analysisResult);

      if (!analysisResult.emotionalTone || !analysisResult.themes || !analysisResult.insights) {
        console.error('Invalid analysis format:', analysisResult);
        throw new Error('Invalid analysis format: missing required fields');
      }

      setAnalysis(analysisResult);

      // Store analysis for progress tracking
      const storageKey = `${exerciseType}_analysis_history`;
      const historyString = await AsyncStorage.getItem(storageKey);
      const history = historyString ? JSON.parse(historyString) : [];
      history.push({
        date: new Date().toISOString(),
        analysis: analysisResult,
      });
      await AsyncStorage.setItem(storageKey, JSON.stringify(history.slice(-10)));

    } catch (err) {
      console.error('Analysis error:', err);
      if (err instanceof Error) {
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
        });
      }
      setError(err instanceof Error ? err.message : 'Failed to analyze entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeEntries();
  }, [route.params]);

  const handleContinue = () => {
    const { context, challengeId, returnTo } = route.params;
    
    if (context === 'challenge' && challengeId) {
      navigation.navigate('ChallengeDetail', {
        challenge: {
          id: challengeId,
          title: 'Ultimate',
          duration: 21,
          description: 'Your subconscious mind shapes your reality.',
          image: require('../../assets/illustrations/challenges/challenge-21.png')
        }
      });
    } else {
      navigation.navigate('MainTabs');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Analyzing your progress...</Text>
          <LoadingProgressBar width={250} height={4} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Something went wrong</Text>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {analysis && (
          <>
            <Text style={styles.title}>Your Progress Insights</Text>
            
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Overall Tone</Text>
              <Text style={styles.primaryEmotion}>{analysis.emotionalTone.primary}</Text>
              <View style={styles.emotionChips}>
                {analysis.emotionalTone.secondary.map((emotion, index) => (
                  <Text key={index} style={styles.emotionChip}>{emotion}</Text>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Key Themes</Text>
              {analysis.themes.map((theme, index) => (
                <View key={index} style={styles.themeItem}>
                  <Text style={styles.themeName}>{theme.name}</Text>
                  <Text style={styles.themeFrequency}>Mentioned {theme.frequency} times</Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Personal Insights</Text>
              <Text style={styles.insightText}>{analysis.insights.main}</Text>
              <Text style={styles.celebrationText}>{analysis.insights.celebration}</Text>
              <Text style={styles.suggestionText}>{analysis.insights.suggestion}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Next Focus</Text>
              <Text style={styles.nextFocusText}>{analysis.insights.nextFocus}</Text>
            </View>
          </>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 10,
    paddingTop: 0,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
  },
  errorText: {
    color: '#FF0000',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  primaryEmotion: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  emotionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  emotionChip: {
    backgroundColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    margin: 4,
    color: '#FFFFFF',
  },
  themeItem: {
    marginBottom: 10,
  },
  themeName: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  themeFrequency: {
    fontSize: 14,
    color: '#888888',
  },
  insightText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
    lineHeight: 24,
  },
  celebrationText: {
    fontSize: 16,
    color: '#FFD700',
    marginBottom: 10,
    lineHeight: 24,
  },
  suggestionText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  nextFocusText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    borderRadius: 25,
    marginHorizontal: 20,
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ExerciseAnalysisScreen; 