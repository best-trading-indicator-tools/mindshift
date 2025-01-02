import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SunBreathIntro'>;

const SunBreathIntroScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FF8C00', '#FFD700']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <MaterialCommunityIcons name="white-balance-sunny" size={100} color="#FFF" />
          
          <Text style={styles.title}>Le Souffle du Soleil</Text>
          <Text style={styles.subtitle}>The Breath of the Sun</Text>
          
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              A powerful breathing exercise to absorb light and release negativity.
            </Text>
            <Text style={styles.description}>
              Take 5 deep breaths while visualizing golden light entering your body,
              then release dark clouds of negativity.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('SunBreathTutorial')}
          >
            <Text style={styles.buttonText}>Begin Journey</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    color: '#FFF',
    marginTop: 8,
    marginBottom: 40,
    textAlign: 'center',
  },
  descriptionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 40,
  },
  description: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#FFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
});

export default SunBreathIntroScreen; 