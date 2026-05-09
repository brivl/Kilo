import { render, screen, fireEvent } from '@testing-library/react-native';

import SignInScreen from '@/app/(auth)/sign-in';
import { useAuthStore } from '@/store/authStore';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

jest.mock('expo-apple-authentication', () => ({
  AppleAuthenticationButtonType: { SIGN_IN: 0 },
  AppleAuthenticationButtonStyle: { BLACK: 0 },
  AppleAuthenticationButton: () => null,
}));

jest.mock('@/store/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('SignInScreen', () => {
  let mockSignIn: jest.Mock;
  let mockSendPasswordReset: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignIn = jest.fn().mockResolvedValue(undefined);
    mockSendPasswordReset = jest.fn().mockResolvedValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: (s: any) => any) =>
      selector({
        signIn: mockSignIn,
        signInWithApple: jest.fn(),
        signInWithGoogle: jest.fn(),
        sendPasswordReset: mockSendPasswordReset,
      }),
    );
  });

  it('renders email and password inputs', () => {
    render(<SignInScreen />);
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
  });

  it('calls signIn with email and password', () => {
    render(<SignInScreen />);
    fireEvent.changeText(screen.getByLabelText('Email'), 'test@example.com');
    fireEvent.changeText(screen.getByLabelText('Password'), 'password123');
    fireEvent.press(screen.getByLabelText('Sign in'));
    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('calls sendPasswordReset with email when forgot password pressed', () => {
    render(<SignInScreen />);
    fireEvent.changeText(screen.getByLabelText('Email'), 'test@example.com');
    fireEvent.press(screen.getByLabelText('Forgot password'));
    expect(mockSendPasswordReset).toHaveBeenCalledWith('test@example.com');
  });

  it('navigates to sign-up when link pressed', () => {
    render(<SignInScreen />);
    fireEvent.press(screen.getByLabelText('Create account'));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/sign-up');
  });
});
