import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { Toast } from '@/components/Toast';
import { useToastStore } from '@/store/toastStore';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}));

describe('Toast', () => {
  beforeEach(() => useToastStore.setState({ message: null, kind: 'info' }));

  it('renders nothing when no message', () => {
    render(<Toast />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows message after showToast', () => {
    render(<Toast />);
    act(() => useToastStore.getState().showToast('Saved!'));
    expect(screen.getByText('Saved!')).toBeTruthy();
  });

  it('dismisses on press', () => {
    render(<Toast />);
    act(() => useToastStore.getState().showToast('Tap me'));
    fireEvent.press(screen.getByRole('alert'));
    expect(screen.queryByText('Tap me')).toBeNull();
  });
});
