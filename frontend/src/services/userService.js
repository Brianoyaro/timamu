import { apiService } from './apiService'

export const userService = {
  async getProfile() {
    const response = await apiService.get('/users/me')
    return response.user
  },

  async updateProfile(updates) {
    const response = await apiService.patch('/users/me', updates)
    return response.user
  },

  async getTherapists(filters = {}) {
    const response = await apiService.get('/users', { 
      role: 'therapist',
      ...filters 
    })
    return response.users || []
  },

  async getTherapist(therapistId) {
    const response = await apiService.get(`/users/${therapistId}`)
    return response.user
  },

  async getPatients(filters = {}) {
    const response = await apiService.get('/users', { 
      role: 'patient',
      ...filters 
    })
    return response.users || []
  },

  async updateUserRoles(userId, roles) {
    const response = await apiService.patch(`/users/${userId}/roles`, { roles })
    return response.user
  },

  async uploadAvatar(file, onProgress) {
    const response = await apiService.uploadFile('/users/me/avatar', file, onProgress)
    return response.url
  },

  async exportUserData() {
    const response = await apiService.post('/users/me/data-export')
    return response
  },

  async requestDataDeletion() {
    const response = await apiService.post('/users/me/data-delete')
    return response
  }
}
