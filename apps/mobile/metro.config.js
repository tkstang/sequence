const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const config = getDefaultConfig(__dirname);
const defaultResolveRequest = config.resolver.resolveRequest;
const productionRouterContext = path.join(
  __dirname,
  'src/router/ctx-production.js',
);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};
config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
  resolveRequest(context, moduleName, platform) {
    if (
      process.env.NODE_ENV === 'production' &&
      moduleName === 'expo-router/_ctx'
    ) {
      return {
        type: 'sourceFile',
        filePath: productionRouterContext,
      };
    }

    if (defaultResolveRequest) {
      return defaultResolveRequest(context, moduleName, platform);
    }

    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
