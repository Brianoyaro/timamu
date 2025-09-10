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

  async validateToken(token) {
    try {
      // Pass the token explicitly in the headers for validation
      const response = await apiService.request('/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.data?.user
    } catch (error) {
      throw new Error('Invalid token')
    }
  },

  async refreshToken(refreshToken) {
    // If no refreshToken provided, get it from store
    if (!refreshToken) {
      const { refreshToken: storeRefreshToken } = useAuthStore.getState()
      refreshToken = storeRefreshToken // I DON'T GET THIS. WHAT IS storeRefreshToken???????
    }
    
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }
    
    const response = await apiService.post('/auth/refresh', {
      refreshToken
    })
    return response.data
  }
}
