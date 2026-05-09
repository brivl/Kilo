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
  plugins: [
    'expo-router',
    ['expo-build-properties', { ios: { deploymentTarget: '16.0' } }],
    'expo-apple-authentication',
    '@react-native-google-signin/google-signin',
  ],
  extra: {
    openFoodFactsBaseUrl: 'https://world.openfoodfacts.org',
    // These are public by design: anon key is a JWT with 'anon' role, protected by RLS.
    // Google iOS client ID is a public OAuth identifier. Neither is a secret.
    supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
    supabaseAnonKey: 'YOUR_ANON_KEY',
    googleIosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  },
});
