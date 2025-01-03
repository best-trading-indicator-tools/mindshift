import React, { useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Button } from '@rneui/themed';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveIncantationsExercise'>;

const ActiveIncantationsExerciseScreen: React.FC<Props> = ({ route, navigation }) => {
  const { incantations } = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);
  
  return (
    <View style={styles.container}>
      <Animated.Text style={styles.incantation}>
        {incantations[currentIndex]}
      </Animated.Text>
      
      <Button 
        title="Exit" 
        onPress={() => navigation.goBack()} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  incantation: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    padding: 20,
  },
});

export default ActiveIncantationsExerciseScreen; 