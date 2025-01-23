import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { config } from '../../../config/env';
import LoadingProgressBar from '../../../components/ProgressBar';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ChecklistEntry } from '../../../types/checklist';

// Types for Golden Checklist Analysis
interface GoldenChecklistPatternAnalysis {
  routineInsight: string;
  habitConnections: string;
  hiddenPatterns: string;
}

interface GoldenChecklistHabitStacking {
  naturalSequences: string;
  synergies: string;
  implementation: string;
}

interface GoldenChecklistImpactAnalysis {
  physical: string;
  mental: string;
  emotional: string;
  social: string;
}

interface GoldenChecklistGrowthStrategy {
  currentStrengths: string;
  nextLevel: string;
  longTermVision: string;
}

interface GoldenChecklistAnalysis {
  patternAnalysis: GoldenChecklistPatternAnalysis;
  habitStacking: GoldenChecklistHabitStacking;
  impactAnalysis: GoldenChecklistImpactAnalysis;
  growthStrategy: GoldenChecklistGrowthStrategy;
}

interface GoldenChecklistAnalysisParams {
  entries: ChecklistEntry[];
  context?: 'challenge' | 'daily';
  challengeId?: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'GoldenChecklistAnalysis'>;

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const ANALYSIS_STEPS = [
  "Analyzing your daily habits...",
  "Identifying behavior patterns...",
  "Discovering habit correlations...",
  "Calculating success probabilities...",
  "Generating habit stacks...",
  "Mapping impact zones...",
  "Creating personalized insights..."
];

export const GoldenChecklistAnalysisScreen: React.FC<Props> = ({ navigation, route }) => {
  const [analysis, setAnalysis] = useState<GoldenChecklistAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const getAnalysisPrompt = (entries: ChecklistEntry[]) => {
    return `You are James Clear, the author of Atomic Habits, analyzing daily routines to find powerful habit-building opportunities.

Here are the habits the user has completed today:
${JSON.stringify(entries, null, 2)}

FOCUS ON:
1. Pattern Analysis:
  - Identify deep connections between habits
  - Explain how habits influence each other
  - Reveal non-obvious patterns in their routine

2. Habit Stacking Opportunities:
  - Suggest natural sequences based on their current habits
  - Explain why certain habits work well together
  - Show how to create powerful habit chains

3. Impact Analysis:
  - Analyze the holistic impact on their life
  - Show compound effects over time
  - Reveal hidden benefits they might not see

4. Growth Strategy:
  - Provide personalized evolution path
  - Suggest how to deepen existing habits
  - Show next level opportunities

Respond ONLY with a JSON object in this exact format, focusing on detailed, personalized analysis:
{
  "patternAnalysis": {
    "routineInsight": "A detailed paragraph analyzing their routine patterns...",
    "habitConnections": "A paragraph explaining how their habits connect and influence each other...",
    "hiddenPatterns": "A paragraph revealing non-obvious patterns in their routine..."
  },
  "habitStacking": {
    "naturalSequences": "A paragraph suggesting natural habit sequences based on their current habits...",
    "synergies": "A paragraph explaining which habits naturally complement each other and why...",
    "implementation": "A detailed paragraph on how to implement these habit stacks..."
  },
  "impactAnalysis": {
    "physical": "A paragraph analyzing physical health impacts...",
    "mental": "A paragraph analyzing mental and cognitive impacts...",
    "emotional": "A paragraph analyzing emotional well-being impacts...",
    "social": "A paragraph analyzing social life impacts..."
  },
  "growthStrategy": {
    "currentStrengths": "A paragraph highlighting what they're doing well...",
    "nextLevel": "A paragraph suggesting how to evolve their habits...",
    "longTermVision": "A paragraph painting a picture of their potential future..."
  }
}

Guidelines for analysis:
1. Write in a personal, conversational tone
2. Use "you" and "your" to make it feel direct and personal
3. Provide specific, actionable insights
4. Connect different aspects of their routine
5. Show both immediate and long-term impacts
6. Focus on positive reinforcement
7. Make it feel like a personal coaching session

Additional context:
- Focus on the synergistic effects between habits
- Show how small changes compound over time
- Help them see the bigger picture of their routine
- Provide concrete next steps while acknowledging current progress`;
  };

  const analyzeEntries = async () => {
    try {
      const { entries } = route.params;
      
      if (!config.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is missing');
      }

      const prompt = getAnalysisPrompt(entries);

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

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from OpenAI');
      }

      const analysisResult = JSON.parse(data.choices[0].message.content.trim());
      setAnalysis(analysisResult);
      setLoading(false);

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze entries');
      setLoading(false);
    }
  };

  const handleContinue = () => {
    const { context, challengeId } = route.params;
    
    if (context === 'challenge' && challengeId) {
      navigation.navigate('ChallengeDetail', {
        challenge: {
          id: challengeId,
          title: 'Ultimate',
          duration: 21,
          description: 'Your subconscious mind shapes your reality. This 21-day challenge uses proven techniques to rewire your thought patterns and transform your mindset.\nPerfect for anyone seeking deeper happiness, lasting motivation, and emotional well-being.',
          image: require('../../../assets/illustrations/challenges/challenge-21.png')
        }
      });
    } else {
      navigation.navigate('MainTabs');
    }
  };

  useEffect(() => {
    analyzeEntries();
  }, [route.params]);

  useEffect(() => {
    if (loading) {
      const stepInterval = setInterval(() => {
        setLoadingStep((current) => {
          if (current >= ANALYSIS_STEPS.length - 1) {
            clearInterval(stepInterval);
            return current;
          }
          return current + 1;
        });
      }, 2000);

      return () => clearInterval(stepInterval);
    }
  }, [loading]);

  const scrollIndicatorStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(scrollY.value < 100 ? 1 : 0)
    };
  });

  const renderAnalysisContent = () => {
    if (!analysis) return null;

    return (
      <>
        {/* Pattern Analysis Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="chart-timeline-variant" size={24} color="#4facfe" />
            <Text style={styles.cardTitle}>Pattern Analysis</Text>
          </View>
          <Text style={styles.highlightText}>{analysis.patternAnalysis.habitConnections}</Text>
        </View>

        {/* Habit Stacking Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="layers-triple" size={24} color="#4facfe" />
            <Text style={styles.cardTitle}>Habit Stacking</Text>
          </View>
          <Text style={styles.highlightText}>{analysis.habitStacking.naturalSequences}</Text>
        </View>

        {/* Impact Analysis Cards */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="target" size={24} color="#4facfe" />
            <Text style={styles.cardTitle}>Impact Analysis</Text>
          </View>
          <View style={styles.impactSection}>
            <Text style={styles.sectionTitle}>Physical Impact</Text>
            <Text style={styles.highlightText}>{analysis.impactAnalysis.physical}</Text>
          </View>
          <View style={styles.impactSection}>
            <Text style={styles.sectionTitle}>Mental Impact</Text>
            <Text style={styles.highlightText}>{analysis.impactAnalysis.mental}</Text>
          </View>
        </View>

        {/* Growth Strategy Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="trending-up" size={24} color="#4facfe" />
            <Text style={styles.cardTitle}>Growth Strategy</Text>
          </View>
          <Text style={styles.highlightText}>{analysis.growthStrategy.currentStrengths}</Text>
          <Text style={styles.highlightText}>{analysis.growthStrategy.nextLevel}</Text>
        </View>
      </>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: '#1E2132' }]}>
        <StatusBar backgroundColor="#1E2132" barStyle="light-content" />
        <View style={[styles.container, { backgroundColor: '#1E2132' }]}>
          <View style={styles.loadingContainer}>
            <MaterialCommunityIcons 
              name="brain" 
              size={48} 
              color="#4facfe"
              style={styles.loadingIcon} 
            />
            <Text style={styles.loadingTitle}>AI Analysis in Progress</Text>
            <Text style={styles.loadingStep}>{ANALYSIS_STEPS[loadingStep]}</Text>
            <LoadingProgressBar 
              width={250} 
              height={4} 
              color="#4facfe" 
            />
            <Text style={styles.loadingSubtext}>Creating your personalized habit insights</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: '#1E2132' }]}>
        <StatusBar backgroundColor="#1E2132" barStyle="light-content" />
        <View style={[styles.container, { backgroundColor: '#1E2132' }]}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={[styles.button, { marginTop: 20 }]} 
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#1E2132" barStyle="light-content" />
      <LinearGradient colors={['#1E2132', '#2A2D3E']} style={styles.gradientBackground}>
        <View style={styles.container}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={navigation.goBack}
          >
            <MaterialCommunityIcons name="chevron-left" size={32} color="#4facfe" />
          </TouchableOpacity>

          <AnimatedScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
          >
            {renderAnalysisContent()}
          </AnimatedScrollView>

          {/* Scroll indicator */}
          <Animated.View style={[styles.scrollIndicatorContainer, scrollIndicatorStyle]}>
            <LinearGradient
              colors={['rgba(30, 33, 50, 0)', 'rgba(30, 33, 50, 0.95)', 'rgba(30, 33, 50, 1)']}
              style={styles.scrollIndicatorGradient}
            >
              <View style={styles.scrollIndicator}>
                <MaterialCommunityIcons 
                  name="chevron-double-down" 
                  size={24} 
                  color="#4facfe" 
                />
                <Text style={styles.scrollIndicatorText}>Scroll for more insights</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleContinue}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E2132',
  },
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 80,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    padding: 24,
  },
  loadingIcon: {
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingStep: {
    fontSize: 18,
    color: '#00f2fe',
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 16,
  },
  errorText: {
    color: '#FF0000',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#00f2fe',
    letterSpacing: 0.5,
  },
  impactSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4facfe',
    marginBottom: 12,
  },
  highlightText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#4facfe',
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    position: 'absolute',
    top: 20,
    left: 0,
    zIndex: 10,
  },
  scrollIndicatorContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scrollIndicatorGradient: {
    borderRadius: 20,
    padding: 2,
  },
  scrollIndicator: {
    backgroundColor: 'rgba(30, 33, 50, 0.95)',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollIndicatorText: {
    color: '#4facfe',
    fontSize: 14,
    fontWeight: '500',
  },
}); 