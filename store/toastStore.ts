import { create } from 'zustand';

interface ToastState {
  message: string | null;
  kind: 'info' | 'error';
  timerId: ReturnType<typeof setTimeout> | null;
  showToast: (message: string, kind?: 'info' | 'error') => void;
  dismissToast: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  message: null,
  kind: 'info',
  timerId: null,
  showToast: (message, kind = 'info') => {
    clearTimeout(get().timerId ?? undefined);
    const timerId = setTimeout(() => set({ message: null }), 3500);
    set({ message, kind, timerId });
  },
  dismissToast: () => set({ message: null }),
}));
