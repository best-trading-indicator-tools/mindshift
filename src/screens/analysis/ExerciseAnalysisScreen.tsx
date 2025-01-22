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
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { config } from '../../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingProgressBar from '../../components/ProgressBar';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Svg, Line } from 'react-native-svg';

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
    actionableSuggestions: string[];
    growthOpportunities: string[];
  }[];
  strengthSpotlight: {
    title: string;
    evidence: string[];
    potentialImpact: string;
  };
  patterns: {
    recurring: string[];
    unique: string[];
    suggested: string[];
  };
  insights: {
    main: string;
    suggestion: string;
    celebration: string;
    nextFocus: string;
  };
}

const AnimatedCard = Animated.createAnimatedComponent(View);

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

const ANALYSIS_STEPS = [
  "Reading your gratitude entries...",
  "Identifying emotional patterns...",
  "Discovering key themes...",
  "Finding meaningful connections...",
  "Generating personalized insights...",
  "Preparing your analysis..."
];

const ExerciseAnalysisScreen: React.FC<Props> = ({ navigation, route }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const intensityPulse = useSharedValue(1);
  const [loadingStep, setLoadingStep] = useState(0);

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
          3. Suggest concrete ways to deepen and expand existing gratitude themes
          4. Highlight unique or particularly meaningful expressions
          5. Frame all feedback in a growth-oriented, encouraging tone
          6. Make suggestions specific and immediately actionable
          7. Celebrate both the content and the way gratitude is expressed

          Analyze these gratitude entries and provide insights speaking directly to the person:
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
          if (current >= ANALYSIS_STEPS.length - 1) {
            clearInterval(stepInterval);
            return current;
          }
          return current + 1;
        });
      }, 2000); // Change message every 2 seconds

      return () => clearInterval(stepInterval);
    }
  }, [loading]);

  const intensityStyle = useAnimatedStyle(() => ({
    transform: [{ scale: intensityPulse.value }],
  }));

  const getThemeIcon = (themeName: string): string => {
    const key = themeName.toLowerCase() as keyof typeof THEME_ICONS;
    return THEME_ICONS[key] || THEME_ICONS.default;
  };

  const renderCard = (index: number, children: React.ReactNode) => (
    <AnimatedCard
      entering={FadeInDown.delay(index * 200).springify()}
      style={styles.card}
    >
      {children}
    </AnimatedCard>
  );

  console.log('Current render state:', { loading, error, hasAnalysis: !!analysis });

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
              {ANALYSIS_STEPS[loadingStep]}
            </Text>
            <LoadingProgressBar 
              width={250} 
              height={4} 
              color="#4facfe" 
            />
            <Text style={styles.loadingSubtext}>
              Creating your personalized gratitude insights
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

          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {analysis && (
              <>
                {renderCard(0,
                  <View style={styles.header}>
                    <Text style={styles.title}>Progress Insights</Text>
                    <Text style={styles.subtitle}>
                      {route.params.entries.length} gratitudes analyzed
                    </Text>
                  </View>
                )}
                
                {renderCard(1,
                  <View>
                    <View style={styles.cardHeader}>
                      <MaterialCommunityIcons name="heart-outline" size={24} color="#4facfe" />
                      <Text style={styles.cardTitle}>Overall Tone</Text>
                    </View>
                    <Text style={styles.primaryEmotion}>{analysis.emotionalTone.primary}</Text>
                    
                    <Animated.View style={[styles.intensityContainer, intensityStyle]}>
                      <Text style={styles.intensityLabel}>Intensity</Text>
                      <View style={styles.intensityBar}>
                        <LinearGradient
                          colors={['#4facfe', '#00f2fe']}
                          style={[
                            styles.intensityFill,
                            { width: `${(analysis.emotionalTone.intensity / 10) * 100}%` }
                          ]}
                        />
                      </View>
                      <Text style={styles.intensityValue}>{analysis.emotionalTone.intensity}/10</Text>
                    </Animated.View>

                    <View style={styles.emotionGroups}>
                      {analysis.emotionalTone.secondary.map((emotion, index) => (
                        <Pressable
                          key={index}
                          style={styles.emotionGroup}
                          onPress={() => setSelectedEmotion(emotion)}
                        >
                          <LinearGradient
                            colors={['#4facfe', '#00f2fe']}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 0}}
                            style={styles.emotionChipGradient}
                          >
                            <Text style={styles.emotionChip}>{emotion}</Text>
                          </LinearGradient>
                          {index < analysis.emotionalTone.secondary.length - 1 && (
                            <Svg height="2" width="20">
                              <Line
                                x1="0"
                                y1="1"
                                x2="20"
                                y2="1"
                                stroke="#4facfe"
                                strokeWidth="2"
                              />
                            </Svg>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {renderCard(2,
                  <View>
                    <View style={styles.cardHeader}>
                      <MaterialCommunityIcons name="tag-multiple-outline" size={24} color="#4facfe" />
                      <Text style={styles.cardTitle}>Key Themes</Text>
                    </View>
                    {analysis.themes.map((theme, index) => (
                      <Animated.View
                        key={index}
                        entering={FadeInDown.delay(index * 200).springify()}
                        style={styles.themeItem}
                      >
                        <View style={styles.themeHeader}>
                          <View style={styles.themeHeaderLeft}>
                            <MaterialCommunityIcons 
                              name={getThemeIcon(theme.name)} 
                              size={24} 
                              color="#4facfe" 
                            />
                            <Text style={styles.themeName}>{theme.name}</Text>
                            <View style={styles.frequencyBadge}>
                              <Text style={styles.themeFrequency}>{theme.frequency}×</Text>
                            </View>
                          </View>
                          <LinearGradient
                            colors={['#4facfe20', '#00f2fe20']}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 0}}
                            style={styles.themeHeaderGradient}
                          />
                        </View>
                        
                        <View style={styles.themeContent}>
                          <View style={styles.themeSection}>
                            <View style={styles.themeSectionHeader}>
                              <MaterialCommunityIcons name="check-circle-outline" size={20} color="#4facfe" />
                              <Text style={styles.themeSectionTitle}>Actionable Steps</Text>
                            </View>
                            {theme.actionableSuggestions.map((suggestion, idx) => (
                              <View key={idx} style={styles.suggestionItem}>
                                <View style={styles.bulletPoint} />
                                <Text style={styles.themeDetailText}>{suggestion}</Text>
                              </View>
                            ))}
                          </View>
                          
                          <View style={[styles.themeSection, styles.topSpacing]}>
                            <View style={styles.themeSectionHeader}>
                              <MaterialCommunityIcons name="trending-up" size={20} color="#4facfe" />
                              <Text style={styles.themeSectionTitle}>Growth Opportunities</Text>
                            </View>
                            {theme.growthOpportunities.map((opportunity, idx) => (
                              <View key={idx} style={styles.suggestionItem}>
                                <View style={styles.bulletPoint} />
                                <Text style={styles.themeDetailText}>{opportunity}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </Animated.View>
                    ))}
                  </View>
                )}

                {renderCard(3,
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <MaterialCommunityIcons name="star-outline" size={24} color="#4facfe" />
                      <Text style={styles.cardTitle}>Strength Spotlight</Text>
                    </View>
                    <Text style={styles.spotlightTitle}>{analysis.strengthSpotlight.title}</Text>
                    <View style={styles.evidenceContainer}>
                      {analysis.strengthSpotlight.evidence.map((quote, index) => (
                        <Text key={index} style={styles.evidenceText}>"{quote}"</Text>
                      ))}
                    </View>
                    <Text style={styles.impactText}>{analysis.strengthSpotlight.potentialImpact}</Text>
                  </View>
                )}

                {renderCard(4,
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <MaterialCommunityIcons name="trending-up" size={24} color="#4facfe" />
                      <Text style={styles.cardTitle}>Patterns & Insights</Text>
                    </View>
                    
                    <Text style={styles.patternSubtitle}>Recurring Patterns</Text>
                    {analysis.patterns.recurring.map((pattern, index) => (
                      <Text key={index} style={styles.patternText}>• {pattern}</Text>
                    ))}
                    
                    <Text style={[styles.patternSubtitle, styles.topSpacing]}>Unique Expressions</Text>
                    {analysis.patterns.unique.map((unique, index) => (
                      <Text key={index} style={styles.patternText}>• {unique}</Text>
                    ))}
                    
                    <Text style={[styles.patternSubtitle, styles.topSpacing]}>Suggested Areas</Text>
                    {analysis.patterns.suggested.map((suggestion, index) => (
                      <Text key={index} style={styles.patternText}>• {suggestion}</Text>
                    ))}
                  </View>
                )}

                {renderCard(5,
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <MaterialCommunityIcons name="lightbulb-outline" size={24} color="#4facfe" />
                      <Text style={styles.cardTitle}>Personal Insights</Text>
                    </View>
                    <Text style={styles.insightText}>{analysis.insights.main}</Text>
                    <Text style={styles.celebrationText}>{analysis.insights.celebration}</Text>
                    <Text style={styles.suggestionText}>{analysis.insights.suggestion}</Text>
                  </View>
                )}

                {renderCard(6,
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <MaterialCommunityIcons name="compass-outline" size={24} color="#4facfe" />
                      <Text style={styles.cardTitle}>Next Focus</Text>
                    </View>
                    <Text style={styles.nextFocusText}>{analysis.insights.nextFocus}</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

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
    color: '#4facfe',
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
    color: '#4facfe',
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
  },
  frequencyBadge: {
    backgroundColor: 'rgba(79, 172, 254, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  themeFrequency: {
    fontSize: 14,
    color: '#4facfe',
    fontWeight: '600',
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
    color: '#4facfe',
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
    color: '#4facfe',
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
    color: '#4facfe',
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
    color: '#4facfe',
    lineHeight: 24,
  },
  patternSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4facfe',
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
});

export default ExerciseAnalysisScreen; 