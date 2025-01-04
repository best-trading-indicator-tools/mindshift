import { audioService, AUDIO_FILES } from './audioService';
import { videoService } from './videoService';

export const ResourcePreloadService = {
  preloadedSunBreathResources: false,

  async preloadSunBreathResources(): Promise<void> {
    if (this.preloadedSunBreathResources) {
      console.log('🎵 Sun Breath resources already preloaded, skipping...');
      return;
    }

    try {
      console.log('🎵 Starting to preload Sun Breath audio files...');
      
      // Load and cache audio files
      await Promise.all([
        audioService.loadSound(AUDIO_FILES.SUN_BREATHE_IN),
        audioService.loadSound(AUDIO_FILES.SUN_BREATHE_OUT)
      ]);

      console.log('✅ Successfully loaded breathe in audio');
      console.log('✅ Successfully loaded breathe out audio');

      // Preload and verify videos are in memory cache
      console.log('🎥 Starting to preload Sun Breath videos...');
      const videosPreloaded = await videoService.preloadAllBreathingVideos();
      
      if (!videosPreloaded) {
        throw new Error('Failed to preload videos into memory cache');
      }
      console.log('✅ Successfully preloaded Sun Breath videos');

      this.preloadedSunBreathResources = true;
      console.log('🎉 All Sun Breath resources preloaded successfully');
    } catch (error: unknown) {
      this.preloadedSunBreathResources = false;
      console.error('❌ Error preloading Sun Breath resources:', error);
      throw error;
    }
  },

  isPreloadComplete(): boolean {
    return this.preloadedSunBreathResources && videoService.isPreloadComplete();
  }
}; 