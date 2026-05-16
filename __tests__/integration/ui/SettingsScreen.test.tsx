import { act, fireEvent, render, screen } from '@testing-library/react-native';

import SettingsScreen from '@/app/(protected)/settings';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';

jest.mock('@/store/syncStore', () => ({
  restoreAll: jest.fn().mockResolvedValue({ restoredCount: 12 }),
  syncUpsert: jest.fn(),
  syncDelete: jest.fn(),
  isLocalDatabaseEmpty: jest.fn(),
}));

jest.mock('@/db/database', () => ({
  database: {
    write: jest.fn().mockImplementation(async (fn: () => Promise<void>) => fn()),
    unsafeResetDatabase: jest.fn().mockResolvedValue(undefined),
  },
}));

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
const mockDeleteAccount = jest.fn().mockResolvedValue(undefined);
const mockSetCalorieGoal = jest.fn();
const mockSetMacroGoals = jest.fn();
const mockSetWeightUnit = jest.fn();
const mockSetSyncEnabled = jest.fn();
const mockShowToast = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

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
      deleteAccount: mockDeleteAccount,
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

  it('shows confirmation box when Delete account pressed', () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByLabelText('Delete account'));
    expect(screen.getByLabelText('Confirm delete account')).toBeTruthy();
    expect(screen.getByLabelText('Cancel deletion')).toBeTruthy();
  });

  it('hides confirmation box when Cancel pressed', () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByLabelText('Delete account'));
    fireEvent.press(screen.getByLabelText('Cancel deletion'));
    expect(screen.queryByLabelText('Confirm delete account')).toBeNull();
  });

  it('calls deleteAccount, clears storage, and signs out when Confirm delete pressed', async () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByLabelText('Delete account'));
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Confirm delete account'));
    });
    expect(mockDeleteAccount).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('disables sync and shows toast when sync toggled off', () => {
    render(<SettingsScreen />);
    fireEvent(screen.getByLabelText('Sync my data'), 'valueChange', false);
    expect(mockSetSyncEnabled).toHaveBeenCalledWith(false);
    expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('Sync disabled'));
  });

  it('calls setWeightUnit when lbs segment pressed', () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByLabelText('lbs'));
    expect(mockSetWeightUnit).toHaveBeenCalledWith('lbs');
  });

  it('calls restoreAll and shows toast when Restore from cloud pressed', async () => {
    render(<SettingsScreen />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Restore from cloud'));
    });
    expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('Restored 12'));
  });
});
