import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ProgressHeader from '../../components/ProgressHeader';
import LinearGradient from 'react-native-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'MentorBoardIntro'>;

const MentorBoardIntroScreen: React.FC<Props> = ({ navigation, route }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const TOTAL_STEPS = 4; // Including the actual board creation step

  const handleNext = () => {
    if (currentPage < 2) {
      setCurrentPage(currentPage + 1);
    } else {
      navigation.navigate('MentorBoard', {
        context: route.params?.challengeId ? 'challenge' : 'daily',
        challengeId: route.params?.challengeId,
        returnTo: route.params?.returnTo
      });
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleExit = () => {
    navigation.goBack();
  };

  const renderPage = () => {
    switch (currentPage) {
      case 0:
        return (
          <View style={styles.pageContainer}>
            <Text style={styles.titleText} numberOfLines={1} adjustsFontSizeToFit>
              THE MAGICAL POWER OF THE MENTOR BOARD
            </Text>
            <View style={styles.illustrationContainer}>
              <Image
                source={require('../../assets/illustrations/mentorboard.jpg')}
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.pageContainer}>
            <Text style={styles.titleText} numberOfLines={1} adjustsFontSizeToFit>
              THE MAGICAL POWER OF THE MENTOR BOARD
            </Text>
            <View style={styles.fullTextContent}>
              <Text style={styles.explanationText}>
                As a reminder, I regularly update my mentor board.
              </Text>
              <Text style={styles.explanationText}>
                You can also use images of fictional characters like animated characters or different actors.
              </Text>
              <Text style={styles.explanationText}>
                I will explain in a few words these faces for this mentor board.
              </Text>
            </View>
          </View>
        );

      case 2:
        return (
          <ScrollView style={styles.scrollView}>
            <View style={styles.pageContainer}>
              <Text style={styles.titleText} numberOfLines={1} adjustsFontSizeToFit>
                THE MAGICAL POWER OF THE MENTOR BOARD
              </Text>
              <View style={styles.mentorsList}>
                <Text style={styles.mentorItem}>1. <Text style={styles.boldText}>Dwayne Johnson</Text> for his work ethic and business mindset.</Text>
                <Text style={styles.mentorItem}>2. <Text style={styles.boldText}>Napoleon Hill</Text> for his mastery of the law of attraction.</Text>
                <Text style={styles.mentorItem}>3. <Text style={styles.boldText}>Kobe Bryant</Text> for his work ethic and determination.</Text>
                <Text style={styles.mentorItem}>4. <Text style={styles.boldText}>Wallace D. Wattles</Text> for his understanding of universal laws.</Text>
                <Text style={styles.mentorItem}>5. <Text style={styles.boldText}>David Goggins</Text> for his reminder that suffering is the best teacher.</Text>
                <Text style={styles.mentorItem}>6. <Text style={styles.boldText}>Osho</Text> for his charisma, intelligence, and inner peace that he radiates.</Text>
                <Text style={styles.mentorItem}>7. <Text style={styles.boldText}>Dale Carnegie</Text> for his ability to maintain good relationships and his mastery of leadership.</Text>
                <Text style={styles.mentorItem}>8. <Text style={styles.boldText}>Jesus</Text> for the non-violent aspect.</Text>
                <Text style={styles.mentorItem}>9. <Text style={styles.boldText}>Abraham Lincoln</Text> for the courage to do what is right even when everyone is against you.</Text>
                <Text style={styles.mentorItem}>10. <Text style={styles.boldText}>Sadhguru</Text> for his ability to communicate complex ideas simply and his pleasant temperament.</Text>
                <Text style={styles.mentorItem}>11. <Text style={styles.boldText}>Marcus Aurelius</Text> for his wisdom and ability to manage his emotions.</Text>
                <Text style={styles.mentorItem}>12. <Text style={styles.boldText}>Tony Robbins</Text> for his hypnotic code and ability to inspire people.</Text>
              </View>
            </View>
          </ScrollView>
        );
    }
  };

  return (
    <LinearGradient 
      colors={['#0F172A', '#1E3A5F', '#2D5F7C']} 
      style={styles.container}
      start={{x: 0.5, y: 0}}
      end={{x: 0.5, y: 1}}
    >
      <View style={styles.mainContainer}>
        <ProgressHeader
          currentStep={currentPage + 1}
          totalSteps={TOTAL_STEPS}
          onNext={handleNext}
          onExit={handleExit}
          showNext={true}
        />
        {renderPage()}
        <View style={styles.nextButtonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.nextButtonPressed
            ]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentPage === 2 ? 'Start Exercise' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    paddingBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    padding: 24,
  },
  titleText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 32,
    marginTop: 0,
    textAlign: 'center',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
  },
  illustrationContainer: {
    flex: 1,
    height: 500,
    justifyContent: 'center',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  fullTextContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  explanationText: {
    fontSize: 19,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 32,
    letterSpacing: 0.3,
  },
  mentorsList: {
    flex: 1,
    gap: 16,
    paddingBottom: 20,
  },
  mentorItem: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  boldText: {
    fontWeight: '700',
  },
  nextButtonContainer: {
    paddingHorizontal: 24,
    marginBottom: 48,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  nextButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    width: '60%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  nextButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
    backgroundColor: '#BFA030',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default MentorBoardIntroScreen; 