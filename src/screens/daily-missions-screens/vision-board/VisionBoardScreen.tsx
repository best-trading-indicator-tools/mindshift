import { markDailyExerciseAsCompleted } from '../../../utils/exerciseCompletion';

// ... rest of imports ...

const VisionBoardScreen: React.FC<Props> = ({ navigation, route }) => {
  // ... rest of component ...

  const handleComplete = async () => {
    try {
      if (route.params?.context === 'challenge') {
        if (route.params.onComplete) {
          route.params.onComplete();
        }
        if (route.params.returnTo === 'ChallengeDetail') {
          navigation.navigate('ChallengeDetail', {
            challenge: {
              id: route.params.challengeId || '',
              title: 'Ultimate',
              duration: 21,
              description: '',
              image: null
            }
          });
        } else {
          navigation.goBack();
        }
      } else {
        await markDailyExerciseAsCompleted('vision-board');
        navigation.navigate('MainTabs');
      }
    } catch (error) {
      console.error('Error completing exercise:', error);
    }
  };
}; 