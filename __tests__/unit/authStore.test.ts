import { act } from '@testing-library/react-native';

import { useAuthStore } from '@/store/authStore';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      signInWithIdToken: jest.fn(),
    },
  },
}));

jest.mock('@/store/toastStore', () => ({
  useToastStore: { getState: () => ({ showToast: jest.fn() }) },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { supabase } = require('@/lib/supabase') as { supabase: { auth: Record<string, jest.Mock> } };

beforeEach(() => {
  jest.clearAllMocks();
  supabase.auth['getSession'].mockResolvedValue({ data: { session: null } });
  supabase.auth['onAuthStateChange'].mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
  useAuthStore.setState({ session: null, isLoading: true });
});

it('initialize sets session from getSession and subscribes to auth changes', async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fakeSession = { user: { id: 'abc' } } as any;
  supabase.auth['getSession'].mockResolvedValue({ data: { session: fakeSession } });

  await act(async () => {
    useAuthStore.getState().initialize();
  });

  expect(useAuthStore.getState().session).toEqual(fakeSession);
  expect(useAuthStore.getState().isLoading).toBe(false);
  expect(supabase.auth['onAuthStateChange']).toHaveBeenCalled();
});

it('signIn calls signInWithPassword with email and password', async () => {
  supabase.auth['signInWithPassword'].mockResolvedValue({ error: null });

  await act(async () => {
    await useAuthStore.getState().signIn('test@example.com', 'password123');
  });

  expect(supabase.auth['signInWithPassword']).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123',
  });
});

it('signIn throws when Supabase returns an error', async () => {
  supabase.auth['signInWithPassword'].mockResolvedValue({
    error: { message: 'Invalid login credentials' },
  });

  await expect(
    act(async () => useAuthStore.getState().signIn('a@b.com', 'wrong')),
  ).rejects.toMatchObject({ message: 'Invalid login credentials' });
});

it('signUp calls supabase.auth.signUp', async () => {
  supabase.auth['signUp'].mockResolvedValue({ error: null });

  await act(async () => {
    await useAuthStore.getState().signUp('new@example.com', 'pass');
  });

  expect(supabase.auth['signUp']).toHaveBeenCalledWith({
    email: 'new@example.com',
    password: 'pass',
  });
});

it('signOut calls supabase.auth.signOut', async () => {
  supabase.auth['signOut'].mockResolvedValue({ error: null });

  await act(async () => {
    await useAuthStore.getState().signOut();
  });

  expect(supabase.auth['signOut']).toHaveBeenCalled();
});

it('sendPasswordReset calls resetPasswordForEmail', async () => {
  supabase.auth['resetPasswordForEmail'].mockResolvedValue({ error: null });

  await act(async () => {
    await useAuthStore.getState().sendPasswordReset('user@example.com');
  });

  expect(supabase.auth['resetPasswordForEmail']).toHaveBeenCalledWith('user@example.com');
});
