import type { ExpoConfig, ConfigContext } from "expo/config";

// GitHub Pages serves the site from /<repo>/, so the web build needs that base path.
// Locally and in Electron it's served from the root (EXPO_BASE_URL unset).
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  experiments: { ...(config.experiments ?? {}), baseUrl: process.env.EXPO_BASE_URL ?? "" },
});
