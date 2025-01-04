import { audioService, AUDIO_FILES } from './audioService';
import { videoService } from './videoService';

export const ResourcePreloadService = {
  preloadedSunBreathResources: false,

  async preloadSunBreathResources(): Promise<void> {
    if (this.preloadedSunBreathResources) return;

    try {
      // Load and cache audio files
      const [inSound, outSound] = await Promise.all([
        audioService.loadSound(AUDIO_FILES.SUN_BREATHE_IN),
        audioService.loadSound(AUDIO_FILES.SUN_BREATHE_OUT)
      ]);

      // Release audio after loading
      inSound.release();
      outSound.release();

      // Preload and verify videos are in memory cache
      const videosPreloaded = await videoService.preloadAllBreathingVideos();
      
      if (!videosPreloaded) {
        throw new Error('Failed to preload videos into memory cache');
      }

      this.preloadedSunBreathResources = true;
      console.log('✅ All Sun Breath resources preloaded successfully');
    } catch (error: unknown) {
      this.preloadedSunBreathResources = false;
      console.error('❌ Error preloading sun breath resources:', error);
      throw error;
    }
  },

  isPreloadComplete(): boolean {
    return this.preloadedSunBreathResources && videoService.isPreloadComplete();
  }
}; 