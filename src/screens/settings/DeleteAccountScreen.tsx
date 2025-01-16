import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Text, Button } from '@rneui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import auth from '@react-native-firebase/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'DeleteAccount'>;

const DeleteAccountScreen: React.FC<Props> = ({ navigation }) => {
  const handleDeleteAccount = async () => {
    try {
      const user = auth().currentUser;
      if (user) {
        await user.delete();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={30} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Delete Account</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Want to delete your account? This action will cause the following to occur and can't be undone:
        </Text>

        <View style={styles.bulletPoints}>
          <Text style={styles.bulletPoint}>
            - Your account and personal data will be permanently removed and you won't be able to log in.
          </Text>
          <Text style={styles.bulletPoint}>
            - Your audio recordings will be deleted.
          </Text>
          <Text style={styles.bulletPoint}>
            - ATTENTION: Deleting your account DOES NOT CANCEL your subscription.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteButtonText}>Delete Account</Text>
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
    justifyContent: 'space-between',
  },
  backButton: {
    width: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  description: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  bulletPoints: {
    marginBottom: 32,
  },
  bulletPoint: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  deleteButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  deleteButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DeleteAccountScreen;
