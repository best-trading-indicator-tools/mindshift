import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

interface Props {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  showBackButton: boolean;
}

const QuestionnaireProgressHeader: React.FC<Props> = ({
  currentStep,
  totalSteps,
  onBack,
  showBackButton,
}) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <View style={[
        styles.contentContainer,
        !showBackButton && styles.centeredContentContainer
      ]}>
        {showBackButton ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        <View style={[
          styles.progressContainer,
          !showBackButton && styles.centeredProgressContainer
        ]}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressWrapper, { width: `${progress}%` }]}>
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
        {!showBackButton && <View style={styles.backButtonPlaceholder} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    backgroundColor: '#121212',
    paddingBottom: 8,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 44,  // Fixed height to match the back button
  },
  centeredContentContainer: {
    justifyContent: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonPlaceholder: {
    width: 44,
    height: 44,
    marginRight: 12,
  },
  progressContainer: {
    flex: 1,
    maxWidth: 280,
  },
  centeredProgressContainer: {
    flex: 0,
    width: 280,
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
});

export default QuestionnaireProgressHeader; 