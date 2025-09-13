import { apiService } from './apiService'

/**
 * User service for user management operations
 * Handles therapist discovery, user profiles, and user data
 */
export const userService = {
  /**
   * Get list of therapists with optional filtering
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} List of therapists
   */
  async getTherapists(filters = {}) {
    const response = await apiService.get('/users/therapists', filters)
    return response.data?.users || response.users || []
  },

  /**
   * Get therapist details by ID
   * @param {string} therapistId - Therapist ID
   * @returns {Promise<Object>} Therapist details
   */
  async getTherapist(therapistId) {
    const response = await apiService.get(`/users/${therapistId}`)
    return response.data?.user || response.user
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  async getProfile() {
    const response = await apiService.get('/users/me')
    return response.data?.user || response.user
  },

  /**
   * Update user profile
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated user data
   */
  async updateProfile(updates) {
    const response = await apiService.patch('/users/me', updates)
    return response.data?.user || response.user
  },

  /**
   * Upload user avatar
   * @param {File} file - Avatar image file
   * @param {Function} onProgress - Upload progress callback
   * @returns {Promise<string>} Avatar URL
   */
  async uploadAvatar(file, onProgress) {
    const response = await apiService.uploadFile('/users/me/avatar', file, onProgress)
    return response.data?.url || response.url
  },

  /**
   * Search users (admin function)
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} Search results with pagination
   */
  async searchUsers(filters = {}) {
    const response = await apiService.get('/users', filters)
    return response.data || response
  },
}
