import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import TargetsScreen from '@/app/(onboarding)/targets';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));

jest.mock('@/store/onboardingStore');
jest.mock('@/store/settingsStore');
jest.mock('@/store/toastStore');

const mockUseOnboardingStore = useOnboardingStore as jest.MockedFunction<typeof useOnboardingStore>;
const mockUseSettingsStore = useSettingsStore as jest.MockedFunction<typeof useSettingsStore>;
const mockUseToastStore = useToastStore as jest.MockedFunction<typeof useToastStore>;

describe('TargetsScreen', () => {
  const mockSetCalorieGoal = jest.fn();
  const mockSetMacroGoals = jest.fn();
  const mockReset = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseSettingsStore.mockImplementation((selector: (s: any) => any) =>
      selector({ setCalorieGoal: mockSetCalorieGoal, setMacroGoals: mockSetMacroGoals }),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseToastStore.mockImplementation((selector: (s: any) => any) =>
      selector({ showToast: jest.fn() }),
    );
  });

  it('auto-populates fields from onboarding store', async () => {
    mockUseOnboardingStore.mockReturnValue({
      goal: 'lose',
      weightKg: 80,
      heightCm: 180,
      age: 30,
      sex: 'male',
      activityLevel: 'sedentary',
      setGoal: jest.fn(),
      setStats: jest.fn(),
      setActivityLevel: jest.fn(),
      reset: mockReset,
    });
    render(<TargetsScreen />);
    // BMR=1780, TDEE=round(1780×1.2)=2136, target=2136-500=1636
    await waitFor(() => expect(screen.getByDisplayValue('1636')).toBeTruthy());
  });

  it('saves targets to settingsStore, sets flag, resets store, navigates on submit', async () => {
    mockUseOnboardingStore.mockReturnValue({
      goal: 'maintain',
      weightKg: 70,
      heightCm: 170,
      age: 25,
      sex: 'female',
      activityLevel: 'moderate',
      setGoal: jest.fn(),
      setStats: jest.fn(),
      setActivityLevel: jest.fn(),
      reset: mockReset,
    });
    render(<TargetsScreen />);
    await waitFor(() => screen.getByLabelText('Save targets'));
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Save targets'));
    });
    expect(mockSetCalorieGoal).toHaveBeenCalled();
    expect(mockSetMacroGoals).toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalled();
    expect(await AsyncStorage.getItem('onboardingComplete')).toBe('true');
    expect(mockReplace).toHaveBeenCalledWith('/(protected)/(tabs)');
  });

  it('skipping sets flag and navigates without saving goals', async () => {
    mockUseOnboardingStore.mockReturnValue({
      goal: null,
      weightKg: null,
      heightCm: null,
      age: null,
      sex: null,
      activityLevel: null,
      setGoal: jest.fn(),
      setStats: jest.fn(),
      setActivityLevel: jest.fn(),
      reset: mockReset,
    });
    render(<TargetsScreen />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Use defaults instead'));
    });
    expect(mockSetCalorieGoal).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem('onboardingComplete')).toBe('true');
    expect(mockReplace).toHaveBeenCalledWith('/(protected)/(tabs)');
  });
});
