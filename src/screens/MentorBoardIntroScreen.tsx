import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'MentorBoardIntro'>;

const PaginationDots = ({ currentPage }: { currentPage: number }) => (
  <View style={styles.paginationContainer}>
    {[0, 1, 2].map((dot) => (
      <View
        key={dot}
        style={[
          styles.paginationDot,
          currentPage === dot && styles.paginationDotActive,
        ]}
      />
    ))}
  </View>
);

const MentorBoardIntroScreen: React.FC<Props> = ({ navigation }) => {
  const [currentPage, setCurrentPage] = useState(0);

  const handleNext = () => {
    if (currentPage < 2) {
      setCurrentPage(currentPage + 1);
    } else {
      navigation.navigate('MentorBoard');
    }
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
                source={require('../assets/illustrations/mentorboard.jpg')}
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
    <SafeAreaView style={styles.container}>
      {renderPage()}
      <View style={styles.bottomContainer}>
        <PaginationDots currentPage={currentPage} />
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentPage === 2 ? 'Start Exercise' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  pageContainer: {
    flex: 1,
    padding: 20,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 30,
    marginTop: 10,
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
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 28,
  },
  mentorsList: {
    flex: 1,
    gap: 16,
    paddingBottom: 20,
  },
  mentorItem: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '700',
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 40,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333333',
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    backgroundColor: '#E31837',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default MentorBoardIntroScreen; 