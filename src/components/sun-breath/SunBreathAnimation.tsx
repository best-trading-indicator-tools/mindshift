import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import {
  Canvas,
  Path,
  Group,
  Blur,
  Paint,
  vec,
} from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withSequence,
  withRepeat,
  withSpring,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface SunBreathAnimationProps {
  isInhaling: boolean;
  progress: number;
}

const SunBreathAnimation: React.FC<SunBreathAnimationProps> = ({
  isInhaling,
  progress,
}) => {
  // Animation values using Reanimated
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const smokeY = useSharedValue(height);
  
  // Light rays configuration
  const numRays = 12; // Increased number of rays
  const rayLength = height * 0.8; // Longer rays
  
  useEffect(() => {
    if (isInhaling) {
      // Inhale animation
      opacity.value = withTiming(1, { duration: 1000 });
      scale.value = withSpring(1.2, { damping: 10 });
    } else {
      // Exhale animation
      opacity.value = withTiming(0, { duration: 1000 });
      scale.value = withSpring(1, { damping: 10 });
      // Animate smoke rising
      smokeY.value = withTiming(0, { duration: 2000 });
    }
  }, [isInhaling]);
  
  // Create light rays paths
  const createLightRaysPaths = () => {
    const paths: string[] = [];
    const centerX = width / 2;
    const startY = height;
    
    for (let i = 0; i < numRays; i++) {
      const angle = (i * Math.PI) / (numRays - 1);
      const endX = centerX + Math.sin(angle) * rayLength;
      const endY = startY - Math.cos(angle) * rayLength;
      
      paths.push(`M ${centerX} ${startY} L ${endX} ${endY}`);
    }
    
    return paths;
  };

  const lightRaysPaths = createLightRaysPaths();

  // Enhanced smoke effect configuration
  const smokeParticles = Array(20).fill(0).map((_, i) => ({
    x: width * (0.2 + Math.random() * 0.6),
    y: height + (i * 20),
    controlX: width * (0.2 + Math.random() * 0.6),
    controlY: height * 0.7,
    endX: width * (0.2 + Math.random() * 0.6),
    endY: height * 0.4,
    opacity: 0.2 + Math.random() * 0.3,
  }));

  return (
    <Canvas style={{ flex: 1 }}>
      <Group>
        {/* Light Rays */}
        {isInhaling && (
          <Group transform={[{ scale: scale.value }]}>
            {lightRaysPaths.map((path: string, index: number) => (
              <Path
                key={index}
                path={path}
                color={`rgba(255, 215, 0, ${0.3 + (opacity.value * 0.4)})`}
              >
                <Paint>
                  <Blur blur={20 + (scale.value * 10)} />
                </Paint>
              </Path>
            ))}
          </Group>
        )}
        
        {/* Smoke Effect */}
        {!isInhaling && (
          <Group transform={[{ translateY: smokeY.value }]}>
            {smokeParticles.map((particle, index: number) => (
              <Path
                key={index}
                path={`M ${particle.x} ${particle.y} 
                       Q ${particle.controlX} ${particle.controlY} 
                         ${particle.endX} ${particle.endY}`}
                color={`rgba(100, 100, 100, ${particle.opacity})`}
              >
                <Paint>
                  <Blur blur={15} />
                </Paint>
              </Path>
            ))}
          </Group>
        )}
      </Group>
    </Canvas>
  );
};

export default SunBreathAnimation; 