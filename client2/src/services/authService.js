import { apiService } from './apiService'
import { useAuthStore } from '../store/authStore'

export const authService = {
  async signIn(email, password) {
    const response = await apiService.post('/auth/login', {
      email,
      password
    })
    return response.data
  },

  async signUp(userData) {
    const response = await apiService.post('/auth/register', userData)
    return response.data
  },

  async signOut() {
    try {
      await apiService.post('/auth/logout')
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error)
    }
  },

  async forgotPassword(email) {
    const response = await apiService.post('/auth/forgot-password', {
      email
    })
    return response.data
  },

  async resetPassword(token, newPassword) {
    const response = await apiService.post('/auth/reset-password', {
      token,
      password: newPassword
    })
    return response.data
  },

  async validateToken() {
    try {
      const response = await apiService.get('/auth/me')
      return response.data?.user
    } catch (error) {
      throw new Error('Invalid token')
    }
  },

  async refreshToken() {
    const { refreshToken } = useAuthStore.getState()
    
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }
    
    const response = await apiService.post('/auth/refresh', {
      refreshToken
    })
    return response.data
  }
}
