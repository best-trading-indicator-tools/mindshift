import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Image, ImageSourcePropType } from 'react-native';
import { Text } from '@rneui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');
const cardWidth = width - 32; // 16 padding on each side

interface ChallengeCardProps {
  title: string;
  duration: number;
  description: string;
  image: ImageSourcePropType;
  onPress?: () => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({
  title,
  duration,
  description,
  image,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.challengeCard} onPress={onPress}>
      <View style={styles.contentContainer}>
        <View style={styles.leftContent}>
          <View style={styles.durationBadge}>
            <MaterialCommunityIcons name="calendar" size={16} color="#000000" />
            <Text style={styles.durationText}>{duration} days</Text>
          </View>
          <Text style={styles.challengeTitle}>{title}</Text>
        </View>
        
        <View style={styles.imageContainer}>
          <Image 
            source={image} 
            style={styles.challengeImage}
            resizeMode="contain"
          />
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.challengeDescription}>
          {description}
        </Text>

        <TouchableOpacity style={styles.continueButton}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  challengeCard: {
    backgroundColor: '#151932',
    borderRadius: 20,
    margin: 16,
    width: cardWidth,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    position: 'relative',
    minHeight: 200,  // Ensure enough space for the image
  },
  leftContent: {
    flex: 1,
    paddingRight: 16,
    paddingTop: 20,
  },
  imageContainer: {
    width: cardWidth * 0.6,
    height: 250,
    position: 'absolute',
    right: 0,
    top: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 20,
    paddingTop: 0,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCD34D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  durationText: {
    color: '#000000',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  challengeDescription: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 6,
    lineHeight: 24,
  },
  continueButton: {
    backgroundColor: '#FCD34D',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChallengeCard; 