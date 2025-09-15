import { create } from 'zustand'
import { authService } from '../services/authService'

/**
 * Authentication store using Zustand for state management
 * Handles user authentication, token management, and role-based access
 * 
 * Security Features:
 * - Access tokens stored in memory (not persisted)
 * - Refresh tokens stored in localStorage only when "remember me" is checked
 * - Automatic token refresh before expiration
 * - Secure logout that clears all tokens
 */
export const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null, // Access token (short-lived, in memory only)
  refreshToken: null, // Refresh token (long-lived, optionally persisted)
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  /**
   * Initialize the auth store on app startup
   * Attempts to refresh access token if refresh token exists
   */
  initialize: async () => {
    console.log('🚀 AuthStore: Initializing...')
    try {
      const refreshToken = localStorage.getItem('timamu_refresh_token')
      
      if (refreshToken) {
        console.log('🔄 AuthStore: Found refresh token, attempting to refresh access token')
        const response = await authService.refreshToken(refreshToken)
        
        // Store token globally for API service
        if (typeof window !== 'undefined') {
          window.__authToken = response.accessToken
        }
        
        set({ 
          user: response.user, 
          token: response.accessToken,
          refreshToken: response.refreshToken,
          isAuthenticated: true, 
          isInitialized: true 
        })
        
        // Update localStorage with new refresh token
        localStorage.setItem('timamu_refresh_token', response.refreshToken)
        console.log('✅ AuthStore: Authentication restored successfully')
      } else {
        console.log('📝 AuthStore: No refresh token found')
        set({ isInitialized: true })
      }
    } catch (error) {
      console.error('❌ AuthStore: Initialization failed:', error.message)
      localStorage.removeItem('timamu_refresh_token')
      set({ isInitialized: true })
    }
  },

  /**
   * Sign in user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {boolean} rememberMe - Whether to persist refresh token
   */
  signIn: async (email, password, rememberMe = false) => {
    console.log('🔐 AuthStore: Signing in user:', email)
    set({ isLoading: true })
    
    try {
      const { user, accessToken, refreshToken } = await authService.signIn(email, password)
      
      // Store token globally for API service
      if (typeof window !== 'undefined') {
        window.__authToken = accessToken
      }
      
      // Only persist refresh token if user chose "remember me"
      if (rememberMe) {
        localStorage.setItem('timamu_refresh_token', refreshToken)
        console.log('💾 AuthStore: Refresh token saved to localStorage')
      }
      
      set({ 
        user, 
        token: accessToken,
        refreshToken,
        isAuthenticated: true, 
        isLoading: false 
      })
      
      console.log('✅ AuthStore: Sign in successful')
      return { success: true }
    } catch (error) {
      console.error('❌ AuthStore: Sign in failed:', error.message)
      set({ isLoading: false })
      throw error
    }
  },

  /**
   * Sign up new user
   * @param {Object} userData - User registration data
   */
  signUp: async (userData) => {
    console.log('📝 AuthStore: Signing up user:', userData.email)
    set({ isLoading: true })
    
    try {
      const { user, accessToken, refreshToken } = await authService.signUp(userData)
      
      // Store token globally for API service
      if (typeof window !== 'undefined') {
        window.__authToken = accessToken
      }
      
      // Don't persist refresh token on signup - user didn't choose "remember me"
      set({ 
        user, 
        token: accessToken,
        refreshToken,
        isAuthenticated: true, 
        isLoading: false 
      })
      
      console.log('✅ AuthStore: Sign up successful')
      return { success: true }
    } catch (error) {
      console.error('❌ AuthStore: Sign up failed:', error.message)
      set({ isLoading: false })
      throw error
    }
  },

  /**
   * Sign out user and clear all tokens
   */
  signOut: async () => {
    console.log('🚪 AuthStore: Signing out user')
    
    try {
      await authService.signOut()
    } catch (error) {
      console.error('❌ AuthStore: Sign out API error:', error)
    } finally {
      // Always clear local state and storage
      localStorage.removeItem('timamu_refresh_token')
      if (typeof window !== 'undefined') {
        delete window.__authToken
      }
      set({ 
        user: null, 
        token: null, 
        refreshToken: null,
        isAuthenticated: false 
      })
      console.log('✅ AuthStore: Sign out complete')
    }
  },

  /**
   * Request password reset
   * @param {string} email - User email
   */
  forgotPassword: async (email) => {
    set({ isLoading: true })
    
    try {
      await authService.forgotPassword(email)
      set({ isLoading: false })
      return { success: true }
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   */
  resetPassword: async (token, newPassword) => {
    set({ isLoading: true })
    
    try {
      await authService.resetPassword(token, newPassword)
      set({ isLoading: false })
      return { success: true }
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  /**
   * Set OAuth user data (for Google OAuth)
   * @param {Object} user - User data
   * @param {string} accessToken - Access token
   * @param {string} refreshToken - Refresh token
   */
  setOAuthUser: (user, accessToken, refreshToken) => {
    console.log('🔐 AuthStore: Setting OAuth user:', user?.email)
    
    // Always persist refresh token for OAuth users
    localStorage.setItem('timamu_refresh_token', refreshToken)
    
    set({ 
      user, 
      token: accessToken,
      refreshToken,
      isAuthenticated: true,
      isInitialized: true
    })
  },

  /**
   * Check if user has specific role
   * @param {string} role - Role to check
   */
  hasRole: (role) => {
    const { user } = get()
    return user?.roles?.includes(role) || false
  },

  /**
   * Check if user has any of the specified roles
   * @param {string[]} roles - Roles to check
   */
  hasAnyRole: (roles) => {
    const { user } = get()
    return roles.some(role => user?.roles?.includes(role)) || false
  },

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken: async () => {
    const { refreshToken } = get()
    
    if (!refreshToken) {
      console.log('❌ AuthStore: No refresh token available')
      return false
    }

    try {
      console.log('🔄 AuthStore: Refreshing access token')
      const { user, accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(refreshToken)
      
      set({ 
        user, 
        token: accessToken,
        refreshToken: newRefreshToken
      })
      
      // Update persisted refresh token if it was previously persisted
      if (localStorage.getItem('timamu_refresh_token')) {
        localStorage.setItem('timamu_refresh_token', newRefreshToken)
      }
      
      console.log('✅ AuthStore: Access token refreshed')
      return true
    } catch (error) {
      console.error('❌ AuthStore: Token refresh failed:', error.message)
      
      // Clear invalid tokens
      localStorage.removeItem('timamu_refresh_token')
      set({ 
        user: null, 
        token: null, 
        refreshToken: null,
        isAuthenticated: false 
      })
      
      return false
    }
  }
}))

// Auto-refresh token setup
let refreshInterval = null

// Subscribe to authentication state changes
useAuthStore.subscribe((state) => {
  if (state.isAuthenticated && state.refreshToken && !refreshInterval) {
    // Set up auto-refresh every 10 minutes (access token expires in 15 minutes)
    console.log('🔄 Setting up automatic token refresh every 10 minutes')
    refreshInterval = setInterval(() => {
      useAuthStore.getState().refreshAccessToken()
    }, 10 * 60 * 1000)
  } else if (!state.isAuthenticated && refreshInterval) {
    console.log('🛑 Clearing automatic token refresh')
    clearInterval(refreshInterval)
    refreshInterval = null
  }
})
