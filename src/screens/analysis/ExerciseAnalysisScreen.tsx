import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  FadeIn,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { config } from '../../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingProgressBar from '../../components/ProgressBar';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Svg, Line } from 'react-native-svg';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseAnalysis'>;

// New types for checklist analysis
interface GoldenChecklistPatternAnalysis {
  optimalTimes: {
    mostProductiveWindow: string;
    keyTimeInsights: string[];
    timeBasedRecommendations: string[];
  };
  taskSequences: {
    mostEffective: string[];
    correlations: {
      trigger: string;
      outcome: string;
      probability: number;
      insight: string;
    }[];
  };
}

interface GoldenChecklistHabitStack {
  trigger: {
    habit: string;
    timeOfDay: string;
    context: string;
  };
  sequence: {
    habit: string;
    waitTime: string;
    reason: string;
  }[];
  totalImpact: string;
  successRate: number;
}

interface GoldenChecklistKeystoneHabit {
  habit: string;
  cascadingEffects: string[];
  implementationTips: string[];
}

interface GoldenChecklistImpactZone {
  score: number;
  potential: number;
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
}

interface GoldenChecklistMomentumBuilders {
  keyMoments: {
    time: string;
    action: string;
    impact: string;
    whyItMatters: string;
  }[];
  tippingPoints: {
    scenario: string;
    successPath: string;
    failurePath: string;
    preventiveAction: string;
  }[];
  microWins: {
    action: string;
    timeToComplete: string;
    benefitGained: string;
  }[];
}

interface GoldenChecklistGrowthOpportunities {
  challengingHabits: {
    habit: string;
    rootCause: string;
    subTasks: string[];
    progressionStrategy: string;
  }[];
  nextLevelHabits: {
    currentHabit: string;
    evolution: string;
    benefits: string[];
    implementationSteps: string[];
  }[];
}

interface GoldenChecklistSuccessProbability {
  habits: {
    name: string;
    probability: number;
    riskFactors: string[];
    preventiveStrategies: string[];
  }[];
  overallSuccess: {
    rate: number;
    keyFactors: string[];
    improvementAreas: string[];
  };
}

interface GoldenChecklistAnalysis {
  patternAnalysis: GoldenChecklistPatternAnalysis;
  habitStacking: {
    recommendedStacks: GoldenChecklistHabitStack[];
    keystoneHabits: GoldenChecklistKeystoneHabit[];
  };
  impactZones: {
    physical: GoldenChecklistImpactZone;
    mental: GoldenChecklistImpactZone;
    emotional: GoldenChecklistImpactZone;
    social: GoldenChecklistImpactZone;
  };
  momentumBuilders: GoldenChecklistMomentumBuilders;
  growthOpportunities: GoldenChecklistGrowthOpportunities;
  successProbability: GoldenChecklistSuccessProbability;
}

interface AnalysisResult {
  emotionalTone?: {
    primary: string;
    secondary: string[];
    intensity: number;
  };
  themes?: {
    name: string;
    frequency: number;
    examples: string[];
    actionableSuggestions: string[];
    growthOpportunities: string[];
  }[];
  strengthSpotlight?: {
    title: string;
    evidence: string[];
    potentialImpact: string;
  };
  patterns?: {
    recurring: string[];
    unique: string[];
    suggested: string[];
  };
  insights?: {
    main: string;
    suggestion: string;
    celebration: string;
    nextFocus: string;
  };
  // Rename to be more specific
  goldenChecklistAnalysis?: GoldenChecklistAnalysis;
}

const AnimatedCard = Animated.createAnimatedComponent(View);
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const THEME_ICONS = {
  health: "heart-pulse",
  family: "account-group",
  work: "briefcase",
  personal: "account",
  relationships: "heart",
  nature: "leaf",
  spirituality: "star",
  achievements: "trophy",
  learning: "book",
  default: "circle-outline"
};

const EmotionDefinitions = {
  gratitude: "A feeling of appreciation and thankfulness",
  joy: "A feeling of great pleasure and happiness",
  contentment: "A state of peaceful satisfaction",
  love: "A feeling of deep affection",
  hope: "A feeling of expectation and desire",
  // Add more emotions and their definitions
};

const GRATITUDE_ANALYSIS_STEPS = [
  "Reading your gratitude entries...",
  "Identifying emotional patterns...",
  "Discovering key themes...",
  "Finding meaningful connections...",
  "Generating personalized insights...",
  "Preparing your analysis..."
];

const GOLDEN_CHECKLIST_ANALYSIS_STEPS = [
  "Analyzing your daily habits...",
  "Identifying behavior patterns...",
  "Discovering habit correlations...",
  "Calculating success probabilities...",
  "Generating habit stacks...",
  "Mapping impact zones...",
  "Creating personalized insights..."
];

const MAX_CARDS = 7; // Maximum number of cards we'll render

const ExerciseAnalysisScreen: React.FC<Props> = ({ navigation, route }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const intensityPulse = useSharedValue(1);
  const [loadingStep, setLoadingStep] = useState(0);
  const scrollY = useSharedValue(0);
  const cardVisibilities = Array.from({ length: MAX_CARDS }, (_, index) => useSharedValue(index < 2));
  const cardAnimatedStyles = cardVisibilities.map(isVisible => 
    useAnimatedStyle(() => {
      return {
        opacity: isVisible.value ? withSpring(1) : 0,
        transform: [{
          translateY: isVisible.value ? withSpring(0) : 50,
        }],
      };
    })
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      const offset = event.contentOffset.y + 600;
      
      cardVisibilities.forEach((isVisible, index) => {
        if (index >= 2) { // Skip first two cards as they're already visible
          const cardPosition = index * 300;
          if (offset > cardPosition && !isVisible.value) {
            isVisible.value = true;
          }
        }
      });
    },
  });

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
                "examples": ["array of example quotes"],
                "actionableSuggestions": [
                  "array of 2-3 specific actions to deepen gratitude in this theme"
                ],
                "growthOpportunities": [
                  "array of 2-3 ways to expand or evolve this theme"
                ]
              }
            ],
            "strengthSpotlight": {
              "title": "string highlighting a key strength shown in the entries",
              "evidence": ["array of quotes showing this strength"],
              "potentialImpact": "string describing how this strength can positively impact life"
            },
            "patterns": {
              "recurring": ["array of patterns found in the gratitude expressions"],
              "unique": ["array of unique or standout expressions"],
              "suggested": ["array of suggested new areas for gratitude based on patterns"]
            },
            "insights": {
              "main": "string describing key insights in second person (using 'you' not 'the user')",
              "suggestion": "string with specific, actionable growth suggestion speaking directly to the person",
              "celebration": "string celebrating specific positive patterns speaking directly to the person",
              "nextFocus": "string with clear, actionable next steps speaking directly to the person"
            }
          }

          Guidelines for analysis:
          1. Focus on identifying specific, actionable insights rather than general observations
          2. Look for patterns in how gratitude is expressed and what triggers it
          3. Recognize and celebrate when users show advanced gratitude perspectives (like finding joy in typically "negative" things)
          4. Suggest ways to build upon existing positive patterns rather than "fixing" them
          5. Frame all feedback in a growth-oriented, encouraging tone that acknowledges current strengths
          6. Make suggestions that amplify and expand current positive practices
          7. When users show mature gratitude perspectives, focus growth opportunities on sharing or exploring deeper rather than changing perspective

          Additional context for analysis:
          - If someone expresses gratitude for typically "negative" things (like rain, challenges, or difficulties), recognize this as an advanced perspective
          - When suggesting growth opportunities, build upon the wisdom already shown rather than suggesting basic perspective shifts
          - Celebrate unique or counterintuitive gratitude expressions as signs of emotional maturity

          Analyze these gratitude entries and provide insights speaking directly to the person:
          ${JSON.stringify(entries)}`;

      case 'checklist':
        return `You are an expert behavioral psychologist and habit formation coach analyzing daily routines and their systemic impacts. 

        Your expertise includes:
        - Pattern recognition in human behavior
        - Habit stacking and behavioral psychology
        - Impact analysis across physical, mental, emotional and social dimensions
        - Momentum-based behavioral change
        - Growth psychology and skill progression
        - Probability modeling for habit success

        Analyze the provided daily habits and routines. Consider their interconnections, timing patterns, and holistic impacts on wellbeing.

        Respond ONLY with a JSON object in this exact format, providing deep, actionable insights:
          {
            "patternAnalysis": {
              "optimalTimes": {
                "mostProductiveWindow": string,
                "keyTimeInsights": string[],
                "timeBasedRecommendations": string[]
              },
              "taskSequences": {
                "mostEffective": string[],
                "correlations": [
                  {
                    "trigger": string,
                    "outcome": string,
                    "probability": number,
                    "insight": string
                  }
                ]
              }
            },
            "habitStacking": {
              "recommendedStacks": [
                {
                  "trigger": {
                    "habit": string,
                    "timeOfDay": string,
                    "context": string
                  },
                  "sequence": [
                    {
                      "habit": string,
                      "waitTime": string,
                      "reason": string
                    }
                  ],
                  "totalImpact": string,
                  "successRate": number
                }
              ],
              "keystoneHabits": [
                {
                  "habit": string,
                  "cascadingEffects": string[],
                  "implementationTips": string[]
                }
              ]
            },
            "impactZones": {
              "physical": {
                "score": number,
                "potential": number,
                "strengths": string[],
                "improvements": string[],
                "nextSteps": string[]
              },
              "mental": {
                "score": number,
                "potential": number,
                "strengths": string[],
                "improvements": string[],
                "nextSteps": string[]
              },
              "emotional": {
                "score": number,
                "potential": number,
                "strengths": string[],
                "improvements": string[],
                "nextSteps": string[]
              },
              "social": {
                "score": number,
                "potential": number,
                "strengths": string[],
                "improvements": string[],
                "nextSteps": string[]
              }
            },
            "momentumBuilders": {
              "keyMoments": [
                {
                  "time": string,
                  "action": string,
                  "impact": string,
                  "whyItMatters": string
                }
              ],
              "tippingPoints": [
                {
                  "scenario": string,
                  "successPath": string,
                  "failurePath": string,
                  "preventiveAction": string
                }
              ],
              "microWins": [
                {
                  "action": string,
                  "timeToComplete": string,
                  "benefitGained": string
                }
              ]
            },
            "growthOpportunities": {
              "challengingHabits": [
                {
                  "habit": string,
                  "rootCause": string,
                  "subTasks": string[],
                  "progressionStrategy": string
                }
              ],
              "nextLevelHabits": [
                {
                  "currentHabit": string,
                  "evolution": string,
                  "benefits": string[],
                  "implementationSteps": string[]
                }
              ]
            },
            "successProbability": {
              "habits": [
                {
                  "name": string,
                  "probability": number,
                  "riskFactors": string[],
                  "preventiveStrategies": string[]
                }
              ],
              "overallSuccess": {
                "rate": number,
                "keyFactors": string[],
                "improvementAreas": string[]
              }
            }
          }

          Guidelines for analysis:
          1. Focus on discovering non-obvious patterns and correlations
          2. Emphasize the compound effects of habits working together
          3. Provide specific, actionable insights rather than general advice
          4. Consider the holistic impact across all life areas
          5. Base recommendations on behavioral science and habit formation research
          6. Identify potential domino effects and leverage points
          7. Suggest concrete next steps for improvement

          Additional context:
          - Look for habits that could be combined for synergistic effects
          - Identify potential conflicts between habits and suggest resolutions
          - Consider the user's current success rate and suggest realistic progressions
          - Focus on sustainable, long-term habit building rather than quick fixes

          Analyze these checklist completions and provide deep, meaningful insights:
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
    console.log('Starting analyzeEntries...');
    try {
      const { exerciseType, entries } = route.params;
      console.log('Analyzing entries:', { exerciseType, entries });
      
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

      console.log('Making OpenAI request...');

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
      console.log('Setting analysis result:', analysisResult);

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
          description: 'Your subconscious mind shapes your reality.',
          image: require('../../assets/illustrations/challenges/challenge-21.png')
        }
      });
    } else {
      navigation.navigate('MainTabs');
    }
  };

  const handleExitPress = () => {
    setShowExitModal(true);
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    navigation.goBack();
  };

  useEffect(() => {
    console.log('ExerciseAnalysisScreen mounted with params:', route.params);
    analyzeEntries();
  }, [route.params]);

  useEffect(() => {
    if (analysis) {
      intensityPulse.value = withRepeat(
        withSequence(
          withSpring(1.1),
          withSpring(1)
        ),
        -1,
        true
      );
    }
  }, [analysis]);

  useEffect(() => {
    if (loading) {
      const stepInterval = setInterval(() => {
        setLoadingStep((current) => {
          const maxSteps = route.params.exerciseType === 'checklist'
            ? GOLDEN_CHECKLIST_ANALYSIS_STEPS.length
            : GRATITUDE_ANALYSIS_STEPS.length;

          if (current >= maxSteps - 1) {
            clearInterval(stepInterval);
            return current;
          }
          return current + 1;
        });
      }, 2000); // Change message every 2 seconds

      return () => clearInterval(stepInterval);
    }
  }, [loading, route.params.exerciseType]);

  const intensityStyle = useAnimatedStyle(() => ({
    transform: [{ scale: intensityPulse.value }],
  }));

  const getThemeIcon = (themeName: string): string => {
    const key = themeName.toLowerCase() as keyof typeof THEME_ICONS;
    return THEME_ICONS[key] || THEME_ICONS.default;
  };

  const renderCard = (index: number, children: React.ReactNode) => {
    return (
      <Animated.View
        style={[styles.card, cardAnimatedStyles[index]]}
      >
        {children}
      </Animated.View>
    );
  };

  const scrollIndicatorStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(scrollY.value < 100 ? 1 : 0)
    };
  });

  console.log('Current render state:', { loading, error, hasAnalysis: !!analysis });

  const renderGoldenChecklistAnalysis = (analysis: GoldenChecklistAnalysis) => {
    return (
      <>
        {/* Pattern Analysis Card */}
        {renderCard(0,
          <View>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={24} color="#4facfe" />
              <Text style={styles.cardTitle}>Pattern Analysis</Text>
            </View>
            <View style={styles.patternSection}>
              <Text style={styles.sectionTitle}>Optimal Times</Text>
              <Text style={styles.highlightText}>{analysis.patternAnalysis.optimalTimes.mostProductiveWindow}</Text>
              {analysis.patternAnalysis.optimalTimes.keyTimeInsights.map((insight, index) => (
                <Text key={index} style={styles.insightText}>• {insight}</Text>
              ))}
            </View>
            <View style={styles.patternSection}>
              <Text style={styles.sectionTitle}>Task Correlations</Text>
              {analysis.patternAnalysis.taskSequences.correlations.map((correlation, index) => (
                <View key={index} style={styles.correlationItem}>
                  <View style={styles.correlationHeader}>
                    <Text style={styles.correlationTrigger}>{correlation.trigger}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#4facfe" />
                    <Text style={styles.correlationOutcome}>{correlation.outcome}</Text>
                  </View>
                  <Text style={styles.probabilityText}>{(correlation.probability * 100).toFixed(0)}% probability</Text>
                  <Text style={styles.insightText}>{correlation.insight}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Habit Stacking Card */}
        {renderCard(1,
          <View>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="layers-triple" size={24} color="#4facfe" />
              <Text style={styles.cardTitle}>Habit Stacking</Text>
            </View>
            {analysis.habitStacking.recommendedStacks.map((stack, index) => (
              <View key={index} style={styles.stackContainer}>
                <View style={styles.stackTrigger}>
                  <MaterialCommunityIcons name="flag-variant" size={20} color="#4facfe" />
                  <Text style={styles.triggerText}>
                    {stack.trigger.habit} ({stack.trigger.timeOfDay})
                  </Text>
                </View>
                {stack.sequence.map((seq, seqIndex) => (
                  <View key={seqIndex} style={styles.sequenceItem}>
                    <MaterialCommunityIcons name="arrow-down" size={20} color="#4facfe" />
                    <View style={styles.sequenceContent}>
                      <Text style={styles.sequenceHabit}>{seq.habit}</Text>
                      <Text style={styles.sequenceWait}>Wait: {seq.waitTime}</Text>
                      <Text style={styles.sequenceReason}>{seq.reason}</Text>
                    </View>
                  </View>
                ))}
                <View style={styles.stackFooter}>
                  <Text style={styles.successRate}>Success Rate: {(stack.successRate * 100).toFixed(0)}%</Text>
                  <Text style={styles.impactText}>{stack.totalImpact}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Impact Zones Card */}
        {renderCard(2,
          <View>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="target" size={24} color="#4facfe" />
              <Text style={styles.cardTitle}>Impact Zones</Text>
            </View>
            {Object.entries(analysis.impactZones).map(([zone, data], index) => (
              <View key={index} style={styles.impactZone}>
                <View style={styles.zoneHeader}>
                  <Text style={styles.zoneName}>{zone.charAt(0).toUpperCase() + zone.slice(1)}</Text>
                  <View style={styles.scoreContainer}>
                    <Text style={styles.currentScore}>{data.score}/10</Text>
                    <Text style={styles.potentialScore}>Potential: {data.potential}/10</Text>
                  </View>
                </View>
                <View style={styles.zoneContent}>
                  <Text style={styles.strengthsTitle}>Strengths:</Text>
                  {data.strengths.map((strength, idx) => (
                    <Text key={idx} style={styles.strengthText}>• {strength}</Text>
                  ))}
                  <Text style={styles.improvementsTitle}>Next Steps:</Text>
                  {data.nextSteps.map((step, idx) => (
                    <Text key={idx} style={styles.stepText}>• {step}</Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Momentum Builders Card */}
        {renderCard(3,
          <View>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="rocket-launch" size={24} color="#4facfe" />
              <Text style={styles.cardTitle}>Momentum Builders</Text>
            </View>
            <View style={styles.momentumSection}>
              <Text style={styles.sectionTitle}>Key Moments</Text>
              {analysis.momentumBuilders.keyMoments.map((moment, index) => (
                <View key={index} style={styles.momentItem}>
                  <Text style={styles.momentTime}>{moment.time}</Text>
                  <Text style={styles.momentAction}>{moment.action}</Text>
                  <Text style={styles.momentImpact}>{moment.impact}</Text>
                  <Text style={styles.momentWhy}>{moment.whyItMatters}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Growth Opportunities Card */}
        {renderCard(4,
          <View>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="trending-up" size={24} color="#4facfe" />
              <Text style={styles.cardTitle}>Growth Opportunities</Text>
            </View>
            {analysis.growthOpportunities.challengingHabits.map((habit, index) => (
              <View key={index} style={styles.challengeContainer}>
                <Text style={styles.challengeHabit}>{habit.habit}</Text>
                <Text style={styles.challengeCause}>Root Cause: {habit.rootCause}</Text>
                <View style={styles.subtasksList}>
                  {habit.subTasks.map((task, taskIndex) => (
                    <Text key={taskIndex} style={styles.subtaskText}>• {task}</Text>
                  ))}
                </View>
                <Text style={styles.strategyText}>{habit.progressionStrategy}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Success Probability Card */}
        {renderCard(5,
          <View>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-arc" size={24} color="#4facfe" />
              <Text style={styles.cardTitle}>Success Probability</Text>
            </View>
            <View style={styles.overallSuccess}>
              <Text style={styles.overallRate}>
                Overall Success Rate: {(analysis.successProbability.overallSuccess.rate * 100).toFixed(0)}%
              </Text>
              <Text style={styles.keyFactorsTitle}>Key Success Factors:</Text>
              {analysis.successProbability.overallSuccess.keyFactors.map((factor, index) => (
                <Text key={index} style={styles.factorText}>• {factor}</Text>
              ))}
            </View>
          </View>
        )}
      </>
    );
  };

  const renderAnalysisContent = () => {
    if (!analysis) return null;

    if (route.params.exerciseType === 'checklist') {
      // For checklist, the analysis data is directly in the root object
      return renderGoldenChecklistAnalysis(analysis as unknown as GoldenChecklistAnalysis);
    }

    // ... existing render logic for other exercise types ...
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
            <Text style={styles.loadingStep}>
              {route.params.exerciseType === 'checklist' 
                ? GOLDEN_CHECKLIST_ANALYSIS_STEPS[loadingStep]
                : GRATITUDE_ANALYSIS_STEPS[loadingStep]
              }
            </Text>
            <LoadingProgressBar 
              width={250} 
              height={4} 
              color="#4facfe" 
            />
            <Text style={styles.loadingSubtext}>
              {route.params.exerciseType === 'checklist' 
                ? "Creating your personalized habit insights"
                : "Creating your personalized gratitude insights"
              }
            </Text>
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

  if (!analysis) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: '#1E2132' }]}>
        <StatusBar backgroundColor="#1E2132" barStyle="light-content" />
        <View style={[styles.container, { backgroundColor: '#1E2132' }]}>
          <Text style={styles.errorText}>No analysis data available</Text>
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
            style={styles.exitButton}
            onPress={() => navigation.goBack()}
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

          {/* Updated scroll indicator */}
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

      {/* Emotion Definition Modal */}
      <Modal
        visible={!!selectedEmotion}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedEmotion(null)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setSelectedEmotion(null)}
        >
          <View style={styles.emotionModalContent}>
            <Text style={styles.emotionModalTitle}>{selectedEmotion}</Text>
            <Text style={styles.emotionModalDefinition}>
              {selectedEmotion ? EmotionDefinitions[selectedEmotion.toLowerCase() as keyof typeof EmotionDefinitions] : ''}
            </Text>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showExitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Wait! Are you sure?</Text>
            <Text style={styles.modalText}>
              Take a moment to reflect on your gratitude insights before leaving.
            </Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => setShowExitModal(false)}
            >
              <Text style={styles.continueText}>Stay</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalExitButton}
              onPress={handleConfirmExit}
            >
              <Text style={styles.exitText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  header: {
    paddingTop: 0,
    paddingBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
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
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#00f2fe',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  primaryEmotion: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  emotionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  emotionChipGradient: {
    borderRadius: 20,
    padding: 1,
  },
  emotionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#000000',
    fontWeight: '600',
  },
  themeItem: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  themeHeader: {
    padding: 16,
    position: 'relative',
  },
  themeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
    flex: 1,
  },
  themeHeaderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  themeName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
    flex: 1,
    flexWrap: 'wrap',
  },
  frequencyBadge: {
    backgroundColor: '#4facfe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  themeFrequency: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '700',
  },
  themeContent: {
    padding: 16,
    paddingTop: 8,
  },
  themeSection: {
    marginBottom: 16,
  },
  themeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  themeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00f2fe',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4facfe',
    marginTop: 8,
    marginRight: 12,
  },
  themeDetailText: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  insightText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 24,
  },
  celebrationText: {
    fontSize: 16,
    color: '#00f2fe',
    marginBottom: 16,
    lineHeight: 24,
    fontWeight: '500',
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
  exitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    padding: 24,
    borderRadius: 16,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
    lineHeight: 24,
  },
  continueButton: {
    backgroundColor: '#4facfe',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
    width: '100%',
  },
  continueText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalExitButton: {
    backgroundColor: '#B91C1C',
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
  },
  exitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#00f2fe',
    textAlign: 'center',
    marginTop: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  intensityContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  intensityLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
  },
  intensityBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  intensityFill: {
    height: '100%',
    borderRadius: 4,
  },
  intensityValue: {
    color: '#4facfe',
    fontSize: 14,
    marginTop: 8,
  },
  emotionGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 16,
  },
  emotionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spotlightTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  evidenceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  evidenceText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 20,
  },
  impactText: {
    fontSize: 16,
    color: '#00f2fe',
    lineHeight: 24,
  },
  patternSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00f2fe',
    marginBottom: 8,
  },
  patternText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 20,
    paddingLeft: 8,
  },
  topSpacing: {
    marginTop: 16,
  },
  emotionModalContent: {
    backgroundColor: '#1C1C1E',
    padding: 20,
    borderRadius: 16,
    width: '85%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4facfe',
  },
  emotionModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4facfe',
    marginBottom: 12,
  },
  emotionModalDefinition: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
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
  patternSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4facfe',
    marginBottom: 12,
  },
  highlightText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  correlationItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  correlationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  correlationTrigger: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  correlationOutcome: {
    color: '#4facfe',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  probabilityText: {
    color: '#00f2fe',
    fontSize: 14,
    marginBottom: 4,
  },
  stackContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  stackTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  triggerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sequenceItem: {
    flexDirection: 'row',
    marginLeft: 24,
    marginBottom: 12,
  },
  sequenceContent: {
    marginLeft: 12,
    flex: 1,
  },
  sequenceHabit: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 4,
  },
  sequenceWait: {
    color: '#888',
    fontSize: 14,
    marginBottom: 2,
  },
  sequenceReason: {
    color: '#4facfe',
    fontSize: 14,
  },
  stackFooter: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  successRate: {
    color: '#00f2fe',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  impactZone: {
    marginBottom: 24,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  zoneName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4facfe',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  currentScore: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  potentialScore: {
    fontSize: 14,
    color: '#00f2fe',
  },
  zoneContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
  },
  strengthsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4facfe',
    marginBottom: 8,
  },
  strengthText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 4,
  },
  improvementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4facfe',
    marginTop: 16,
    marginBottom: 8,
  },
  stepText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 4,
  },
  momentumSection: {
    marginBottom: 20,
  },
  momentItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  momentTime: {
    color: '#4facfe',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  momentAction: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 4,
  },
  momentImpact: {
    color: '#00f2fe',
    fontSize: 14,
    marginBottom: 4,
  },
  momentWhy: {
    color: '#888',
    fontSize: 14,
  },
  challengeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  challengeHabit: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  challengeCause: {
    color: '#4facfe',
    fontSize: 14,
    marginBottom: 12,
  },
  subtasksList: {
    marginBottom: 12,
  },
  subtaskText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 4,
  },
  strategyText: {
    color: '#00f2fe',
    fontSize: 14,
  },
  overallSuccess: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
  },
  overallRate: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4facfe',
    marginBottom: 16,
    textAlign: 'center',
  },
  keyFactorsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  factorText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 4,
  },
});

export default ExerciseAnalysisScreen; 