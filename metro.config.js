const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    assetExts: ['lottie', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'wav', 'mp3']
  },
  transformer: {
    assetPlugins: ['react-native-asset']
  }
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
