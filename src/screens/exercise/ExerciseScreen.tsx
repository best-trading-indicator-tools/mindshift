import React from 'react';
import { Button } from '@rneui/themed';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';

interface ExerciseScreenProps {
  navigation: any;
}

const ExerciseScreen: React.FC<ExerciseScreenProps> = ({ navigation }) => {
  const route = useRoute<RouteProp<RootStackParamList, 'Exercise'>>();
  const source = route.params?.source || 'home';

  const handleExit = () => {
    if (source === 'challenges') {
      navigation.navigate('Challenges');
    } else {
      navigation.navigate('Home');
    }
  };

  return (
    <Button onPress={handleExit}>Exit</Button>
  );
};

export default ExerciseScreen; 