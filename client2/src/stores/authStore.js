import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Authentication store using Zustand
 * Manages user authentication state, login, logout, and user data
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      /**
       * Set user data and authentication state
       * @param {Object} userData - User data object
       * @param {string} authToken - JWT token
       */
      setUser: (userData, authToken) => {
        set({
          user: userData,
          token: authToken,
          isAuthenticated: true,
        })
      },

      /**
       * Update user data without changing auth state
       * @param {Object} userData - Updated user data
       */
      updateUser: (userData) => {
        const currentUser = get().user
        set({
          user: { ...currentUser, ...userData },
        })
      },

      /**
       * Clear authentication state (logout)
       */
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },

      /**
       * Set loading state
       * @param {boolean} loading - Loading state
       */
      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      /**
       * Check if user has specific role
       * @param {string} role - Role to check
       * @returns {boolean} Whether user has the role
       */
      hasRole: (role) => {
        const user = get().user
        return user?.roles?.includes(role) || false
      },

      /**
       * Get authorization headers for API calls
       * @returns {Object} Headers object
       */
      getAuthHeaders: () => {
        const token = get().token
        return token ? { Authorization: `Bearer ${token}` } : {}
      },
    }),
    {
      name: 'auth-storage', // Persist to localStorage
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
