import { render, screen } from '@testing-library/react-native';

import ProtectedLayout from '@/app/(protected)/_layout';
import { useAuthStore } from '@/store/authStore';

let mockRedirect: jest.Mock;

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  mockRedirect = jest.fn();
  return {
    Redirect: (props: { href: string }) => {
      mockRedirect(props);
      return null;
    },
    Stack: Object.assign(
      ({ children }: { children: React.ReactNode }) => (
        <Text testID="protected-stack">{children}</Text>
      ),
      {
        Screen: () => null,
      },
    ),
  };
});

jest.mock('@/store/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('ProtectedLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_SKIP_AUTH;
  });

  it('renders nothing while loading', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: (s: any) => any) =>
      selector({ session: null, isLoading: true }),
    );
    render(<ProtectedLayout />);
    expect(screen.toJSON()).toBeNull();
  });

  it('redirects to welcome when no session', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: (s: any) => any) =>
      selector({ session: null, isLoading: false }),
    );
    render(<ProtectedLayout />);
    expect(mockRedirect).toHaveBeenCalledWith({ href: '/(auth)/welcome' });
  });

  it('renders Stack when session exists', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: (s: any) => any) =>
      selector({ session: { user: { id: '1' } }, isLoading: false }),
    );
    render(<ProtectedLayout />);
    expect(screen.getByTestId('protected-stack')).toBeTruthy();
  });

  it('renders Stack when skipAuth is true even without session', () => {
    process.env.EXPO_PUBLIC_SKIP_AUTH = 'true';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: (s: any) => any) =>
      selector({ session: null, isLoading: false }),
    );
    render(<ProtectedLayout />);
    expect(screen.getByTestId('protected-stack')).toBeTruthy();
  });
});
