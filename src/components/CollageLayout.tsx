import React from 'react';
import { View, Image, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import { MentorImage } from '../types/mentorBoard';

interface Props {
  mentors: MentorImage[];
  containerHeight?: number;
  backgroundColor?: string;
}

const CollageLayout: React.FC<Props> = ({ 
  mentors, 
  containerHeight = 300,
  backgroundColor = '#FFFFFF'
}) => {
  // Calculate positions and transformations for each image
  const getImageStyle = (index: number, total: number): ViewStyle => {
    const PADDING = 20; // Padding to keep images away from edges
    const screenWidth = Dimensions.get('window').width - 40; // 40 for container padding
    const availableWidth = screenWidth - (PADDING * 2); // Account for padding
    // Make base size bigger by using 2.2 instead of 3 for division
    const baseSize = Math.min(availableWidth / 2.2, (containerHeight - PADDING * 2) / 1.5);
    
    // Calculate position variations (smaller range to avoid overflow)
    const getRandomOffset = () => Math.random() * 10 - 5;
    const getRandomRotation = () => Math.random() * 10 - 5;
    
    // Calculate base positions in a loose 3-column layout
    const column = index % 3;
    const row = Math.floor(index / 3);
    
    // Base positions with some randomness, but constrained
    const left = PADDING + (column * (availableWidth / 3)) + getRandomOffset();
    const top = PADDING + (row * (baseSize * 0.8)) + getRandomOffset();
    
    // Randomize size slightly (but keep it more constrained)
    const sizeVariation = 0.95 + (Math.random() * 0.1); // 0.95 to 1.05
    const size = baseSize * sizeVariation;
    
    // Add slight rotation for natural look
    const rotate = `${getRandomRotation()}deg`;
    
    // Add z-index variation
    const zIndex = Math.floor(Math.random() * total);
    
    // Ensure the image stays within bounds
    const constrainedLeft = Math.min(Math.max(left, PADDING), screenWidth - size - PADDING);
    const constrainedTop = Math.min(Math.max(top, PADDING), containerHeight - size - PADDING);
    
    return {
      position: 'absolute',
      left: constrainedLeft,
      top: constrainedTop,
      width: size,
      height: size,
      transform: [{ rotate }],
      zIndex,
    };
  };

  return (
    <View style={[styles.container, { height: containerHeight, backgroundColor }]}>
      {mentors.map((mentor, index) => (
        <View 
          key={mentor.id}
          style={[
            styles.imageWrapper,
            getImageStyle(index, mentors.length),
          ]}
        >
          <Image
            source={{ uri: mentor.url }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden', // Ensure nothing renders outside container
  },
  imageWrapper: {
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    // Add uneven edge effect
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default CollageLayout; 