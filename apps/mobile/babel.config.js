const { expoRouterBabelPlugin } = require('babel-preset-expo/build/expo-router-plugin');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Ensure EXPO_ROUTER_APP_ROOT is inlined in monorepo setups without hoisted expo-router.
    plugins: [expoRouterBabelPlugin],
  };
};