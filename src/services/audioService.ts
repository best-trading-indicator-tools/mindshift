import Sound from 'react-native-sound';
import RNFS, { DownloadProgressCallbackResult } from 'react-native-fs';
import NetInfo from '@react-native-community/netinfo';

// Enable playback in silence mode
Sound.setCategory('Playback');

interface AudioFile {
  url: string;
  filename: string;
}

export const AUDIO_FILES = {
  HAVE_A_GREAT_DAY: {
    url: 'https://firebasestorage.googleapis.com/v0/b/mindshift-bd937.firebasestorage.app/o/music%2Fhaveagreatday.wav?alt=media&token=140dd18b-06c1-45b5-acb2-c65a58b8d090',
    filename: 'haveagreatday.wav'
  },
  MUSIC_INCANTATION: {
    url: 'https://firebasestorage.googleapis.com/v0/b/mindshift-bd937.firebasestorage.app/o/music%2Fmusic-incantation-1.wav?alt=media&token=c8880174-bbe8-4200-a776-03613c47478c',
    filename: 'music-incantation-1.wav'
  },
  GONG: {
    url: 'https://firebasestorage.googleapis.com/v0/b/mindshift-bd937.firebasestorage.app/o/audio%2Fgong.wav?alt=media&token=c1843866-9a52-4ce6-8c24-e45a9d8188ad',
    filename: 'gong.wav'
  },
  NECKLACE_BEADS: {
    url: 'https://firebasestorage.googleapis.com/v0/b/mindshift-bd937.firebasestorage.app/o/music%2Fnecklace-beads.wav?alt=media&token=eccad8d7-1ac2-48da-ab0d-188462ed0557',
    filename: 'necklace-beads.wav'
  },
  DEEP_BREATHE_IN: {
    url: 'https://firebasestorage.googleapis.com/v0/b/mindshift-bd937.firebasestorage.app/o/audio%2Fdeep-breathe-in-5s.wav?alt=media&token=1d763e41-fc27-4194-a577-db890e2b96c8',
    filename: 'deep-breathe-in.wav'
  },
  DEEP_BREATHE_OUT: {
    url: 'https://firebasestorage.googleapis.com/v0/b/mindshift-bd937.firebasestorage.app/o/audio%2Fdeep-breathe-out-5s.wav?alt=media&token=701d3d02-54db-4fa7-b174-244d69ac64ed',
    filename: 'deep-breathe-out.wav'
  },
  SUN_BREATHE_IN: {
    url: 'https://firebasestorage.googleapis.com/v0/b/mindshift-bd937.firebasestorage.app/o/audio%2Fdeep-breathe-in-5s.wav?alt=media&token=1d763e41-fc27-4194-a577-db890e2b96c8',
    filename: 'sun-breathe-in.wav'
  },
  SUN_BREATHE_OUT: {
    url: 'https://firebasestorage.googleapis.com/v0/b/mindshift-bd937.firebasestorage.app/o/audio%2Fdeep-breathe-out-5s.wav?alt=media&token=701d3d02-54db-4fa7-b174-244d69ac64ed',
    filename: 'sun-breathe-out.wav'
  }
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export interface AudioLoadingState {
  isLoading: boolean;
  progress: number;
  error: string | null;
}

class AudioService {
  private soundInstances: Map<string, Sound> = new Map();
  private downloadPromises: Map<string, Promise<string>> = new Map();

  async setupAudioFile(
    audioFile: AudioFile,
    onProgress?: (state: AudioLoadingState) => void
  ): Promise<string> {
    const { url, filename } = audioFile;
    const localPath = `${RNFS.CachesDirectoryPath}/${filename}`;

    try {
      // Check if we already have a download in progress
      const existingPromise = this.downloadPromises.get(filename);
      if (existingPromise) {
        return existingPromise;
      }

      // Check if file exists in cache
      const exists = await RNFS.exists(localPath);
      if (exists) {
        // Verify file integrity
        try {
          const stats = await RNFS.stat(localPath);
          if (stats.size > 0) {
            return localPath;
          }
          // If file exists but is empty/corrupted, delete it
          await RNFS.unlink(localPath);
        } catch (error) {
          console.error('Error checking cached file:', error);
          // If error checking file, delete it to be safe
          await RNFS.unlink(localPath).catch(() => {});
        }
      }

      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('No internet connection');
      }

      // Create download promise
      const downloadPromise = this.downloadWithRetry(url, localPath, onProgress);
      this.downloadPromises.set(filename, downloadPromise);

      // Wait for download to complete
      const result = await downloadPromise;
      
      // Clear the promise from the map
      this.downloadPromises.delete(filename);
      
      return result;
    } catch (error) {
      console.error('Error setting up audio file:', error);
      onProgress?.({
        isLoading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      throw error;
    }
  }

  private async downloadWithRetry(
    url: string,
    localPath: string,
    onProgress?: (state: AudioLoadingState) => void,
    retryCount = 0
  ): Promise<string> {
    try {
      onProgress?.({
        isLoading: true,
        progress: 0,
        error: null
      });

      const downloadResult = RNFS.downloadFile({
        fromUrl: url,
        toFile: localPath,
        progress: (res: DownloadProgressCallbackResult) => {
          const percent = (res.bytesWritten / res.contentLength) * 100;
          onProgress?.({
            isLoading: true,
            progress: percent / 100,
            error: null
          });
        },
        background: true,
        discretionary: true,
      });

      const response = await downloadResult.promise;

      if (response.statusCode === 200) {
        onProgress?.({
          isLoading: false,
          progress: 1,
          error: null
        });
        return localPath;
      }
      throw new Error(`Download failed with status ${response.statusCode}`);
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        console.log(`Retry attempt ${retryCount + 1} for ${url}`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return this.downloadWithRetry(url, localPath, onProgress, retryCount + 1);
      }
      throw error;
    }
  }

  async loadSound(
    audioFile: AudioFile,
    onProgress?: (state: AudioLoadingState) => void
  ): Promise<Sound> {
    try {
      // Check if we already have this sound loaded
      const existingSound = this.soundInstances.get(audioFile.filename);
      if (existingSound) {
        return existingSound;
      }

      const localPath = await this.setupAudioFile(audioFile, onProgress);

      return new Promise((resolve, reject) => {
        const sound = new Sound(localPath, '', (error) => {
          if (error) {
            console.error('Error loading sound:', error);
            reject(error);
            return;
          }
          
          // Configure sound
          sound.setCategory('Playback');
          sound.setVolume(1.0);
          sound.setNumberOfLoops(0);
          
          // Cache the sound instance
          this.soundInstances.set(audioFile.filename, sound);
          console.log(`🎵 Sound loaded and cached: ${audioFile.filename}`);
          
          resolve(sound);
        });
      });
    } catch (error) {
      console.error('Error in loadSound:', error);
      throw error;
    }
  }

  releaseSound(filename: string) {
    const sound = this.soundInstances.get(filename);
    if (sound) {
      sound.release();
      this.soundInstances.delete(filename);
    }
  }

  releaseAllSounds() {
    this.soundInstances.forEach(sound => sound.release());
    this.soundInstances.clear();
  }

  // Cleanup old cache files that haven't been accessed in a while
  async cleanupCache(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    try {
      const files = await RNFS.readDir(RNFS.CachesDirectoryPath);
      const now = new Date().getTime();

      for (const file of files) {
        if (file.name.endsWith('.wav')) {
          const stats = await RNFS.stat(file.path);
          const age = now - new Date(stats.mtime).getTime();
          if (age > maxAge) {
            await RNFS.unlink(file.path);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }
}

export const audioService = new AudioService(); 