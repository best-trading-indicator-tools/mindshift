import Sound from 'react-native-sound';
import RNFS, { DownloadProgressCallbackResult } from 'react-native-fs';
import NetInfo from '@react-native-community/netinfo';

// Enable playback in silence mode
Sound.setCategory('Playback');

interface AudioFile {
  url: string | number;
  filename: string;
}

export const AUDIO_FILES = {
  HAVE_A_GREAT_DAY: {
    url: require('../assets/audio/haveagreatday.wav'),
    filename: 'haveagreatday.wav'
  },
  MUSIC_INCANTATION: {
    url: 'https://firebasestorage.googleapis.com/v0/b/mindshift-bd937.firebasestorage.app/o/music%2Fmusic-incantation-1.wav?alt=media&token=c8880174-bbe8-4200-a776-03613c47478c',
    filename: 'music-incantation-1.wav'
  },
  GONG: {
    url: require('../assets/audio/gong.wav'),
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

const CRITICAL_SOUNDS = [AUDIO_FILES.GONG];
const MAX_CACHED_SOUNDS = 5;  // Limit number of sounds kept in memory
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export interface AudioLoadingState {
  isLoading: boolean;
  progress: number;
  error: string | null;
}

class AudioService {
  private soundInstances: Map<string, Sound> = new Map();
  private initializationPromises: Map<string, Promise<Sound>> = new Map();
  private downloadPromises: Map<string, Promise<string>> = new Map();
  private lastUsedTimestamp: Map<string, number> = new Map();  // Track sound usage

  constructor() {
    // Preload critical sounds when service is instantiated
    this.preloadCriticalSounds();
  }

  private async preloadCriticalSounds() {
    try {
      await Promise.all(
        CRITICAL_SOUNDS.map(sound => 
          this.loadSound(sound).catch(err => 
            console.warn(`Failed to preload ${sound.filename}:`, err)
          )
        )
      );
    } catch (error) {
      console.warn('Error preloading critical sounds:', error);
    }
  }

  private manageCache() {
    if (this.soundInstances.size > MAX_CACHED_SOUNDS) {
      // Sort by last used timestamp and remove oldest
      const sortedEntries = Array.from(this.lastUsedTimestamp.entries())
        .sort(([, timeA], [, timeB]) => timeA - timeB);
      
      while (this.soundInstances.size > MAX_CACHED_SOUNDS) {
        const [filename] = sortedEntries.shift() || [];
        if (filename) {
          this.releaseSound(filename);
          this.lastUsedTimestamp.delete(filename);
        }
      }
    }
  }

  async setupAudioFile(
    audioFile: AudioFile,
    onProgress?: (state: AudioLoadingState) => void
  ): Promise<string> {
    if (typeof audioFile.url !== 'string') {
      throw new Error('setupAudioFile only supports remote URLs');
    }

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
    url: string | number,
    localPath: string,
    onProgress?: (state: AudioLoadingState) => void,
    retryCount = 0
  ): Promise<string> {
    if (typeof url !== 'string') {
      throw new Error('downloadWithRetry only supports remote URLs');
    }

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
      // Update last used timestamp
      this.lastUsedTimestamp.set(audioFile.filename, Date.now());

      // Check if we already have this sound loaded
      const existingSound = this.soundInstances.get(audioFile.filename);
      if (existingSound) {
        return existingSound;
      }

      // Check if initialization is already in progress
      const existingPromise = this.initializationPromises.get(audioFile.filename);
      if (existingPromise) {
        return existingPromise;
      }

      // Manage cache before loading new sound
      this.manageCache();

      // Handle local audio files (using require)
      if (typeof audioFile.url === 'number') {
        const initPromise = new Promise<Sound>((resolve, reject) => {
          const sound = new Sound(audioFile.url, (error) => {
            if (error) {
              console.error(`Error loading sound ${audioFile.filename}:`, error);
              this.initializationPromises.delete(audioFile.filename);
              reject(error);
              return;
            }
            
            // Configure sound
            sound.setCategory('Playback');
            sound.setVolume(1.0);
            sound.setNumberOfLoops(0);
            
            // Cache the sound instance
            this.soundInstances.set(audioFile.filename, sound);
            this.lastUsedTimestamp.set(audioFile.filename, Date.now());
            this.initializationPromises.delete(audioFile.filename);
            console.log(`🎵 Sound loaded and cached: ${audioFile.filename}`);
            
            resolve(sound);
          });
        });

        this.initializationPromises.set(audioFile.filename, initPromise);
        return initPromise;
      }

      // Handle remote audio files
      const localPath = await this.setupAudioFile(audioFile, onProgress);

      return new Promise((resolve, reject) => {
        const sound = new Sound(localPath, '', (error) => {
          if (error) {
            //console.error(`Error loading sound ${audioFile.filename}:`, error);
            reject(error);
            return;
          }
          
          // Configure sound
          sound.setCategory('Playback');
          sound.setVolume(1.0);
          sound.setNumberOfLoops(0);
          
          // Cache the sound instance
          this.soundInstances.set(audioFile.filename, sound);
          this.lastUsedTimestamp.set(audioFile.filename, Date.now());
          //console.log(`🎵 Sound loaded and cached: ${audioFile.filename}`);
          
          resolve(sound);
        });
      });
    } catch (error) {
      //console.error('Error in loadSound:', error);
      throw error;
    }
  }

  releaseSound(filename: string) {
    const sound = this.soundInstances.get(filename);
    if (sound) {
      sound.release();
      this.soundInstances.delete(filename);
      this.lastUsedTimestamp.delete(filename);
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