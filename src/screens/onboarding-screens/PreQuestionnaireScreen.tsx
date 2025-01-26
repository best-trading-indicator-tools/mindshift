import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import LinearGradient from 'react-native-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'PreQuestionnaire'>;

const PreQuestionnaireScreen: React.FC<Props> = ({ navigation }) => {
  const handleGetStarted = () => {
    navigation.navigate('Questionnaire');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E3A5F', '#2D5F7C']}
        style={styles.gradient}
        start={{x: 0.5, y: 0}}
        end={{x: 0.5, y: 1}}
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
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  benefitsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
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
    alignItems: 'center',
    marginBottom: 15,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64B5F6',
    marginRight: 10,
  },
  benefitText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    flex: 1,
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
    backgroundColor: '#64B5F6',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default PreQuestionnaireScreen; 