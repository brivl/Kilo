import { useSettingsStore } from '@/store/settingsStore';

const today = new Date().toISOString().slice(0, 10);

beforeEach(() => {
  useSettingsStore.setState({
    weightUnit: 'kg',
    selectedDate: today,
    calorieGoal: 2000,
    proteinGoal: 150,
    carbsGoal: 250,
    fatGoal: 65,
  });
});

describe('settingsStore', () => {
  it('has correct defaults', () => {
    const s = useSettingsStore.getState();
    expect(s.weightUnit).toBe('kg');
    expect(s.calorieGoal).toBe(2000);
    expect(s.proteinGoal).toBe(150);
    expect(s.carbsGoal).toBe(250);
    expect(s.fatGoal).toBe(65);
    expect(s.selectedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('setWeightUnit updates unit', () => {
    useSettingsStore.getState().setWeightUnit('lbs');
    expect(useSettingsStore.getState().weightUnit).toBe('lbs');
  });

  it('setSelectedDate updates date', () => {
    useSettingsStore.getState().setSelectedDate('2026-01-01');
    expect(useSettingsStore.getState().selectedDate).toBe('2026-01-01');
  });

  it('resetToToday resets date to today', () => {
    useSettingsStore.getState().setSelectedDate('2020-01-01');
    useSettingsStore.getState().resetToToday();
    expect(useSettingsStore.getState().selectedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
