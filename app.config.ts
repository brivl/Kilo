// app.config.ts
// Pinned SDK: expo@54.0.33 — do not upgrade mid-project
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'GymTracker',
  slug: 'gymtracker',
  version: '1.0.0',
  scheme: 'gymtracker',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.yourname.gymtracker',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.yourname.gymtracker',
  },
  web: {
    bundler: 'metro',
    favicon: './assets/images/favicon.png',
  },
  plugins: ['expo-router', ['expo-build-properties', { ios: { deploymentTarget: '16.0' } }]],
  extra: {
    openFoodFactsBaseUrl: 'https://world.openfoodfacts.org',
  },
});
