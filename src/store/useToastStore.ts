import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  confirm: (message: string, title?: string) => Promise<boolean>;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    if (toast.type !== 'confirm' && toast.duration !== 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, toast.duration || 3000);
    }
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  confirm: (message, title = '确认') => {
    return new Promise((resolve) => {
      get().addToast({
        type: 'confirm',
        title,
        message,
        duration: 0, // confirm toasts don't auto-dismiss
        onConfirm: () => {
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        },
      });
    });
  },
}));
