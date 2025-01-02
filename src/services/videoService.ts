const BREATHING_VIDEOS = {
  rayOfLights: 'https://firebasestorage.googleapis.com/v0/b/mindshift-bd937.firebasestorage.app/o/videos%2Frayoflights.m4v?alt=media&token=117faefd-c2f3-43bb-a343-444a5e119a26',
  darkClouds: 'https://firebasestorage.googleapis.com/v0/b/mindshift-bd937.firebasestorage.app/o/videos%2Fdarkclouds.m4v?alt=media&token=7bdebc3e-16b8-40eb-ba64-cbccbaecd5a3'
};

export const getBreathingVideo = (type: 'inhale' | 'exhale'): string => {
  return type === 'inhale' ? BREATHING_VIDEOS.rayOfLights : BREATHING_VIDEOS.darkClouds;
}; 