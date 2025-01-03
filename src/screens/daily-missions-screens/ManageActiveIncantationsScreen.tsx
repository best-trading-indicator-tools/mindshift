import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { Button, ListItem } from '@rneui/themed';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageActiveIncantations'>;

const defaultIncantations = [
  'I am a beacon of positivity',
  'I am always in motion',
  'I live each day as if it were my last',
  'I eat slowly',
];

const ManageActiveIncantationsScreen: React.FC<Props> = ({ navigation }) => {
  const [incantations, setIncantations] = useState(defaultIncantations);

  const renderItem = ({ item, drag, isActive }: RenderItemParams<string>) => (
    <ListItem
      onLongPress={drag}
      containerStyle={[
        styles.itemContainer,
        { backgroundColor: isActive ? '#3B3B3B' : '#1E1E1E' }
      ]}
    >
      <ListItem.Content>
        <ListItem.Title style={styles.itemText}>{item}</ListItem.Title>
      </ListItem.Content>
    </ListItem>
  );

  return (
    <View style={styles.container}>
      <DraggableFlatList
        data={incantations}
        renderItem={renderItem}
        keyExtractor={(item, index) => `incantation-${index}`}
        onDragEnd={({ data }) => setIncantations(data)}
      />
      
      <Button 
        title="Start Practice" 
        onPress={() => navigation.navigate('ActiveIncantationsExercise', {
          incantations
        })} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  itemContainer: {
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E2E',
  },
  itemText: {
    color: '#FFFFFF',
  },
});

export default ManageActiveIncantationsScreen; 