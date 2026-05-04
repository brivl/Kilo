import { fireEvent, render } from '@testing-library/react-native';

import { DateHeader } from '@/components/DateHeader';
import { useSettingsStore } from '@/store/settingsStore';
import { todayISO } from '@/utils/date';

jest.mock('@react-native-community/datetimepicker', () => {
  const { Pressable, Text } = require('react-native');
  return ({ onChange }: { onChange: (e: unknown, d: Date) => void }) => (
    <Pressable testID="datepicker" onPress={() => onChange({}, new Date('2026-01-15T12:00:00Z'))}>
      <Text>DatePicker</Text>
    </Pressable>
  );
});

beforeEach(() => useSettingsStore.setState({ selectedDate: '2026-05-03' }));

it('shows previous day on left arrow tap', () => {
  const { getByLabelText } = render(<DateHeader />);
  fireEvent.press(getByLabelText('Previous day'));
  expect(useSettingsStore.getState().selectedDate).toBe('2026-05-02');
});

it('shows next day on right arrow tap', () => {
  const { getByLabelText } = render(<DateHeader />);
  fireEvent.press(getByLabelText('Next day'));
  expect(useSettingsStore.getState().selectedDate).toBe('2026-05-04');
});

it('Today button resets to today', () => {
  useSettingsStore.setState({ selectedDate: '2020-01-01' });
  const { getByLabelText } = render(<DateHeader />);
  fireEvent.press(getByLabelText('Go to today'));
  expect(useSettingsStore.getState().selectedDate).toBe(todayISO());
});
