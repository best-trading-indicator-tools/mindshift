import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { Canvas, Circle, vec, Paint, Group, BlurMask } from '@shopify/react-native-skia';
import { mix } from '@shopify/react-native-skia';

const { width, height } = Dimensions.get('window');
const CENTER = vec(width / 2, height / 2);
const CIRCLE_RADIUS = 50;
const NUM_RAYS = 12;
const NUM_CLOUDS = 8;

interface Props {
  isInhaling: boolean;
  progress: number;
}

const SunBreathAnimation: React.FC<Props> = ({ isInhaling, progress }) => {
  const rays = Array.from({ length: NUM_RAYS });
  const clouds = Array.from({ length: NUM_CLOUDS });

  return (
    <Canvas style={styles.canvas}>
      {/* Main breathing circle */}
      <Circle
        c={CENTER}
        r={mix(progress, CIRCLE_RADIUS, CIRCLE_RADIUS * 2)}
        color={isInhaling ? "#FFD700" : "#333"}
      >
        <BlurMask blur={10} style="solid" />
      </Circle>

      {/* Light rays during inhale */}
      {isInhaling && (
        <Group>
          {rays.map((_, index) => {
            const angle = (index * 2 * Math.PI) / NUM_RAYS;
            const rayLength = mix(progress, CIRCLE_RADIUS, CIRCLE_RADIUS * 4);
            const x1 = CENTER.x + Math.cos(angle) * CIRCLE_RADIUS;
            const y1 = CENTER.y + Math.sin(angle) * CIRCLE_RADIUS;
            const x2 = CENTER.x + Math.cos(angle) * rayLength;
            const y2 = CENTER.y + Math.sin(angle) * rayLength;

            return (
              <Group key={index} opacity={mix(progress, 0.3, 0.8)}>
                <Paint>
                  <BlurMask blur={20} style="solid" />
                </Paint>
                <Circle
                  c={vec(x1, y1)}
                  r={5}
                  color="#FFD700"
                />
                <Circle
                  c={vec(x2, y2)}
                  r={2}
                  color="#FFD700"
                />
              </Group>
            );
          })}
        </Group>
      )}

      {/* Dark clouds during exhale */}
      {!isInhaling && (
        <Group>
          {clouds.map((_, index) => {
            const angle = (index * 2 * Math.PI) / NUM_CLOUDS;
            const cloudDistance = mix(progress, CIRCLE_RADIUS * 4, CIRCLE_RADIUS);
            const x = CENTER.x + Math.cos(angle) * cloudDistance;
            const y = CENTER.y + Math.sin(angle) * cloudDistance;

            return (
              <Group key={index} opacity={mix(progress, 0.8, 0)}>
                <Paint>
                  <BlurMask blur={30} style="solid" />
                </Paint>
                <Circle
                  c={vec(x, y)}
                  r={20}
                  color="#333"
                />
              </Group>
            );
          })}
        </Group>
      )}
    </Canvas>
  );
};

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    width: width,
    height: height,
  },
});

export default SunBreathAnimation; 