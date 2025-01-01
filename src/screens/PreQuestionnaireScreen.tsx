import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import LinearGradient from 'react-native-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'PreQuestionnaire'>;

const PreQuestionnaireScreen: React.FC<Props> = ({ navigation }) => {
  const handleGetStarted = () => {
    navigation.navigate('Questionnaire');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#121212', '#121212']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.mainContent}>
            <Text style={styles.title}>Take the First Step Toward a Positive Mindset</Text>
            
            <Text style={styles.subtitle}>
              Take <Text style={{ fontWeight: 'bold' }}>2 minutes</Text> to answer a few questions, and let us create your personalized journey to positivity.
            </Text>

            <View style={[styles.benefitsContainer, { marginTop: 20 }]}>
              <Text style={styles.benefitsTitle}>
                This helps us:
              </Text>
              {[
                'Discover what matters most to you',
                'Get exercises tailored to your growth',
                'Track your progress and celebrate milestones',
                'Receive recommendations that work for you',
                'Align your journey with your goals'
              ].map((benefit, index) => (
                <View key={index} style={styles.benefitRow}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleGetStarted}
          >
            <Text style={styles.buttonText}>Feel Better Today</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  gradient: {
    flex: 1,
    padding: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: '15%',
    paddingBottom: '10%',
  },
  mainContent: {
    alignItems: 'center',
    width: '100%',
    marginTop: 20
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 38,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 48,
    opacity: 0.9,
    lineHeight: 28,
    marginTop: 20
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 48,
  },
  benefitsTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 24,
    opacity: 0.9,
    textAlign: 'center',
  },
  benefitRow: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 16,
  },
  benefitText: {
    color: '#FFFFFF',
    fontSize: 18,
    opacity: 0.9,
    flex: 1,
    lineHeight: 24,
  },
  joinText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 0,
    opacity: 0.9,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    maxWidth: 300,
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default PreQuestionnaireScreen; 