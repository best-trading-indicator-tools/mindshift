import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

const ConfettiOverlay = () => {
  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/animations/confetti.json')}
        autoPlay
        loop={false}
        style={styles.animation}
        speed={1.2}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});

export default ConfettiOverlay; 