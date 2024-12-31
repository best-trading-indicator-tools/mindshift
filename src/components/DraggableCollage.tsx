import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { MentorImage } from '../types/mentorBoard';
import Animated, {
  useAnimatedStyle,
  useAnimatedGestureHandler,
  useSharedValue,
  withSpring,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';

interface Props {
  mentors: MentorImage[];
  containerHeight?: number;
  backgroundColor?: string;
  onReorder?: (mentors: MentorImage[]) => void;
}

interface ImagePosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

interface AnimatedValues {
  startX: SharedValue<number>;
  startY: SharedValue<number>;
  offsetX: SharedValue<number>;
  offsetY: SharedValue<number>;
  scale: SharedValue<number>;
  zIndex: SharedValue<number>;
}

const DraggableImage: React.FC<{
  item: MentorImage;
  position: ImagePosition;
  screenWidth: number;
  containerHeight: number;
  IMAGE_SIZE: number;
  activeImageId: SharedValue<string | null>;
  onUpdatePosition: (id: string, x: number, y: number) => void;
}> = ({ item, position, screenWidth, containerHeight, IMAGE_SIZE, activeImageId, onUpdatePosition }) => {
  const startX = useSharedValue(position.x);
  const startY = useSharedValue(position.y);
  const offsetX = useSharedValue(position.x);
  const offsetY = useSharedValue(position.y);
  const scale = useSharedValue(position.scale);
  const zIndex = useSharedValue(position.zIndex);

  const clamp = (value: number, min: number, max: number) => {
    'worklet';
    return Math.min(Math.max(value, min), max);
  };

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { startX: number; startY: number }>({
    onStart: (_, context) => {
      context.startX = offsetX.value;
      context.startY = offsetY.value;
      scale.value = withSpring(1.1);
      zIndex.value = 1000;
      activeImageId.value = item.id;
    },
    onActive: (event, context) => {
      const newX = context.startX + event.translationX;
      const newY = context.startY + event.translationY;
      
      offsetX.value = clamp(newX, 0, screenWidth - IMAGE_SIZE);
      offsetY.value = clamp(newY, 0, containerHeight - IMAGE_SIZE);
    },
    onEnd: () => {
      scale.value = withSpring(position.scale);
      zIndex.value = position.zIndex;
      activeImageId.value = null;
      runOnJS(onUpdatePosition)(item.id, offsetX.value, offsetY.value);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
      { rotate: `${position.rotation}deg` }
    ],
    zIndex: zIndex.value,
  }));

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={animatedStyle}>
        <View 
          style={[
            styles.imageWrapper,
            activeImageId.value === item.id && styles.draggingImage
          ]}
        >
          <Image
            source={{ uri: item.url }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
};

const DraggableCollage: React.FC<Props> = ({ 
  mentors, 
  containerHeight = 300,
  backgroundColor = '#FFFFFF',
  onReorder
}) => {
  const screenWidth = Dimensions.get('window').width - 40;
  const PADDING = 20;
  const availableWidth = screenWidth - (PADDING * 2);
  const IMAGE_SIZE = 120;

  const [positions, setPositions] = useState<Record<string, ImagePosition>>(() => {
    const initialPositions: Record<string, ImagePosition> = {};
    const baseSize = Math.min(availableWidth / 2.2, (containerHeight - PADDING * 2) / 1.5);

    mentors.forEach((mentor, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const randomOffset = () => Math.random() * 10 - 5;
      const randomRotation = () => Math.random() * 10 - 5;

      initialPositions[mentor.id] = {
        x: PADDING + (column * (availableWidth / 3)) + randomOffset(),
        y: PADDING + (row * (baseSize * 0.8)) + randomOffset(),
        scale: 0.95 + Math.random() * 0.1,
        rotation: randomRotation(),
        zIndex: Math.floor(Math.random() * mentors.length)
      };
    });
    return initialPositions;
  });

  const activeImageId = useSharedValue<string | null>(null);

  const handleUpdatePosition = (id: string, x: number, y: number) => {
    setPositions(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        x,
        y,
      },
    }));
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { height: containerHeight, backgroundColor }]}>
        {mentors.map((mentor) => {
          const position = positions[mentor.id];
          if (!position) return null;

          return (
            <DraggableImage
              key={mentor.id}
              item={mentor}
              position={position}
              screenWidth={screenWidth}
              containerHeight={containerHeight}
              IMAGE_SIZE={IMAGE_SIZE}
              activeImageId={activeImageId}
              onUpdatePosition={handleUpdatePosition}
            />
          );
        })}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 8,
  },
  imageWrapper: {
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    width: 120,
    height: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  draggingImage: {
    shadowOpacity: 0.5,
    shadowRadius: 6.84,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default DraggableCollage; 