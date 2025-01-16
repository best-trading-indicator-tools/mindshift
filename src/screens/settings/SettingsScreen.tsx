import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Text, ListItem } from '@rneui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import auth from '@react-native-firebase/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const handleLogout = async () => {
    try {
      await auth().signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const settingsItems = [
    {
      title: 'Push Notifications',
      icon: 'bell-outline',
      onPress: () => navigation.navigate('NotificationsPush'),
    },
    {
      title: 'Email Notifications',
      icon: 'email-outline',
      onPress: () => navigation.navigate('NotificationsEmail'),
    },
    {
      title: 'Language',
      icon: 'translate',
      rightTitle: 'English',
      onPress: () => navigation.navigate('Language'),
    },
    {
      title: 'Delete Account',
      icon: 'delete-outline',
      onPress: () => navigation.navigate('DeleteAccount'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.content}>
        {settingsItems.map((item, index) => (
          <ListItem
            key={index}
            onPress={item.onPress}
            containerStyle={styles.listItem}
            bottomDivider
          >
            <MaterialCommunityIcons name={item.icon} size={24} color="#fff" />
            <ListItem.Content>
              <ListItem.Title style={styles.itemTitle}>{item.title}</ListItem.Title>
            </ListItem.Content>
            {item.rightTitle && (
              <Text style={styles.rightTitle}>{item.rightTitle}</Text>
            )}
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
          </ListItem>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={24} color="#FF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
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
  },
  listItem: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 16,
    borderBottomColor: '#2A2A2A',
    marginBottom: 20,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 16,
  },
  rightTitle: {
    color: '#fff',
    fontSize: 16,
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  logoutText: {
    color: '#FF4444',
    fontSize: 16,
    marginLeft: 12,
  },
});

export default SettingsScreen; 