import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Modal } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Sound from 'react-native-sound';
import Slider from '@react-native-community/slider';
import { markDailyExerciseAsCompleted, markChallengeExerciseAsCompleted } from '../../../utils/exerciseCompletion';
import LinearGradient from 'react-native-linear-gradient';
import { schedulePostHypnosisNotification } from '../../../services/notificationService';

type Props = NativeStackScreenProps<RootStackParamList, 'SelfHypnosisExercise'>;

interface AudioTrack {
  id: string;
  title: string;
  duration: number;
  source: any;
  description: string;
}

const SPEEDS = [
  { label: '0.5×', value: 0.5 },
  { label: 'Normal', value: 1 },
  { label: '1.5×', value: 1.5 },
  { label: '2×', value: 2 },
];

const AUDIO_TRACKS: AudioTrack[] = [
  {
    id: '1',
    title: 'Guided Relaxation (with music)',
    duration: 0,
    source: require('../../../assets/audio/meditation/audio-relaxation-music.mp3'),
    description: 'A guided session with soothing background music to help you achieve a deep state of relaxation.'
  },
  {
    id: '2',
    title: 'Guided Relaxation (without music)',
    duration: 0,
    source: require('../../../assets/audio/meditation/audio-relaxation-without-music-aurora.mp3'),
    description: 'A guided session without background music, focusing purely on voice guidance for deep relaxation.'
  },
];

const THUMB_DOT = { uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF0WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZS5uczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS41LjAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIj4KICAgIDx4bXA6Q3JlYXRvclRvb2w+QWRvYmUgUGhvdG9zaG9wPC94bXA6Q3JlYXRvclRvb2w+CiAgPC9yZGY6RGVzY3JpcHRpb24+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+Pj5IYwAAAAlwSFlzAAALEwAACxMBAJqcGAAAADNJREFUGJVjYMAEjf///2fEJsjEgAewixCrAkMQuwKYQmQFTOgK0BWBFGAoQlZE0EZCigD7lBH70G8cigAAAABJRU5ErkJggg==' };

const SelfHypnosisExerciseScreen: React.FC<Props> = ({ navigation, route }) => {
  const { context = 'daily', challengeId, returnTo } = route.params || {};
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack>(AUDIO_TRACKS[0]);
  const [showSpeedModal, setShowSpeedModal] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const soundRef = useRef<Sound | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

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

  const handleSpeedChange = (speed: number) => {
    if (!soundRef.current) return;
    soundRef.current.setSpeed(speed);
    setCurrentSpeed(speed);
    setShowSpeedModal(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleDone = async () => {
    try {
      cleanupAudio();
      if (context === 'challenge' && challengeId && !isCompleted) {
        await markChallengeExerciseAsCompleted(challengeId, 'self-hypnosis');
        setIsCompleted(true);
      } else {
        await markDailyExerciseAsCompleted('self-hypnosis');
      }
      
      // Schedule notification for optimal follow-up exercises
      await schedulePostHypnosisNotification();
      
      if (returnTo) {
        navigation.navigate('ChallengeDetail', {
          challenge: {
            id: challengeId || '1',
            title: 'Ultimate',
            duration: 21,
            description: 'Your subconscious mind shapes your reality.',
            image: require('../../../assets/illustrations/challenges/challenge-21.png')
          }
        });
      } else {
        navigation.navigate('MainTabs');
      }
    } catch (error) {
      console.error('Failed to complete exercise:', error);
      navigation.navigate('MainTabs');
    }
  };

  const handleExit = () => {
    cleanupAudio();
    navigation.navigate("MainTabs");
  };

  const handleSeek = (value: number, track: AudioTrack) => {
    if (soundRef.current && selectedTrack.id === track.id) {
      soundRef.current.setCurrentTime(value);
      setProgress(value);
    }
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
              <Text style={styles.trackTitle}>Guided Relaxation</Text>
              <Text style={styles.trackDescription}>Choose your preferred version to start your relaxation journey.</Text>
            </View>

            {AUDIO_TRACKS.map((track) => (
              <TouchableOpacity
                key={track.id}
                style={[
                  styles.playerCard,
                  selectedTrack.id === track.id && styles.selectedCard
                ]}
                onPress={() => setSelectedTrack(track)}
              >
                <View style={styles.audioFileInfo}>
                  <MaterialCommunityIcons 
                    name="music-note" 
                    size={24} 
                    color={selectedTrack.id === track.id ? "#FF6B6B" : "#666"} 
                  />
                  <View style={styles.audioTextContainer}>
                    <Text style={[
                      styles.audioTitle,
                      selectedTrack.id === track.id && styles.selectedText
                    ]}>
                      {track.title}
                    </Text>
                    <Text style={styles.audioSize}>{formatTime(duration)}</Text>
                  </View>
                </View>

                <View style={styles.playerControls}>
                  <TouchableOpacity 
                    onPress={selectedTrack.id === track.id ? handlePlayPause : () => {
                      setSelectedTrack(track);
                      setTimeout(handlePlayPause, 100);
                    }} 
                    style={styles.controlButton}
                  >
                    <MaterialCommunityIcons 
                      name={isPlaying && selectedTrack.id === track.id ? "pause" : "play"} 
                      size={24} 
                      color={selectedTrack.id === track.id ? "#FF6B6B" : "#666"} 
                    />
                  </TouchableOpacity>

                  <View style={styles.progressBar}>
                    <Slider
                      style={{width: '100%'}}
                      minimumValue={0}
                      maximumValue={duration}
                      value={selectedTrack.id === track.id ? progress : 0}
                      onSlidingComplete={(value) => handleSeek(value, track)}
                      minimumTrackTintColor={selectedTrack.id === track.id ? "#FF6B6B" : "rgba(0,0,0,0.1)"}
                      maximumTrackTintColor="rgba(0,0,0,0.1)"
                      thumbImage={THUMB_DOT}
                    />
                    <Text style={[
                      styles.timeText,
                      selectedTrack.id === track.id && styles.selectedText
                    ]}>
                      {selectedTrack.id === track.id ? formatTime(progress) : '0:00'}
                    </Text>
                  </View>

                  <TouchableOpacity 
                    onPress={() => selectedTrack.id === track.id && setShowSpeedModal(true)} 
                    style={styles.controlButton}
                  >
                    <MaterialCommunityIcons 
                      name="cog" 
                      size={24} 
                      color={selectedTrack.id === track.id ? "#FF6B6B" : "#666"} 
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
          <Text style={styles.doneButtonText}>I'm Done</Text>
        </TouchableOpacity>

        <Modal
          visible={showSpeedModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSpeedModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSpeedModal(false)}
          >
            <View style={styles.speedModal}>
              <Text style={styles.speedTitle}>Speed</Text>
              {SPEEDS.map((speed) => (
                <TouchableOpacity
                  key={speed.label}
                  style={[
                    styles.speedOption,
                    currentSpeed === speed.value && styles.speedOptionSelected
                  ]}
                  onPress={() => handleSpeedChange(speed.value)}
                >
                  <Text style={[
                    styles.speedText,
                    currentSpeed === speed.value && styles.speedTextSelected
                  ]}>
                    {speed.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
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
    marginBottom: 32,
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
  playerCard: {
    backgroundColor: '#E8E9EC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  audioFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  audioTextContainer: {
    marginLeft: 12,
  },
  audioTitle: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  audioSize: {
    fontSize: 13,
    color: '#4A4A4A',
    marginTop: 2,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  controlButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 300,
  },
  speedTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  speedOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  speedOptionSelected: {
    backgroundColor: 'rgba(255,107,107,0.1)',
  },
  speedText: {
    fontSize: 15,
    color: '#666',
  },
  speedTextSelected: {
    color: '#FF6B6B',
    fontWeight: '500',
  },
  selectedCard: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  selectedText: {
    color: '#FF6B6B',
  },
});

export default SelfHypnosisExerciseScreen;
