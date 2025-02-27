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

// Types for Gratitude Analysis
interface EmotionalAnalysis {
  dominantEmotion: string;
  emotionalGrowth: string;
  emotionalInsight: string;
}

interface ThematicAnalysis {
  recurringThemes: string;
  valueAlignment: string;
  lifeAreas: string;
}

interface PersonalGrowth {
  selfAwareness: string;
  mindsetShift: string;
  futureOrientation: string;
}

interface RelationshipInsights {
  connections: string;
  appreciation: string;
  socialImpact: string;
}

interface GratitudeAnalysis {
  emotionalAnalysis: EmotionalAnalysis;
  thematicAnalysis: ThematicAnalysis;
  personalGrowth: PersonalGrowth;
  relationshipInsights: RelationshipInsights;
}

const ANALYSIS_STEPS = [
  "Reading your gratitude entries...",
  "Analyzing emotional patterns...",
  "Identifying recurring themes...",
  "Mapping personal growth...",
  "Discovering relationship insights...",
  "Creating your personalized analysis..."
];

type Props = NativeStackScreenProps<RootStackParamList, 'GratitudeAnalysis'>;

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export const GratitudeAnalysisScreen: React.FC<Props> = ({ navigation, route }) => {
  const [analysis, setAnalysis] = useState<GratitudeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const getAnalysisPrompt = (entries: string[]) => {
    return {
      role: "system",
      content: `You are an AI analyzing daily gratitude entries. Provide a deep, personal analysis in a conversational tone. Focus on emotional patterns, personal growth, and meaningful insights. Structure your response as a JSON object with the following format:

{
  "emotionalAnalysis": {
    "dominantEmotion": "A paragraph about the primary emotions expressed...",
    "emotionalGrowth": "A paragraph about emotional development...",
    "emotionalInsight": "A paragraph with deeper emotional understanding..."
  },
  "thematicAnalysis": {
    "recurringThemes": "A paragraph about common themes in gratitude...",
    "valueAlignment": "A paragraph about personal values reflected...",
    "lifeAreas": "A paragraph about life areas most appreciated..."
  },
  "personalGrowth": {
    "selfAwareness": "A paragraph about increased self-awareness...",
    "mindsetShift": "A paragraph about changes in perspective...",
    "futureOrientation": "A paragraph about growth opportunities..."
  },
  "relationshipInsights": {
    "connections": "A paragraph about relationship patterns...",
    "appreciation": "A paragraph about deepening appreciation...",
    "socialImpact": "A paragraph about social connections..."
  }
}

Guidelines:
- Write in a warm, personal tone
- Focus on patterns and deeper meanings
- Connect insights to personal growth
- Suggest actionable ways to deepen gratitude practice
- Highlight unique aspects of the person's gratitude style

Analyze these entries: ${JSON.stringify(entries)}`
    };
  };

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const loadingInterval = setInterval(() => {
          setLoadingStep(step => (step + 1) % ANALYSIS_STEPS.length);
        }, 3000);

        const messages = [getAnalysisPrompt(route.params.entries)];
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: messages,
            temperature: 0.7,
            max_tokens: 1500,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analysis');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const parsedContent = JSON.parse(content);
        
        setAnalysis(parsedContent);
        clearInterval(loadingInterval);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analysis:', err);
        setError('Failed to generate analysis. Please try again.');
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [route.params.entries]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <LoadingProgressBar text={ANALYSIS_STEPS[loadingStep]} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gratitude Analysis</Text>
      </View>

      <AnimatedScrollView
        style={styles.scrollView}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {analysis && (
          <View style={styles.content}>
            {/* Emotional Analysis Section */}
            <View style={styles.section}>
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                style={styles.sectionHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.sectionTitle}>Emotional Patterns</Text>
              </LinearGradient>
              <View style={styles.sectionContent}>
                <Text style={styles.analysisText}>{analysis.emotionalAnalysis.dominantEmotion}</Text>
                <Text style={styles.analysisText}>{analysis.emotionalAnalysis.emotionalGrowth}</Text>
                <Text style={styles.analysisText}>{analysis.emotionalAnalysis.emotionalInsight}</Text>
              </View>
            </View>

            {/* Thematic Analysis Section */}
            <View style={styles.section}>
              <LinearGradient
                colors={['#fad0c4', '#ff9a9e']}
                style={styles.sectionHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.sectionTitle}>Themes & Values</Text>
              </LinearGradient>
              <View style={styles.sectionContent}>
                <Text style={styles.analysisText}>{analysis.thematicAnalysis.recurringThemes}</Text>
                <Text style={styles.analysisText}>{analysis.thematicAnalysis.valueAlignment}</Text>
                <Text style={styles.analysisText}>{analysis.thematicAnalysis.lifeAreas}</Text>
              </View>
            </View>

            {/* Personal Growth Section */}
            <View style={styles.section}>
              <LinearGradient
                colors={['#84fab0', '#8fd3f4']}
                style={styles.sectionHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.sectionTitle}>Personal Growth</Text>
              </LinearGradient>
              <View style={styles.sectionContent}>
                <Text style={styles.analysisText}>{analysis.personalGrowth.selfAwareness}</Text>
                <Text style={styles.analysisText}>{analysis.personalGrowth.mindsetShift}</Text>
                <Text style={styles.analysisText}>{analysis.personalGrowth.futureOrientation}</Text>
              </View>
            </View>

            {/* Relationship Insights Section */}
            <View style={styles.section}>
              <LinearGradient
                colors={['#a18cd1', '#fbc2eb']}
                style={styles.sectionHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.sectionTitle}>Relationship Insights</Text>
              </LinearGradient>
              <View style={styles.sectionContent}>
                <Text style={styles.analysisText}>{analysis.relationshipInsights.connections}</Text>
                <Text style={styles.analysisText}>{analysis.relationshipInsights.appreciation}</Text>
                <Text style={styles.analysisText}>{analysis.relationshipInsights.socialImpact}</Text>
              </View>
            </View>
          </View>
        )}
      </AnimatedScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1E1E1E',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionContent: {
    padding: 16,
  },
  analysisText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 