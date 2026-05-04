import { create } from 'zustand';

interface ToastState {
  message: string | null;
  kind: 'info' | 'error';
  showToast: (message: string, kind?: 'info' | 'error') => void;
  dismissToast: () => void;
}

export const useToastStore = create<ToastState>(set => ({
  message: null,
  kind: 'info',
  showToast: (message, kind = 'info') => {
    set({ message, kind });
    setTimeout(() => set({ message: null }), 3500);
  },
  dismissToast: () => set({ message: null }),
}));
