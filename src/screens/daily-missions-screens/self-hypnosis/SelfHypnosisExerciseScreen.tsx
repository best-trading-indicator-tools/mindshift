import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Sound from 'react-native-sound';
import Slider from '@react-native-community/slider';
import { markDailyExerciseAsCompleted } from '../../../utils/exerciseCompletion';
import LinearGradient from 'react-native-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'SelfHypnosisExercise'>;

interface AudioTrack {
  id: string;
  title: string;
  duration: number;
  source: any;
  description: string;
}

const AUDIO_TRACKS: AudioTrack[] = [
  {
    id: '1',
    title: 'Deep Relaxation',
    duration: 0, // This will be set when audio loads
    source: require('../../../assets/audio/meditation/audio-relaxation-without-music-aurora.mp3'),
    description: 'A guided session to help you achieve a deep state of relaxation and inner peace.'
  },
  // Add more tracks here when you have them
];

const SelfHypnosisExerciseScreen: React.FC<Props> = ({ navigation }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack>(AUDIO_TRACKS[0]);
  const soundRef = useRef<Sound | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadAudio(selectedTrack);
    return () => cleanupAudio();
  }, [selectedTrack]);

  const loadAudio = (track: AudioTrack) => {
    cleanupAudio();
    const sound = new Sound(track.source, (error) => {
      if (error) {
        console.error('Failed to load audio:', error);
        return;
      }
      soundRef.current = sound;
      setDuration(sound.getDuration());
    });
  };

  const cleanupAudio = () => {
    if (soundRef.current) {
      soundRef.current.release();
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    setIsPlaying(false);
    setProgress(0);
  };

  const handlePlayPause = () => {
    if (!soundRef.current) return;

    if (isPlaying) {
      soundRef.current.pause();
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    } else {
      soundRef.current.play((success) => {
        if (!success) {
          console.log('Audio playback failed');
        }
      });
      progressInterval.current = setInterval(() => {
        soundRef.current?.getCurrentTime((seconds) => {
          setProgress(seconds);
        });
      }, 1000);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSliderChange = (value: number) => {
    if (!soundRef.current) return;
    soundRef.current.setCurrentTime(value);
    setProgress(value);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleDone = () => {
    cleanupAudio();
    markDailyExerciseAsCompleted('self-hypnosis');
    navigation.goBack();
  };

  const handleExit = () => {
    cleanupAudio();
    navigation.navigate("MainTabs");
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FA']}
        style={styles.gradient}
      >
        <TouchableOpacity onPress={handleExit} style={styles.exitButton}>
          <MaterialCommunityIcons name="close" size={24} color="rgba(0,0,0,0.6)" />
        </TouchableOpacity>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.mainContent}>
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle}>{selectedTrack.title}</Text>
              <Text style={styles.trackDescription}>{selectedTrack.description}</Text>
            </View>

            <View style={styles.playerSection}>
              <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
                <MaterialCommunityIcons 
                  name={isPlaying ? "pause" : "play"} 
                  size={32} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>

              <View style={styles.progressContainer}>
                <Slider
                  style={styles.progressBar}
                  value={progress}
                  minimumValue={0}
                  maximumValue={duration}
                  minimumTrackTintColor="#FF6B6B"
                  maximumTrackTintColor="rgba(255, 107, 107, 0.2)"
                  thumbTintColor="#FF6B6B"
                  onSlidingComplete={handleSliderChange}
                />
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{formatTime(progress)}</Text>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
          <Text style={styles.doneButtonText}>I'm Done</Text>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    flex: 1,
    paddingTop: 16,
  },
  exitButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  trackInfo: {
    marginBottom: 60,
  },
  trackTitle: {
    color: '#1A1A1A',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  trackDescription: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  playerSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: "#FF6B6B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: 4,
  },
  progressBar: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    marginTop: -8,
  },
  timeText: {
    color: 'rgba(0,0,0,0.4)',
    fontSize: 13,
    fontWeight: '500',
  },
  doneButton: {
    marginHorizontal: 24,
    marginBottom: 32,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#FF6B6B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
});

export default SelfHypnosisExerciseScreen;
