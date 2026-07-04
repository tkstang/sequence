module.exports = function babelConfig(api) {
  api.cache(true);

  return {
    presets: [
      'babel-preset-expo',
      ['react-strict-dom/babel-preset', { platform: 'native' }],
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
