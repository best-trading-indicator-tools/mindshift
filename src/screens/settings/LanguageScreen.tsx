import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Text, ListItem } from '@rneui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Language'>;

const languages = [
  { id: 'en', name: 'English' },
  { id: 'fr', name: 'Français' },
  // Add more languages as needed
];

const LanguageScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedLanguage, setSelectedLanguage] = React.useState('en');

  const handleLanguageSelect = (languageId: string) => {
    setSelectedLanguage(languageId);
    // TODO: Implement language change logic
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={30} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Language</Text>
      </View>
      
      <View style={styles.content}>
        {languages.map((language) => (
          <ListItem
            key={language.id}
            containerStyle={[
              styles.listItem,
              selectedLanguage === language.id && styles.selectedItem
            ]}
            onPress={() => handleLanguageSelect(language.id)}
          >
            <ListItem.Content>
              <ListItem.Title style={styles.itemTitle}>
                {language.name}
              </ListItem.Title>
            </ListItem.Content>
            {selectedLanguage === language.id && (
              <MaterialCommunityIcons name="check" size={24} color="#fff" />
            )}
          </ListItem>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  listItem: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 16,
    borderBottomColor: '#2A2A2A',
    marginBottom: 20,
    marginHorizontal: 16,
  },
  selectedItem: {
    backgroundColor: '#2A2A2A',
  },
  itemTitle: {
    color: '#fff',
    fontSize: 16,
  },
});

export default LanguageScreen;
