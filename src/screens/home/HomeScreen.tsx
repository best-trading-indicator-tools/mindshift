import React from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const handleNavigateToExercise = () => {
    navigation.navigate('Exercise', {
      source: 'home'
    });
  };

  return (
    <View>
      {/* Your existing HomeScreen content */}
    </View>
  );
};

export default HomeScreen; 