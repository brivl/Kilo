/* eslint-disable @typescript-eslint/no-require-imports */
// jest.setup.ts

// react-native-reanimated v4 mock — prevents "Cannot use import statement" during test
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// async-storage mock — uses the official mock provided by the package
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// expo-constants mock — mirrors app.config.ts extra shape
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        openFoodFactsBaseUrl: 'https://world.openfoodfacts.org',
      },
    },
  },
}));
