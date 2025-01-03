import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Button, ListItem } from '@rneui/themed';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DraggableFlatList, { 
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageActiveIncantations'>;

const defaultIncantations = [
  "I am a beacon of positivity",
  "I am always in motion",
  "I live each day as if it were my last",
  "I eat slowly",
  "I am grateful for this day",
  "My current limits are false",
  "I speak with intention",
  "I embody my ultra EGO every day",
  "I know I can accomplish the impossible",
  "Today, I will be pleasantly surprised",
  "I easily face and overcome challenges",
  "The harder it is, the better",
  "Having to decide to do these activities doesn't drain me",
  "I sleep wonderfully well",
  "Disciplined life makes me happy",
  "I achieve my goals effortlessly",
  "I honor my worth",
  "I work until 9pm",
  "I am pure energy",
  "I earn money easily and effortlessly",
  "I love working on my projects every day",
  "I have amazing friends",
  "I use my time to do things that matter to me",
  "I do my abs every day",
  "Today is a special day for me",
  "My life is a series of good decisions",
  "I only consume content that positively changes my life",
  "I learn from all experiences in life",
  "I train for an hour every day",
  "I eat slowly",
  "I have positive and optimistic thoughts today",
  "I am at peace",
  "I love my life",
  "I speak slowly",
  "I deliberately take a pause after each sentence",
  "I train every day",
  "I open my heart for wonderful things to come to me",
  "I am grateful for every moment of life",
  "My friends and family are extraordinary",
  "My daily decisions lead to my goals",
  "I am charismatic",
  "My life is important, the smallest actions can make a difference",
  "I love myself for who I am",
  "I deserve the love I receive",
  "I am a source of inspiration for those around me",
  "I speak with a deep, descending voice",
  "I accomplish everything I invest myself in",
  "I am grateful for the riches in my life",
  "I stretch every evening",
  "Every hour, I get up and do a physical exercise",
  "I speak very fluently",
  "I am a successful person",
  "When I am determined, nothing can stop me",
  "I don't eat after 4pm",
  "I open my mouth wide when I speak",
  "I master my emotions and can change my state in an instant",
  "My body is my temple",
  "I have fulfilling relationships",
  "I feel joy at this precise moment",
  "By allowing myself to be happy, I inspire others to be happy too",
  "My heart overflows with joy and love",
  "I smile and my day lights up",
  "I start my day with a positive attitude",
  "I am grateful to have woken up this morning",
  "I over-articulate",
  "I always give my best",
  "I have complete confidence in myself",
  "I am safe",
  "I am free from negative thoughts",
  "I know I can do it",
  "I love myself and I am in perfect health",
  "I am fortunate",
  "I have a deep voice",
  "I read 50 pages a day",
  "I work on my back every day",
  "Making money is easy for me",
  "I deserve to be happy",
  "I have a sense of humor and love laughing with people I love",
  "I nourish my body with healthy foods",
  "I trust my inner wisdom and intuition",
  "I love my work and have excellent results",
  "I am the architect of my life",
  "This day is going to be wonderfully good",
  "My mind is filled with positive thoughts and my heart with love",
  "This morning, I say thank you to life",
  "Today, I will be the best version of myself",
  "I move fast (Tate)",
  "I am focused on my goal",
  "I attract everything I desire",
  "I am patient and serene",
  "Each day is a new opportunity to do what I love",
  "I decide that today will be a great day",
  "I attract good people into my life",
  "I believe in myself and my abilities",
  "I have a lot of value",
  "I am at peace with my past",
  "I dare to step out of my comfort zone",
  "Day by day, I feel better and better",
  "I decide to give up my negative thoughts",
  "I deserve the best that life has to offer",
  "I welcome change with open arms",
  "I am strong and ambitious",
  "I have an impactful voice",
  "I stretch every day",
  "I am an accomplished person",
  "I dare to dream big",
  "I am free",
  "I feel in harmony with everything around me",
  "I express myself with ease",
  "I hold the keys to my success",
  "I succeed in everything I undertake",
  "I connect to the present moment and fully live this day",
  "I treat myself with the respect I deserve",
  "I overflow with energy. I sleep wonderfully well",
  "Every day, I create the life of my dreams",
  "I am perseverant and never give up",
  "I am a magnet that attracts fortune",
  "I exceed my limits every day",
  "I enjoy every second given to me",
  "I focus my attention on positive things",
  "I am an incredible person",
  "I listen to my intuitions",
  "I celebrate even my smallest successes",
  "I am creative and have lots of good ideas",
  "I am pure energy",
  "I live my life with enthusiasm and passion",
  "I am open to the magic of life",
  "I am the master of my thoughts and actions"
];

const ManageActiveIncantationsScreen: React.FC<Props> = ({ navigation }) => {
  const [incantations, setIncantations] = useState(defaultIncantations);

  const renderItem = ({ item, drag, isActive }: RenderItemParams<string>) => (
    <ScaleDecorator>
      <ListItem
        onLongPress={drag}
        containerStyle={[
          styles.itemContainer,
          isActive && styles.draggingItem
        ]}
      >
        <MaterialCommunityIcons name="drag" size={24} color="#666" />
        <ListItem.Content>
          <ListItem.Title style={styles.itemText}>{item}</ListItem.Title>
        </ListItem.Content>
      </ListItem>
    </ScaleDecorator>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <DraggableFlatList
            data={incantations}
            renderItem={renderItem}
            keyExtractor={(item, index) => `incantation-${index}`}
            onDragEnd={({ data }) => setIncantations(data)}
            contentContainerStyle={styles.listContent}
            dragItemOverflow={true}
            activationDistance={5}
          />
          
          <View style={styles.buttonContainer}>
            <Button 
              title="Start Practice" 
              buttonStyle={styles.startButton}
              onPress={() => navigation.navigate('ActiveIncantationsExercise', {
                incantations
              })} 
            />
          </View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  listContent: {
    paddingTop: 8,
  },
  itemContainer: {
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E2E',
    paddingVertical: 12,
  },
  itemText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#000000',
  },
  startButton: {
    backgroundColor: '#FFD700',  // Yellow color
    borderRadius: 8,
    paddingVertical: 12,
  },
  draggingItem: {
    backgroundColor: '#3B3B3B',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});

export default ManageActiveIncantationsScreen; 