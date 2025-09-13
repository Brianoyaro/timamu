import { create } from 'zustand'

/**
 * Toast notification store
 * Manages toast notifications for user feedback
 */
export const useToastStore = create((set, get) => ({
  // State
  toasts: [],

  // Actions
  /**
   * Add a new toast notification
   * @param {Object} toast - Toast configuration
   * @param {string} toast.title - Toast title
   * @param {string} toast.description - Toast description
   * @param {string} toast.variant - Toast variant (default, destructive)
   * @param {number} toast.duration - Auto-dismiss duration in ms
   */
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = {
      id,
      variant: 'default',
      duration: 5000,
      ...toast,
    }

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }))

    // Auto-remove toast after duration
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
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }))
  },

  /**
   * Clear all toasts
   */
  clearToasts: () => {
    set({ toasts: [] })
  },

  // Convenience methods
  /**
   * Show success toast
   * @param {string} title - Toast title
   * @param {string} description - Toast description
   */
  success: (title, description) => {
    return get().addToast({
      title,
      description,
      variant: 'default',
    })
  },

  /**
   * Show error toast
   * @param {string} title - Toast title
   * @param {string} description - Toast description
   */
  error: (title, description) => {
    return get().addToast({
      title,
      description,
      variant: 'destructive',
    })
  },

  /**
   * Show info toast
   * @param {string} title - Toast title
   * @param {string} description - Toast description
   */
  info: (title, description) => {
    return get().addToast({
      title,
      description,
      variant: 'default',
      duration: 3000,
    })
  },
}))
