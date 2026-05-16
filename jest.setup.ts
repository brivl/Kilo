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
  matchFont: () => null,
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

// expo-secure-store — in-memory mock
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItemAsync: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
  };
});

// expo-apple-authentication
jest.mock('expo-apple-authentication', () => ({
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
  AppleAuthenticationButtonType: { SIGN_IN: 0, SIGN_UP: 1, CONTINUE: 2 },
  AppleAuthenticationButtonStyle: { BLACK: 0, WHITE: 1, WHITE_OUTLINE: 2 },
  AppleAuthenticationButton: () => null,
  signInAsync: jest.fn(),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}));

// @react-native-google-signin/google-signin
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(),
  },
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED', IN_PROGRESS: 'IN_PROGRESS' },
}));

// expo-constants mock — mirrors app.config.ts extra shape
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        openFoodFactsBaseUrl: 'https://world.openfoodfacts.org',
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
        googleIosClientId: 'test-google-client-id',
      },
    },
  },
}));
