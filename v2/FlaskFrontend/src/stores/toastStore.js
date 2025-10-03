import { create } from 'zustand';

/**
 * Store for managing toast notifications
 * - id: unique identifier for the toast
 * - message: content of the toast message
 * - type: type of toast ('success', 'error', 'warning', 'info')
 * - duration: how long the toast stays visible (in ms)
 * - dismissible: whether user can manually close the toast
 */
export const useToastStore = create((set) => ({
  // Array of toast objects
  toasts: [],
  
  // Add a new toast notification
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Set default durations based on type
    let defaultDuration = 5000;
    if (toast.type === 'error') defaultDuration = 10000; // Errors stay longer
    if (toast.type === 'warning') defaultDuration = 8000; // Warnings also stay a bit longer
    
    const newToast = {
      id,
      message: toast.message,
      type: toast.type || 'info',
      duration: toast.duration || defaultDuration,
      dismissible: toast.dismissible !== false,
    };
    
    // Auto-remove toast after duration if needed
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, newToast.duration);
    }
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));
    
    return id;
  },
  
  // Remove a specific toast by ID
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
  
  // Clear all toasts
  clearToasts: () => {
    set({ toasts: [] });
  },
}));
