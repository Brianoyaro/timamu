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
    try {
      const token = localStorage.getItem('mindlink_token')
      if (token) {
        const user = await authService.validateToken(token)
        set({ 
          user, 
          token, 
          isAuthenticated: true, 
          isInitialized: true 
        })
      } else {
        set({ isInitialized: true })
      }
    } catch (error) {
      localStorage.removeItem('mindlink_token')
      set({ isInitialized: true })
    }
  },

  signIn: async (email, password, rememberMe = false) => {
    set({ isLoading: true })
    try {
      const { user, token } = await authService.signIn(email, password)
      
      if (rememberMe) {
        localStorage.setItem('mindlink_token', token)
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
      set({ isLoading: false })
      useToastStore.getState().addToast({
        type: 'error',
        message: error.message || 'Sign in failed'
      })
      return { success: false, error: error.message }
    }
  },

  signUp: async (userData) => {
    set({ isLoading: true })
    try {
      const { user, token } = await authService.signUp(userData)
      
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
      set({ isLoading: false })
      useToastStore.getState().addToast({
        type: 'error',
        message: error.message || 'Sign up failed'
      })
      return { success: false, error: error.message }
    }
  },

  signOut: async () => {
    try {
      await authService.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
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
