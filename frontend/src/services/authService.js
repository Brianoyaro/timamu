import { apiService } from './apiService'

export const authService = {
  async signIn(email, password) {
    const response = await apiService.post('/auth/login', {
      email,
      password
    })
    return response
  },

  async signUp(userData) {
    const response = await apiService.post('/auth/register', userData)
    return response
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
    return response
  },

  async resetPassword(token, newPassword) {
    const response = await apiService.post('/auth/reset-password', {
      token,
      password: newPassword
    })
    return response
  },

  async validateToken(token) {
    // Temporarily set token for validation request
    const originalToken = useAuthStore?.getState?.()?.token
    
    try {
      const response = await apiService.get('/auth/me')
      return response.user
    } catch (error) {
      throw new Error('Invalid token')
    }
  },

  async refreshToken() {
    const response = await apiService.post('/auth/refresh')
    return response
  }
}
