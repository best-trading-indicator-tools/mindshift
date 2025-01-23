import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import Config from 'react-native-config';
import RNFS from 'react-native-fs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { markDailyExerciseAsCompleted, markChallengeExerciseAsCompleted } from '../../../utils/exerciseCompletion';

type Props = NativeStackScreenProps<RootStackParamList, 'GratitudeBeadsAnalysis'>;

interface Transcription {
  beadIndex: number;
  text: string;
}

interface Analysis {
  summary: string;
  insights: string[];
  recommendations: string[];
}

const GratitudeBeadsAnalysisScreen: React.FC<Props> = ({ navigation, route }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'transcribing' | 'analyzing' | 'complete'>('transcribing');
  const [progress, setProgress] = useState(0);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transcribeAudio = async (audioPath: string): Promise<string> => {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri: audioPath,
        type: 'audio/wav',
        name: 'audio.wav'
      } as any); // Type assertion to bypass TypeScript checking for RN
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      // Call Whisper API
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Config.OPENAI_API_KEY}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Whisper API error: ${response.status}`);
      }

      const data = await response.json();
      return data.text;

    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  };

  const analyzeGratitudes = async (transcriptions: Transcription[]): Promise<Analysis> => {
    try {
      const prompt = `Analyze these ${transcriptions.length} gratitude expressions:
      ${transcriptions.map(t => `${t.beadIndex + 1}. "${t.text}"`).join('\n')}

      Please provide:
      1. A brief summary of their overall gratitude practice
      2. Key insights about what they value and appreciate
      3. Personalized recommendations for deepening their gratitude practice

      Format the response as JSON with these keys:
      {
        "summary": "overall summary",
        "insights": ["insight 1", "insight 2", ...],
        "recommendations": ["recommendation 1", "recommendation 2", ...]
      }`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Config.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{
            role: 'user',
            content: prompt
          }],
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        throw new Error(`GPT-4 API error: ${response.status}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);

    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  };

  const processRecordings = async () => {
    try {
      // Transcribe all recordings
      const totalRecordings = route.params.recordings.length;
      const transcriptionResults: Transcription[] = [];

      for (let i = 0; i < totalRecordings; i++) {
        const recording = route.params.recordings[i];
        const text = await transcribeAudio(recording.audioPath);
        transcriptionResults.push({
          beadIndex: recording.beadIndex,
          text: text
        });
        setProgress((i + 1) / totalRecordings);
      }

      setTranscriptions(transcriptionResults);
      setCurrentStep('analyzing');

      // Analyze transcriptions
      const analysisResult = await analyzeGratitudes(transcriptionResults);
      setAnalysis(analysisResult);
      setCurrentStep('complete');

    } catch (error) {
      console.error('Processing error:', error);
      setError('An error occurred while processing your gratitudes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    processRecordings();
  }, []);

  const handleComplete = () => {
    if (route.params?.context === 'challenge' && route.params.challengeId) {
      navigation.navigate('ChallengeDetail', {
        challenge: {
          id: route.params.challengeId,
          title: 'Ultimate',
          duration: 21,
          description: 'Your subconscious mind shapes your reality.',
          image: require('../../../assets/illustrations/challenges/challenge-21.png')
        }
      });
    } else {
      navigation.navigate('MainTabs');
    }
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FFD700" />
      <Text style={styles.loadingText}>
        {currentStep === 'transcribing' 
          ? `Transcribing your gratitudes... ${Math.round(progress * 100)}%`
          : 'Analyzing your gratitude practice...'}
      </Text>
    </View>
  );

  const renderAnalysis = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Your Gratitude Analysis</Text>
      
      {analysis && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.text}>{analysis.summary}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Insights</Text>
            {analysis.insights.map((insight, index) => (
              <View key={index} style={styles.bulletPoint}>
                <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
                <Text style={styles.text}>{insight}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {analysis.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.bulletPoint}>
                <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#FFD700" />
                <Text style={styles.text}>{recommendation}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
        <Text style={styles.completeButtonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
          <Text style={styles.completeButtonText}>Return Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading || currentStep !== 'complete' ? renderLoadingState() : renderAnalysis()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 24,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  completeButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 24,
  },
  completeButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
});

export default GratitudeBeadsAnalysisScreen; 