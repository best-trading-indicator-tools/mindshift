import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Image,
  SafeAreaView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

type MusicSelectionScreenProps = {
  navigation: any;
  route: RouteProp<RootStackParamList, 'MusicSelection'>;
};

const MusicSelectionScreen: React.FC<MusicSelectionScreenProps> = ({ navigation, route }) => {
  const { exerciseName } = route.params;

  const handleOpenApp = async (appScheme: string, appStoreUrl: string) => {
    try {
      await Linking.openURL(appScheme);
    } catch (error) {
      // Only show error if we can't open the app store as fallback
      try {
        await Linking.openURL(appStoreUrl);
      } catch (storeError) {
        console.error('Error opening app:', error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={32} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Background Music</Text>
          <Text style={styles.subtitle}>{exerciseName}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.appButton}
          onPress={() => handleOpenApp(
            'spotify://',
            Platform.select({
              ios: 'https://apps.apple.com/app/spotify/id324684580',
              android: 'market://details?id=com.spotify.music',
            }) || ''
          )}
        >
          <Image
            source={require('../assets/illustrations/icons/spotify.png')}
            style={styles.appIcon}
          />
          <Text style={styles.appName}>Spotify</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.appButton}
          onPress={() => handleOpenApp(
            'music://',
            Platform.select({
              ios: 'https://music.apple.com',
              android: 'market://details?id=com.apple.android.music',
            }) || ''
          )}
        >
          <Image
            source={require('../assets/illustrations/icons/applemusic.png')}
            style={styles.appIcon}
          />
          <Text style={styles.appName}>Apple Music</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.appButton}
          onPress={() => handleOpenApp(
            'soundcloud://',
            Platform.select({
              ios: 'https://apps.apple.com/app/soundcloud/id336353151',
              android: 'market://details?id=com.soundcloud.android',
            }) || ''
          )}
        >
          <Image
            source={require('../assets/illustrations/icons/soundcloud.png')}
            style={styles.appIcon}
          />
          <Text style={styles.appName}>SoundCloud</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3744',
  },
  backButton: {
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 24,
  },
  appButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A3744',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MusicSelectionScreen; 