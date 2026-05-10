import { render, screen } from '@testing-library/react-native';
import React from 'react';

import JournalScreen from '@/app/(protected)/(tabs)/journal';
import PlansScreen from '@/app/(protected)/(tabs)/plans';
import ProgressScreen from '@/app/(protected)/(tabs)/progress';

import { makeTestDatabase } from '../../test-utils/makeTestDatabase';

let mockDb: ReturnType<typeof makeTestDatabase>;

jest.mock('@/db/database', () => ({
  get database() {
    return mockDb;
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}));

jest.mock('@react-native-community/datetimepicker', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  function MockPicker() {
    return <View />;
  }
  return MockPicker;
});

beforeEach(() => {
  mockDb = makeTestDatabase();
});

describe('Tab screens', () => {
  it('renders JournalScreen with empty state', () => {
    render(<JournalScreen />);
    expect(screen.getByText('No workouts — tap + to start one')).toBeTruthy();
  });

  it('renders PlansScreen', () => {
    render(<PlansScreen />);
    expect(screen.getByText('Training Plans')).toBeTruthy();
  });

  it('renders ProgressScreen', () => {
    render(<ProgressScreen />);
    expect(screen.getByText('Progress')).toBeTruthy();
  });
});
