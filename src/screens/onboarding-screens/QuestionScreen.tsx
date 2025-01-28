import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Questionnaire'>;

const QuestionScreen: React.FC<Props> = ({ navigation, route }) => {
  // Juste initialiser les valeurs sans pré-charger les animations
  const scaleValues = React.useRef(
    Array(5).fill(0).map(() => new Animated.Value(1))
  ).current;

  // Optimiser les configurations d'animation
  const springConfig = {
    toValue: 1,
    useNativeDriver: true,
    tension: 300, // Plus haute tension = plus rapide
    friction: 10,  // Moins de friction = plus fluide
    restSpeedThreshold: 100,
    restDisplacementThreshold: 40,
  };

  const handlePressIn = useCallback((index: number) => {
    Animated.spring(scaleValues[index], {
      ...springConfig,
      toValue: 0.95,
    }).start();
  }, []);

  const handlePressOut = useCallback((index: number) => {
    Animated.spring(scaleValues[index], {
      ...springConfig,
      toValue: 1,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Votre JSX existant avec les Animated.View */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // ... vos autres styles
});

export default QuestionScreen; 