import { render } from '@testing-library/react-native';

import { MacroRing } from '@/components/MacroRing';
import { useSettingsStore } from '@/store/settingsStore';

beforeEach(() => {
  useSettingsStore.setState({
    calorieGoal: 2000,
    proteinGoal: 150,
    carbsGoal: 250,
    fatGoal: 65,
  });
});

it('shows correct accessibility label', () => {
  const { getByLabelText } = render(
    <MacroRing totals={{ calories: 1450, proteinG: 80, carbsG: 120, fatG: 40 }} />,
  );
  expect(getByLabelText(/Calories 1450 of 2000/)).toBeTruthy();
});

it('renders with zero totals without crashing', () => {
  const { getByLabelText } = render(
    <MacroRing totals={{ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }} />,
  );
  expect(getByLabelText(/Calories 0 of 2000/)).toBeTruthy();
});
