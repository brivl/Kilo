/* eslint-disable @typescript-eslint/no-require-imports */
// jest.setup.ts

// suppress RNTL peer-dep check — react-test-renderer may resolve to a minor ahead of react
process.env.RNTL_SKIP_DEPS_CHECK = 'true';

// react-native-reanimated v4 mock — prevents "Cannot use import statement" during test
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Skia uses native modules unavailable in Jest
jest.mock('@shopify/react-native-skia', () => ({
  Skia: {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Canvas: ({ children }: { children: any }) => children,
  Path: () => null,
  useFont: () => null,
  useDerivedValue: (fn: () => unknown) => ({ value: fn() }),
  useSharedValue: (v: unknown) => ({ value: v }),
}));

// victory-native chart components — render nothing in tests (Skia not available)
jest.mock('victory-native', () => {
  return {
    CartesianChart: () => null,
    Line: () => null,
    useChartPressState: () => ({ state: {}, isActive: false }),
    Bar: () => null,
    Area: () => null,
    Scatter: () => null,
  };
});

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
