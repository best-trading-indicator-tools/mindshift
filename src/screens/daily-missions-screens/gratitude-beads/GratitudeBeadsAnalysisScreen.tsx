import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import Config from 'react-native-config';
import RNFS from 'react-native-fs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { markDailyExerciseAsCompleted, markChallengeExerciseAsCompleted } from '../../../utils/exerciseCompletion';
import LinearGradient from 'react-native-linear-gradient';

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

const ANALYSIS_STEPS = [
  {
    text: "Transcribing your gratitude expressions...",
    icon: "text-to-speech",
    color: "#EC4899" // Pink
  },
  {
    text: "Identifying gratitude patterns...",
    icon: "pattern",
    color: "#8B5CF6" // Purple
  },
  {
    text: "Analyzing emotional depth...",
    icon: "heart-pulse",
    color: "#EF4444" // Red
  },
  {
    text: "Discovering recurring themes...",
    icon: "telescope",
    color: "#F59E0B" // Amber
  },
  {
    text: "Mapping relationship connections...",
    icon: "account-group",
    color: "#10B981" // Emerald
  },
  {
    text: "Measuring mindfulness levels...",
    icon: "meditation",
    color: "#3B82F6" // Blue
  },
  {
    text: "Generating personalized insights...",
    icon: "lightbulb-on",
    color: "#6366F1" // Indigo
  }
];

const GratitudeBeadsAnalysisScreen: React.FC<Props> = ({ navigation, route }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'transcribing' | 'analyzing' | 'complete'>('transcribing');
  const [progress, setProgress] = useState(0);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollIndicatorOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const scrollIndicatorStyle = {
    opacity: scrollIndicatorOpacity,
  };

  const transcribeAudio = async (audioPath: string): Promise<string> => {
    try {
      // Create form data
      const formData = new FormData();
      
      // Create file object from local path
      formData.append('file', {
        uri: `file://${audioPath}`,
        type: 'audio/m4a',
        name: 'recording.m4a'
      } as any);
      
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'json');
      // Let Whisper auto-detect the language
      
      console.log('Sending file to Whisper:', audioPath);
      console.log('FormData:', JSON.stringify(formData));

      // Call Whisper API
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Config.OPENAI_API_KEY}`,
          'Accept': 'application/json',
        },
        body: formData
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        console.error('Whisper API error details:', responseText);
        throw new Error(`Whisper API error: ${response.status} - ${responseText}`);
      }

      try {
        const data = JSON.parse(responseText);
        if (!data.text) {
          throw new Error('No transcription text in response');
        }
        return data.text;
      } catch (parseError: Error | unknown) {
        console.error('JSON Parse error:', parseError);
        console.error('Response that failed to parse:', responseText);
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown error';
        throw new Error(`Failed to parse API response: ${errorMessage}`);
      }

    } catch (error: Error | unknown) {
      console.error('Transcription error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to transcribe audio: ${errorMessage}`);
      throw error;
    }
  };

  const analyzeGratitudes = async (transcriptions: Transcription[]): Promise<Analysis> => {
    try {
      const prompt = `Analyze these ${transcriptions.length} gratitude expressions (provide analysis in English regardless of the input language):

Your recordings:
${transcriptions.map(t => `"${t.text}"`).join('\n')}

Please provide a natural, conversational analysis that feels like a friend giving feedback:

1. A warm, personal summary of your overall gratitude expressions
2. Individual insights about each expression, written naturally without numbering or labeling
3. Thoughtful recommendations based on your expressions

Format as JSON:
{
  "summary": "A warm, natural summary of your gratitude expressions",
  "insights": [
    "A natural insight about your first expression, focusing on what it reveals about you",
    "A connected insight about your next expression, showing how it relates to your values"
  ],
  "recommendations": [
    "A personal suggestion based on what you've expressed",
    "Another thoughtful recommendation that builds on your gratitude practice"
  ]
}

Example tone:
"You've shown a beautiful appreciation for..." instead of "Bead 1 shows..."
"This connects with your earlier gratitude..." instead of "In Bead 2..."
"I notice how you value..." instead of "The analysis indicates..."
`;

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

  const handleComplete = async () => {
    try {
      if (route.params?.context === 'challenge' && route.params.challengeId) {
        await markChallengeExerciseAsCompleted(route.params.challengeId, 'gratitude-beads');
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
        await markDailyExerciseAsCompleted('gratitude-beads');
        navigation.navigate('MainTabs');
      }
    } catch (error) {
      console.error('Error completing exercise:', error);
      Alert.alert('Error', 'Failed to mark exercise as completed');
    }
  };

  const renderLoadingState = () => {
    const stepIndex = Math.min(
      Math.floor(progress * ANALYSIS_STEPS.length),
      ANALYSIS_STEPS.length - 1
    );

    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons
          name={ANALYSIS_STEPS[stepIndex].icon}
          size={48}
          color={ANALYSIS_STEPS[stepIndex].color}
        />
        <Text style={styles.loadingText}>
          {ANALYSIS_STEPS[stepIndex].text}
        </Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
      </View>
    );
  };

  const renderAnalysis = () => (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          scrollY.setValue(offsetY);
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
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

            <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
              <Text style={styles.completeButtonText}>Complete Exercise</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Animated.View style={[styles.scrollIndicatorContainer, scrollIndicatorStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(15, 23, 42, 0)', 'rgba(15, 23, 42, 0.95)', 'rgba(15, 23, 42, 1)']}
          style={styles.scrollIndicatorGradient}
        >
          <View style={styles.scrollIndicator}>
            <MaterialCommunityIcons 
              name="chevron-double-down" 
              size={24} 
              color="#38BDF8" 
            />
            <Text style={styles.scrollIndicatorText}>Scroll for more insights</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
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
    backgroundColor: '#0F172A',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#E2E8F0',
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E2E8F0',
    textAlign: 'center',
    marginVertical: 24,
    marginTop: 50,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#38BDF8',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  text: {
    fontSize: 16,
    color: '#E2E8F0',
    lineHeight: 26,
    flexShrink: 1,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
    paddingRight: 12,
  },
  completeButton: {
    backgroundColor: '#38BDF8',
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completeButtonText: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 24,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 2,
  },
  scrollIndicatorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  scrollIndicatorGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  scrollIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollIndicatorText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default GratitudeBeadsAnalysisScreen; 