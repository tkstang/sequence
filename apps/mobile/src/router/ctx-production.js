export const ctx = require.context(
  process.env.EXPO_ROUTER_APP_ROOT,
  true,
  /^(?:\.\/)(?!dev\/)(?!(?:(?:(?:.*\+api)|(?:\+html)|(?:\+middleware)))\.[tj]sx?$).*(?:\.android|\.web)?\.[tj]sx?$/,
  process.env.EXPO_ROUTER_IMPORT_MODE,
);
