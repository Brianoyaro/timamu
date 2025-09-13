import { apiService } from './apiService'

/**
 * Authentication service
 * Handles login, logout, registration, and password reset
 */
export const authService = {
  /**
   * Sign in user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data and token
   */
  async signIn(email, password) {
    const response = await apiService.post('/auth/login', {
      email,
      password,
    })
    return response
  },

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User data and token
   */
  async signUp(userData) {
    const response = await apiService.post('/auth/register', userData)
    return response
  },

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Response message
   */
  async forgotPassword(email) {
    const response = await apiService.post('/auth/forgot-password', { email })
    return response
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<Object>} Response message
   */
  async resetPassword(token, password) {
    const response = await apiService.post('/auth/reset-password', {
      token,
      password,
    })
    return response
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>} User data
   */
  async getProfile() {
    const response = await apiService.get('/auth/me')
    return response
  },

  /**
   * Refresh authentication token
   * @returns {Promise<Object>} New token data
   */
  async refreshToken() {
    const response = await apiService.post('/auth/refresh')
    return response
  },

  /**
   * Sign out user
   * @returns {Promise<Object>} Response message
   */
  async signOut() {
    try {
      await apiService.post('/auth/logout')
    } catch (error) {
      // Ignore logout errors as we'll clear local state anyway
      console.warn('Logout request failed:', error)
    }
  },
}
