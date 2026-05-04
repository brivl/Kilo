import { act, renderHook } from '@testing-library/react-native';

import { useToastStore } from '@/store/toastStore';

describe('toastStore', () => {
  beforeEach(() => useToastStore.setState({ message: null, kind: 'info' }));

  it('showToast sets message and kind', () => {
    const { result } = renderHook(() => useToastStore());
    act(() => result.current.showToast('Hello'));
    expect(result.current.message).toBe('Hello');
    expect(result.current.kind).toBe('info');
  });

  it('showToast sets error kind', () => {
    const { result } = renderHook(() => useToastStore());
    act(() => result.current.showToast('Oops', 'error'));
    expect(result.current.kind).toBe('error');
  });

  it('dismissToast clears message', () => {
    const { result } = renderHook(() => useToastStore());
    act(() => {
      result.current.showToast('Hello');
      result.current.dismissToast();
    });
    expect(result.current.message).toBeNull();
  });
});
