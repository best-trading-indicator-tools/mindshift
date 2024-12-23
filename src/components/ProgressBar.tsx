import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressBarProps {
  totalSteps: number;
  completedSteps: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ totalSteps, completedSteps }) => {
  return (
    <View style={styles.container}>
      <View style={styles.progressLine}>
        <View style={[styles.progressFill, { height: `${(completedSteps / totalSteps) * 100}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: '100%',
    position: 'relative',
    marginRight: 16,
  },
  progressLine: {
    position: 'absolute',
    left: '50%',
    width: 2,
    height: '100%',
    backgroundColor: '#333',
    transform: [{ translateX: -1 }],
  },
  progressFill: {
    width: '100%',
    backgroundColor: '#4CAF50',
    position: 'absolute',
    bottom: 0,
  },
});

export default ProgressBar;
