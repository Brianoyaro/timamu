import { apiService } from './apiService'

export const userService = {
  async getProfile() {
    const response = await apiService.get('/auth/me')
    return response.data?.user
  },

  async updateProfile(userId, updates) {
    const response = await apiService.patch(`/users/${userId}`, updates)
    return response.data?.user
  },

  async getTherapists(filters = {}) {
    const params = { role: 'therapist', status: 'active' }
    
    // Add filters to the request
    if (filters.specializations && filters.specializations.length > 0) {
      params.specializations = filters.specializations.join(',')
    }
    
    if (filters.languages && filters.languages.length > 0) {
      params.languages = filters.languages.join(',')
    }
    
    if (filters.rating && filters.rating > 0) {
      params.minRating = filters.rating
    }
    
    if (filters.search) {
      params.search = filters.search
    }

    if (filters.limit) {
      params.limit = filters.limit
    }

    if (filters.available === true) {
      params.available = 'true'
    }

    const response = await apiService.get('/users', params)
    return response.data?.users || []
  },

  async getTherapist(therapistId) {
    const response = await apiService.get(`/users/${therapistId}`)
    return response.data?.user
  },

  async getPatients(filters = {}) {
    const response = await apiService.get('/users', { 
      role: 'patient',
      ...filters 
    })
    return response.data || { users: [], pagination: {} }
  },

  async updateUserRoles(userId, roles) {
    const response = await apiService.patch(`/users/${userId}/roles`, { roles })
    return response.data?.user
  },

  async uploadAvatar(file, onProgress) {
    const response = await apiService.uploadFile('/users/me/avatar', file, onProgress)
    return response.data?.url
  },

  async exportUserData() {
    const response = await apiService.post('/users/me/data-export')
    return response.data
  },

  async requestDataDeletion() {
    const response = await apiService.post('/users/me/data-delete')
    return response.data
  }
}
