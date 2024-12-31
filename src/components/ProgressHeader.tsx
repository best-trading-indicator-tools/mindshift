import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

interface ProgressHeaderProps {
  currentStep: number;
  totalSteps: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onExit?: () => void;
  showPrevious?: boolean;
  showNext?: boolean;
}

const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onExit,
  showPrevious = true,
  showNext = true,
}) => {
  const progress = currentStep / totalSteps;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.navButton} 
        onPress={onExit}
      >
        <Icon name="close" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View style={[styles.progressWrapper, { width: `${progress * 100}%` }]}>
            <View style={styles.progressBase} />
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.7)',  // Bright white highlight at top
                'rgba(255, 255, 255, 0.3)',  // Softer white
                'rgba(255, 215, 0, 0)',      // Fade to base yellow
              ]}
              locations={[0, 0.3, 1]}
              style={styles.progressSheen}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.navButton, !showNext && styles.hidden]} 
        onPress={onNext}
        disabled={!showNext}
      >
        <Icon name="chevron-right" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    width: '100%',
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  progressBackground: {
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressWrapper: {
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFD700',  // Base yellow color
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  progressSheen: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  navButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 22,
  },
  hidden: {
    opacity: 0,
  },
});

export default ProgressHeader; 