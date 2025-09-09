import { create } from 'zustand'
import { authService } from '../services/authService'
import { useToastStore } from './toastStore'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null, // This will be the access token (short-lived, in memory)
  refreshToken: null, // This will be the refresh token (long-lived, can be persisted)
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    console.log('🚀 AuthStore: Starting initialization...')
    try {
      const refreshToken = localStorage.getItem('mindlink_refresh_token')
      console.log('📝 AuthStore: Refresh token from localStorage:', refreshToken ? 'Found' : 'Not found')
      
      if (refreshToken) {
        console.log('� AuthStore: Refreshing access token...')
        const response = await authService.refreshToken(refreshToken)
        console.log('✅ AuthStore: Token refresh successful:', response.user?.name || response.user?.email)
        
        set({ 
          user: response.user, 
          token: response.accessToken, // Store access token in memory
          refreshToken: response.refreshToken, // Store refresh token in state
          isAuthenticated: true, 
          isInitialized: true 
        })
        
        // Update localStorage with new refresh token
        localStorage.setItem('mindlink_refresh_token', response.refreshToken)
      } else {
        console.log('✅ AuthStore: No refresh token found, setting initialized to true')
        set({ isInitialized: true })
      }
    } catch (error) {
      console.error('❌ AuthStore: Initialization error:', error.message)
      localStorage.removeItem('mindlink_refresh_token')
      set({ isInitialized: true })
    }
    console.log('🏁 AuthStore: Initialization complete')
  },

  signIn: async (email, password, rememberMe = false) => {
    console.log('🔐 AuthStore: Starting sign in for:', email)
    set({ isLoading: true })
    try {
      const { user, accessToken, refreshToken } = await authService.signIn(email, password)
      console.log('✅ AuthStore: Sign in successful for:', user?.name || user?.email)
      
      if (rememberMe) {
        console.log('💾 AuthStore: Storing refresh token in localStorage (remember me)')
        localStorage.setItem('mindlink_refresh_token', refreshToken)
      } else {
        console.log('🚫 AuthStore: Not storing refresh token (remember me = false)')
      }
      
      set({ 
        user, 
        token: accessToken, // Store access token in memory
        refreshToken, // Store refresh token in state
        isAuthenticated: true, 
        isLoading: false 
      })
      
      useToastStore.getState().addToast({
        type: 'success',
        message: 'Welcome back!'
      })
      
      return { success: true }
    } catch (error) {
      console.error('❌ AuthStore: Sign in failed:', error.message)
      set({ isLoading: false })
      useToastStore.getState().addToast({
        type: 'error',
        message: error.message || 'Sign in failed'
      })
      return { success: false, error: error.message }
    }
  },

  signUp: async (userData) => {
    console.log('📝 AuthStore: Starting sign up for:', userData.email)
    set({ isLoading: true })
    try {
      const { user, accessToken, refreshToken } = await authService.signUp(userData)
      console.log('✅ AuthStore: Sign up successful for:', user?.name || user?.email)
      
      // Don't store refresh token in localStorage for sign up - user didn't choose "remember me"
      // They can sign in again with "remember me" if they want persistence
      
      set({ 
        user, 
        token: accessToken, // Store access token in memory
        refreshToken, // Store refresh token in state  
        isAuthenticated: true, 
        isLoading: false 
      })
      
      useToastStore.getState().addToast({
        type: 'success',
        message: 'Account created successfully!'
      })
      
      return { success: true }
    } catch (error) {
      console.error('❌ AuthStore: Sign up failed:', error.message)
      set({ isLoading: false })
      useToastStore.getState().addToast({
        type: 'error',
        message: error.message || 'Sign up failed'
      })
      return { success: false, error: error.message }
    }
  },

  signOut: async () => {
    console.log('🚪 AuthStore: Starting sign out...')
    try {
      await authService.signOut()
      console.log('✅ AuthStore: Sign out API call successful')
    } catch (error) {
      console.error('❌ AuthStore: Sign out API error:', error)
    } finally {
      console.log('🧹 AuthStore: Cleaning up local storage and state')
      localStorage.removeItem('mindlink_refresh_token') // Remove refresh token
      set({ 
        user: null, 
        token: null, 
        refreshToken: null,
        isAuthenticated: false 
      })
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true })
    try {
      await authService.forgotPassword(email)
      set({ isLoading: false })
      useToastStore.getState().addToast({
        type: 'success',
        message: 'Password reset instructions sent to your email'
      })
      return { success: true }
    } catch (error) {
      set({ isLoading: false })
      useToastStore.getState().addToast({
        type: 'error',
        message: error.message || 'Failed to send reset instructions'
      })
      return { success: false, error: error.message }
    }
  },

  resetPassword: async (token, newPassword) => {
    set({ isLoading: true })
    try {
      await authService.resetPassword(token, newPassword)
      set({ isLoading: false })
      useToastStore.getState().addToast({
        type: 'success',
        message: 'Password reset successful'
      })
      return { success: true }
    } catch (error) {
      set({ isLoading: false })
      useToastStore.getState().addToast({
        type: 'error',
        message: error.message || 'Password reset failed'
      })
      return { success: false, error: error.message }
    }
  },

  hasRole: (role) => {
    const { user } = get()
    return user?.roles?.includes(role) || false
  },

  hasAnyRole: (roles) => {
    const { user } = get()
    return roles.some(role => user?.roles?.includes(role)) || false
  },

  // Automatically refresh access token when it's about to expire
  refreshAccessToken: async () => {
    const { refreshToken } = get()
    
    if (!refreshToken) {
      console.log('❌ AuthStore: No refresh token available for refresh')
      return false
    }

    try {
      console.log('🔄 AuthStore: Refreshing access token...')
      const { user, accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(refreshToken)
      
      set({ 
        user, 
        token: accessToken,
        refreshToken: newRefreshToken
      })
      
      console.log('✅ AuthStore: Access token refreshed successfully')
      return true
    } catch (error) {
      console.error('❌ AuthStore: Token refresh failed:', error.message)
      // Clear invalid tokens and redirect to login
      localStorage.removeItem('mindlink_refresh_token')
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

// Auto-refresh token setup - refresh every 10 minutes (access token expires in 15 minutes)
let refreshInterval = null;

// Set up auto-refresh when store is created
// Subscribe to the store directly, not as a hook
const authStore = useAuthStore;

authStore.subscribe((state) => {
  if (state.isAuthenticated && state.refreshToken && !refreshInterval) {
    console.log('🔄 Setting up automatic token refresh every 10 minutes')
    refreshInterval = setInterval(() => {
      authStore.getState().refreshAccessToken()
    }, 10 * 60 * 1000) // 10 minutes
  } else if (!state.isAuthenticated && refreshInterval) {
    console.log('🛑 Clearing automatic token refresh')
    clearInterval(refreshInterval)
    refreshInterval = null
  }
})
