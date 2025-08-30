// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Expo Router transforms (required if using expo-router / typedRoutes)
      'expo-router/babel',

      // OPTIONAL: Only if you use "@/..." imports
      ['module-resolver', {
        root: ['./'],
        alias: { '@': './' },
        extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
      }],

      // Reanimated must remain LAST
      'react-native-reanimated/plugin',
    ],
  };
};
