function removeProductionConsolePlugin({ types: t }) {
  return {
    name: 'sequence-remove-production-console',
    visitor: {
      CallExpression(path) {
        const callee = path.get('callee');
        if (!callee.isMemberExpression()) return;

        const object = callee.get('object');
        if (!object.isIdentifier({ name: 'console' })) return;

        if (path.parentPath.isExpressionStatement()) {
          path.parentPath.remove();
          return;
        }

        path.replaceWith(t.unaryExpression('void', t.numericLiteral(0)));
      },
    },
  };
}

module.exports = function babelConfig(api) {
  api.cache(true);

  const plugins = [];

  if (process.env.NODE_ENV === 'production') {
    plugins.push(removeProductionConsolePlugin);
  }

  plugins.push('react-native-reanimated/plugin');

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
