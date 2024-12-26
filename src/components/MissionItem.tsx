import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface MissionItemProps {
  title: string;
  subtitle: string;
  duration: string;
  type: string;
  icon: string;
  onPress?: () => void;
  isCompleted?: boolean;
}

const MissionItem: React.FC<MissionItemProps> = ({
  title,
  subtitle,
  duration,
  type,
  icon,
  onPress,
  isCompleted = false,
}) => {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="clock-time-three" size={14} color="#666" />
          <Text style={styles.duration}>{duration}</Text>
          <Text style={styles.type}>{type}</Text>
        </View>
        
        <View style={styles.mainContent}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={icon} size={40} color="#6366f1" />
          </View>
        </View>
      </View>
      
      {isCompleted && (
        <View style={styles.checkmark}>
          <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#151932',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  duration: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  type: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
  },
  iconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    position: 'absolute',
    left: -12,
    top: '50%',
    transform: [{ translateY: -12 }],
    backgroundColor: '#000',
    borderRadius: 12,
  },
});

export default MissionItem; 