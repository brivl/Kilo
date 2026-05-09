import { render, screen, fireEvent } from '@testing-library/react-native';

import SignUpScreen from '@/app/(auth)/sign-up';
import { useAuthStore } from '@/store/authStore';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

jest.mock('expo-apple-authentication', () => ({
  AppleAuthenticationButtonType: { SIGN_UP: 1 },
  AppleAuthenticationButtonStyle: { BLACK: 0 },
  AppleAuthenticationButton: () => null,
}));

jest.mock('@/store/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('SignUpScreen', () => {
  let mockSignUp: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignUp = jest.fn().mockResolvedValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: (s: any) => any) =>
      selector({ signUp: mockSignUp, signInWithApple: jest.fn(), signInWithGoogle: jest.fn() }),
    );
  });

  it('renders email and password inputs', () => {
    render(<SignUpScreen />);
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByLabelText('Confirm password')).toBeTruthy();
  });

  it('shows inline error when passwords do not match', async () => {
    render(<SignUpScreen />);
    fireEvent.changeText(screen.getByLabelText('Email'), 'test@example.com');
    fireEvent.changeText(screen.getByLabelText('Password'), 'password123');
    fireEvent.changeText(screen.getByLabelText('Confirm password'), 'different456');
    fireEvent.press(screen.getByLabelText('Create account'));
    expect(screen.getByText('Passwords do not match')).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('calls signUp with email and password', async () => {
    render(<SignUpScreen />);
    fireEvent.changeText(screen.getByLabelText('Email'), 'test@example.com');
    fireEvent.changeText(screen.getByLabelText('Password'), 'password123');
    fireEvent.changeText(screen.getByLabelText('Confirm password'), 'password123');
    fireEvent.press(screen.getByLabelText('Create account'));
    expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('navigates to sign-in when link pressed', () => {
    render(<SignUpScreen />);
    fireEvent.press(screen.getByLabelText('Sign in'));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/sign-in');
  });
});
