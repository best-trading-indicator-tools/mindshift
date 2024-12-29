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
    <View style={styles.wrapper}>
      <View style={styles.statusIconContainer}>
        <MaterialCommunityIcons 
          name={isCompleted ? "check-circle" : "circle-outline"} 
          size={24} 
          color={isCompleted ? "#4CAF50" : "#FFD700"} 
        />
      </View>
      
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
              <Text style={[styles.subtitle]} numberOfLines={1}>{subtitle}</Text>
            </View>
            
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={icon} size={40} color="#6366f1" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 0,
    position: 'relative',
  },
  statusIconContainer: {
    position: 'absolute',
    left: -80,
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 2,
    zIndex: 1,
  },
  container: {
    backgroundColor: '#151932',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flex: 1,
    marginLeft: -40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    marginLeft: 8,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '400',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
});

export default MissionItem; 