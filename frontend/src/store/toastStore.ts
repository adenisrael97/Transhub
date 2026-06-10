import { create } from "zustand";
import type { Toast, ToastType } from "@/types";

let toastId = 0;

interface ToastState {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => number;
  removeToast: (id: number) => void;
  success: (msg: string, dur?: number) => number;
  error: (msg: string, dur?: number) => number;
  info: (msg: string, dur?: number) => number;
  warning: (msg: string, dur?: number) => number;
}

const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  /**
   * Show a toast notification.
   * @param duration ms before auto-dismiss (default 4000; 0 = sticky)
   */
  addToast(type, message, duration = 4000) {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    if (duration > 0) {
      setTimeout(() => get().removeToast(id), duration);
    }
    return id;
  },

  removeToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  success(msg, dur) {
    return get().addToast("success", msg, dur);
  },
  error(msg, dur) {
    return get().addToast("error", msg, dur);
  },
  info(msg, dur) {
    return get().addToast("info", msg, dur);
  },
  warning(msg, dur) {
    return get().addToast("warning", msg, dur);
  },
}));

export default useToastStore;
