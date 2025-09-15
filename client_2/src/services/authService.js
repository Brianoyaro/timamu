import { apiService } from './apiService'

/**
 * Authentication service for handling user authentication
 * Provides methods for sign in, sign up, password management, and OAuth
 */
class AuthService {
  /**
   * Sign in user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data and tokens
   */
  async signIn(email, password) {
    console.log('🔐 AuthService: Signing in user:', email)
    
    const response = await apiService.post('/auth/login', {
      email,
      password
    })

    if (!response.success) {
      throw new Error(response.error || 'Sign in failed')
    }

    console.log('✅ AuthService: Sign in successful')
    return response.data
  }

  /**
   * Sign up new user
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.name - User full name
   * @param {string} userData.role - User role (patient, therapist)
   * @returns {Promise<Object>} User data and tokens
   */
  async signUp(userData) {
    console.log('📝 AuthService: Signing up user:', userData.email)
    
    const response = await apiService.post('/auth/register', userData)

    if (!response.success) {
      throw new Error(response.error || 'Sign up failed')
    }

    console.log('✅ AuthService: Sign up successful')
    return response.data
  }

  /**
   * Sign out current user
   * @returns {Promise<void>}
   */
  async signOut() {
    console.log('🚪 AuthService: Signing out user')
    
    try {
      const response = await apiService.post('/auth/logout')
      
      if (!response.success) {
        console.warn('⚠️ AuthService: Sign out API response was not successful')
      }
    } catch (error) {
      // Don't throw on logout errors - still clear local state
      console.error('❌ AuthService: Sign out API error:', error.message)
    }
    
    console.log('✅ AuthService: Sign out complete')
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New user data and tokens
   */
  async refreshToken(refreshToken) {
    console.log('🔄 AuthService: Refreshing access token')
    
    const response = await apiService.post('/auth/refresh', {
      refreshToken
    })

    if (!response.success) {
      throw new Error(response.error || 'Token refresh failed')
    }

    console.log('✅ AuthService: Token refresh successful')
    return response.data
  }

  /**
   * Get current user information
   * @returns {Promise<Object>} Current user data
   */
  async getCurrentUser() {
    console.log('👤 AuthService: Getting current user')
    
    const response = await apiService.get('/auth/me')

    if (!response.success) {
      throw new Error(response.error || 'Failed to get user information')
    }

    return response.data.user
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async forgotPassword(email) {
    console.log('🔑 AuthService: Requesting password reset for:', email)
    
    const response = await apiService.post('/auth/forgot-password', {
      email
    })

    if (!response.success) {
      throw new Error(response.error || 'Failed to send password reset email')
    }

    console.log('✅ AuthService: Password reset email sent')
  }

  /**
   * Reset password using reset token
   * @param {string} token - Reset token from email
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async resetPassword(token, newPassword) {
    console.log('🔒 AuthService: Resetting password')
    
    const response = await apiService.post('/auth/reset-password', {
      token,
      password: newPassword
    })

    if (!response.success) {
      throw new Error(response.error || 'Password reset failed')
    }

    console.log('✅ AuthService: Password reset successful')
  }

  /**
   * Get Google OAuth URL
   * @returns {string} Google OAuth URL
   */
  getGoogleOAuthUrl() {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'
    return `${baseUrl}/auth/google`
  }

  /**
   * Handle OAuth success callback
   * @param {string} token - Temporary token from OAuth callback
   * @returns {Promise<Object>} User data and tokens
   */
  async handleOAuthSuccess(token) {
    console.log('🔐 AuthService: Handling OAuth success')
    
    try {
      // Decode the temporary token
      const data = JSON.parse(atob(token))
      
      // Validate token timestamp (should be recent)
      const tokenAge = Date.now() - data.timestamp
      if (tokenAge > 5 * 60 * 1000) { // 5 minutes
        throw new Error('OAuth token has expired')
      }

      console.log('✅ AuthService: OAuth success handled')
      return {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      }
    } catch (error) {
      console.error('❌ AuthService: OAuth success handling failed:', error)
      throw new Error('Invalid OAuth token')
    }
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Whether email is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with isValid flag and message
   */
  validatePassword(password) {
    if (!password) {
      return { isValid: false, message: 'Password is required' }
    }

    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' }
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' }
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' }
    }

    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' }
    }

    return { isValid: true, message: 'Password is strong' }
  }

  /**
   * Generate password strength score
   * @param {string} password - Password to score
   * @returns {number} Strength score from 0-4
   */
  getPasswordStrength(password) {
    let score = 0
    
    if (!password) return score

    // Length check
    if (password.length >= 8) score++
    if (password.length >= 12) score++

    // Character variety checks
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    return Math.min(score, 4)
  }
}

// Export singleton instance
export const authService = new AuthService()
