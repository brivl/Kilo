import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import SettingsScreen from '@/app/(protected)/settings';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/store/authStore');
jest.mock('@/store/settingsStore');
jest.mock('@/store/toastStore');

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseSettingsStore = useSettingsStore as jest.MockedFunction<typeof useSettingsStore>;
const mockUseToastStore = useToastStore as jest.MockedFunction<typeof useToastStore>;

const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockSetCalorieGoal = jest.fn();
const mockSetMacroGoals = jest.fn();
const mockSetWeightUnit = jest.fn();
const mockSetSyncEnabled = jest.fn();
const mockShowToast = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseAuthStore.mockImplementation((selector: (s: any) => any) =>
    selector({
      session: {
        user: {
          email: 'test@example.com',
          user_metadata: { full_name: 'Jane Doe' },
        },
      },
      signOut: mockSignOut,
    }),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseSettingsStore.mockImplementation((selector: (s: any) => any) =>
    selector({
      calorieGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 250,
      fatGoal: 65,
      weightUnit: 'kg',
      syncEnabled: true,
      setCalorieGoal: mockSetCalorieGoal,
      setMacroGoals: mockSetMacroGoals,
      setWeightUnit: mockSetWeightUnit,
      setSyncEnabled: mockSetSyncEnabled,
    }),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseToastStore.mockImplementation((selector: (s: any) => any) =>
    selector({ showToast: mockShowToast }),
  );
});

describe('SettingsScreen', () => {
  it('renders profile name and email', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Jane Doe')).toBeTruthy();
    expect(screen.getByText('test@example.com')).toBeTruthy();
  });

  it('saves goals when Save goals pressed with valid values', () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByLabelText('Save goals'));
    expect(mockSetCalorieGoal).toHaveBeenCalledWith(2000);
    expect(mockSetMacroGoals).toHaveBeenCalledWith({ proteinG: 150, carbsG: 250, fatG: 65 });
    expect(mockShowToast).toHaveBeenCalledWith('Goals saved');
  });

  it('calls signOut when Sign out pressed', () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByLabelText('Sign out'));
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('shows delete confirmation alert when Delete account pressed', () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByLabelText('Delete account'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete account?',
      expect.stringContaining('permanently deletes'),
      expect.any(Array),
    );
  });

  it('shows sync confirmation when sync toggled off', () => {
    render(<SettingsScreen />);
    fireEvent(screen.getByLabelText('Sync my data'), 'valueChange', false);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Disable sync?',
      expect.stringContaining('disables backup'),
      expect.any(Array),
    );
  });
});
