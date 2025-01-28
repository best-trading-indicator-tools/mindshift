const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
    assetExts: ['lottie', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'wav', 'mp3']
  }
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
