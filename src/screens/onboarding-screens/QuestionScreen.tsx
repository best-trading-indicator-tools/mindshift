import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Questionnaire'>;

const QuestionScreen: React.FC<Props> = ({ navigation, route }) => {
  // Pré-initialiser les valeurs d'animation
  const scaleValues = React.useRef(
    Array(5).fill(0).map(() => new Animated.Value(1))
  ).current;

  // Pré-charger les animations
  useEffect(() => {
    // Créer les animations à l'avance
    scaleValues.forEach(scale => {
      Animated.spring(scale, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
      
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handlePressIn = useCallback((index: number) => {
    Animated.spring(scaleValues[index], {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 40,
      friction: 3,
    }).start();
  }, [scaleValues]);

  const handlePressOut = useCallback((index: number) => {
    Animated.spring(scaleValues[index], {
      toValue: 1,
      useNativeDriver: true,
      tension: 40,
      friction: 3,
    }).start();
  }, [scaleValues]);

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