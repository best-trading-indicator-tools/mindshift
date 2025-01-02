import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface InfoBubbleProps {
  message: string;
}

const InfoBubble: React.FC<InfoBubbleProps> = ({ message }) => {
  return (
    <View style={styles.container}>
      <View style={styles.accentLine} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1E2532',
    borderRadius: 12,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  accentLine: {
    width: 4,
    backgroundColor: '#FFD700',
  },
  text: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
    padding: 16,
    flex: 1,
  },
});

export default InfoBubble; 