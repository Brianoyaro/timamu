import { create } from 'zustand'
import { authService } from '../services/authService'
import { useToastStore } from './toastStore'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    console.log('🚀 AuthStore: Starting initialization...')
    try {
      const token = localStorage.getItem('mindlink_token')
      console.log('📝 AuthStore: Token from localStorage:', token ? 'Found' : 'Not found')
      
      if (token) {
        console.log('🔍 AuthStore: Validating token...')
        const user = await authService.validateToken(token)
        console.log('✅ AuthStore: Token validation successful:', user?.name || user?.email)
        
        set({ 
          user, 
          token, 
          isAuthenticated: true, 
          isInitialized: true 
        })
      } else {
        console.log('✅ AuthStore: No token found, setting initialized to true')
        set({ isInitialized: true })
      }
    } catch (error) {
      console.error('❌ AuthStore: Initialization error:', error.message)
      localStorage.removeItem('mindlink_token')
      set({ isInitialized: true })
    }
    console.log('🏁 AuthStore: Initialization complete')
  },

  signIn: async (email, password, rememberMe = false) => {
    console.log('🔐 AuthStore: Starting sign in for:', email)
    set({ isLoading: true })
    try {
      const { user, token } = await authService.signIn(email, password)
      console.log('✅ AuthStore: Sign in successful for:', user?.name || user?.email)
      
      // TODO !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      // The backend returns {user, accessToken, refreshToken}
      // This is a potential bug. We should instead store the refresh token because it expires after 7 days unlike access token which expires after 15 minutes.

      if (rememberMe) {
        console.log('💾 AuthStore: Storing token in localStorage (remember me)')
        localStorage.setItem('mindlink_token', token)
      } else {
        console.log('🚫 AuthStore: Not storing token (remember me = false)')
      }
      
      set({ 
        user, 
        token, 
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
      // Backend expects userData = { email, password, name, role, tenantId[optional] } = req.body
      // Frontend sends userData = { email, password, name, role }. I don't see any bug here so far.

      const { user, token } = await authService.signUp(userData)
      console.log('✅ AuthStore: Sign up successful for:', user?.name || user?.email)
      
      // TODO !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      // The backend returns {user, accessToken, refreshToken}
      // This is a potential bug. We should instead store the refresh token because it expires after 7 days unlike access token which expires after 15 minutes.
      // Also, we are not setting any token in localStorage here. I think it is the best practice because we should only add it to localStorage when the user selects 'remember me'.
      
      set({ 
        user, 
        token, 
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
      localStorage.removeItem('mindlink_token')
      set({ 
        user: null, 
        token: null, 
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
  }
}))
