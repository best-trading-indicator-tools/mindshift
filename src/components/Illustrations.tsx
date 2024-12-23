import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface IllustrationProps {
  style?: StyleProp<ViewStyle>;
}

const IconComponent = MaterialCommunityIcons as any;

const IllustrationWrapper: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({ children, style }) => (
  <View style={[{ 
    width: 60, 
    height: 60, 
    backgroundColor: '#2A2A2A',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center'
  }, style]}>
    {children}
  </View>
);

export const MeditationIllustration: React.FC<IllustrationProps> = ({ style }) => (
  <IllustrationWrapper style={style}>
    <IconComponent name="meditation" size={30} color="#fff" />
  </IllustrationWrapper>
);

export const WalkingIllustration: React.FC<IllustrationProps> = ({ style }) => (
  <IllustrationWrapper style={style}>
    <IconComponent name="walk" size={30} color="#fff" />
  </IllustrationWrapper>
);

export const GratitudeIllustration: React.FC<IllustrationProps> = ({ style }) => (
  <IllustrationWrapper style={style}>
    <IconComponent name="heart" size={30} color="#fff" />
  </IllustrationWrapper>
);
