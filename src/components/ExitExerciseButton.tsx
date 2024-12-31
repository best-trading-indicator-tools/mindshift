import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  onExit: () => void;
}

const ExitExerciseButton: React.FC<Props> = ({ onExit }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onExit}>
      <Text style={styles.text}>Exit</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignSelf: 'center',
    marginBottom: 80,
    width: '40%',
  },
  text: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ExitExerciseButton; 