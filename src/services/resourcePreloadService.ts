import { audioService, AUDIO_FILES } from './audioService';
import { videoService } from './videoService';

export const ResourcePreloadService = {
  preloadedSunBreathResources: false,

  async preloadSunBreathResources(): Promise<void> {
    if (this.preloadedSunBreathResources) return;

    try {
      const [inSound, outSound] = await Promise.all([
        audioService.loadSound(AUDIO_FILES.SUN_BREATHE_IN),
        audioService.loadSound(AUDIO_FILES.SUN_BREATHE_OUT)
      ]);

      // Just release the sounds after loading
      inSound.release();
      outSound.release();

      // Preload videos
      await Promise.all([
        videoService.getBreathingVideo('inhale'),
        videoService.getBreathingVideo('exhale')
      ]);

      this.preloadedSunBreathResources = true;
    } catch (error: unknown) {
      this.preloadedSunBreathResources = false;
      console.error('Error preloading sun breath resources:', error);
      throw error;
    }
  }
}; 