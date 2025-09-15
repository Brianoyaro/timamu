import { create } from 'zustand'

/**
 * Toast notification store for user feedback
 * Provides success, error, warning, and info notifications
 */
export const useToastStore = create((set, get) => ({
  toasts: [],

  /**
   * Add a new toast notification
   * @param {Object} toast - Toast configuration
   * @param {string} toast.type - Toast type (success, error, warning, info)
   * @param {string} toast.message - Toast message
   * @param {number} toast.duration - Auto-dismiss duration in ms (default: 5000)
   */
  addToast: (toast) => {
    const id = Date.now().toString()
    const newToast = {
      id,
      type: toast.type || 'info',
      message: toast.message,
      duration: toast.duration || 5000,
      timestamp: Date.now()
    }

    set((state) => ({
      toasts: [...state.toasts, newToast]
    }))

    // Auto-dismiss toast
    if (newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, newToast.duration)
    }

    return id
  },

  /**
   * Remove a toast by ID
   * @param {string} id - Toast ID
   */
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter(toast => toast.id !== id)
    }))
  },

  /**
   * Clear all toasts
   */
  clearToasts: () => {
    set({ toasts: [] })
  }
}))
