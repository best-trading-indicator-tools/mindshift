import RNFS, { DownloadProgressCallbackResult } from 'react-native-fs';
import NetInfo from '@react-native-community/netinfo';

interface VideoFile {
  url: string;
  filename: string;
}

export const BREATHING_VIDEOS = {
  RAY_OF_LIGHTS: {
    url: 'https://firebasestorage.googleapis.com/v0/b/mindshift-bd937.firebasestorage.app/o/videos%2Frayoflights.m4v?alt=media&token=117faefd-c2f3-43bb-a343-444a5e119a26',
    filename: 'rayoflights.m4v'
  },
  DARK_CLOUDS: {
    url: 'https://firebasestorage.googleapis.com/v0/b/mindshift-bd937.firebasestorage.app/o/videos%2Fdarkclouds.m4v?alt=media&token=7bdebc3e-16b8-40eb-ba64-cbccbaecd5a3',
    filename: 'darkclouds.m4v'
  }
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export interface VideoLoadingState {
  isLoading: boolean;
  progress: number;
  error: string | null;
}

class VideoService {
  private downloadPromises: Map<string, Promise<string>> = new Map();
  private memoryCache: Map<string, string> = new Map();
  private preloadComplete: boolean = false;

  async setupVideoFile(
    videoFile: VideoFile,
    onProgress?: (state: VideoLoadingState) => void
  ): Promise<string> {
    const { url, filename } = videoFile;
    const localPath = `${RNFS.CachesDirectoryPath}/${filename}`;

    // Check memory cache first for instant access
    const memoryCached = this.memoryCache.get(filename);
    if (memoryCached) {
      onProgress?.({
        isLoading: false,
        progress: 1,
        error: null
      });
      return memoryCached;
    }

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
            // Add to memory cache
            this.memoryCache.set(filename, localPath);
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
      
      // Clear the promise from the map and add to memory cache
      this.downloadPromises.delete(filename);
      this.memoryCache.set(filename, result);
      
      return result;
    } catch (error) {
      console.error('Error setting up video file:', error);
      onProgress?.({
        isLoading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      throw error;
    }
  }

  async preloadAllBreathingVideos(): Promise<boolean> {
    if (this.preloadComplete) return true;

    try {
      const [inhaleVideo, exhaleVideo] = await Promise.all([
        this.getBreathingVideo('inhale'),
        this.getBreathingVideo('exhale')
      ]);

      // Verify both videos are in memory cache
      const inhaleInCache = this.memoryCache.has(BREATHING_VIDEOS.RAY_OF_LIGHTS.filename);
      const exhaleInCache = this.memoryCache.has(BREATHING_VIDEOS.DARK_CLOUDS.filename);

      this.preloadComplete = inhaleInCache && exhaleInCache;
      return this.preloadComplete;
    } catch (error) {
      console.error('Error preloading breathing videos:', error);
      this.preloadComplete = false;
      return false;
    }
  }

  isPreloadComplete(): boolean {
    return this.preloadComplete;
  }

  private async downloadWithRetry(
    url: string,
    localPath: string,
    onProgress?: (state: VideoLoadingState) => void,
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

  async getBreathingVideo(type: 'inhale' | 'exhale', onProgress?: (state: VideoLoadingState) => void): Promise<string> {
    const videoFile = type === 'inhale' ? BREATHING_VIDEOS.RAY_OF_LIGHTS : BREATHING_VIDEOS.DARK_CLOUDS;
    return this.setupVideoFile(videoFile, onProgress);
  }

  // Cleanup old cache files that haven't been accessed in a while
  async cleanupCache(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    try {
      const files = await RNFS.readDir(RNFS.CachesDirectoryPath);
      const now = new Date().getTime();

      for (const file of files) {
        if (file.name.endsWith('.m4v')) {
          const stats = await RNFS.stat(file.path);
          const age = now - new Date(stats.mtime).getTime();
          if (age > maxAge) {
            await RNFS.unlink(file.path);
            // Also clear from memory cache
            this.memoryCache.delete(file.name);
          }
        }
      }
      
      // If cache was cleared, reset preload status
      if (this.memoryCache.size === 0) {
        this.preloadComplete = false;
      }
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }
}

export const videoService = new VideoService(); 