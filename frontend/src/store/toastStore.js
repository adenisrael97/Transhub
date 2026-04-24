import { create } from 'zustand';

let toastId = 0;

const useToastStore = create((set, get) => ({
  toasts: [],

  /**
   * Show a toast notification.
   * @param {'success'|'error'|'info'|'warning'} type
   * @param {string} message
   * @param {number} duration — ms before auto-dismiss (default 4000)
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

  /** Convenience helpers */
  success(msg, dur) { return get().addToast('success', msg, dur); },
  error(msg, dur)   { return get().addToast('error', msg, dur); },
  info(msg, dur)    { return get().addToast('info', msg, dur); },
  warning(msg, dur) { return get().addToast('warning', msg, dur); },
}));

export default useToastStore;
