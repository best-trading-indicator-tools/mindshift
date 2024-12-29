import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressBarProps {
  totalSteps: number;
  completedSteps: number;
  completedMissions: string[];
  missions: Array<{
    title: string;
    id: string;
  }>;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  totalSteps, 
  completedSteps, 
  completedMissions,
  missions 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.progressLine}>
        {missions.map((mission, index) => {
          const isCompleted = completedMissions.includes(mission.id);
          const stepHeight = 100 / totalSteps;
          const top = index * stepHeight;
          
          return (
            <View
              key={mission.id}
              style={[
                styles.missionLine,
                {
                  top: `${top}%`,
                  height: `${stepHeight}%`,
                  backgroundColor: isCompleted ? '#10B981' : '#FFD700',
                },
              ]}
            />
          );
        })}
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
    left: '0%',
    width: 2,
    height: '100%',
    backgroundColor: '#2A2E3B',
    transform: [{ translateX: -1 }],
  },
  missionLine: {
    width: '100%',
    position: 'absolute',
  },
});

export default ProgressBar;
