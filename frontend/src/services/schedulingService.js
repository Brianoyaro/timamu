import { apiService } from './apiService'

export const schedulingService = {
  async getAvailability(therapistId, startDate, endDate) {
    const params = {}
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    
    const response = await apiService.get(`/appointments/therapists/${therapistId}/availability`, params)
    return response.data || { availability: [], existingAppointments: [] }
  },

  async setAvailability(therapistId, availabilityData) {
    const response = await apiService.post(`/appointments/therapists/${therapistId}/availability`, {
      availability: availabilityData
    })
    return response.data?.availability || []
  },

  async getAppointments(filters = {}) {
    const response = await apiService.get('/appointments', filters)
    return response.data || { appointments: [], pagination: {} }
  },

  async getTodayAppointments(therapistId = null) {
    const today = new Date().toISOString().split('T')[0]
    const params = {
      startDate: today,
      endDate: today,
      status: 'confirmed,scheduled'
    }
    
    if (therapistId) {
      params.therapistId = therapistId
    }
    
    const response = await apiService.get('/appointments', params)
    return response.data?.appointments || []
  },

  async createAppointment(appointmentData) {
    const response = await apiService.post('/appointments', appointmentData)
    return response.data?.appointment
  },

  async getAppointment(appointmentId) {
    const response = await apiService.get(`/appointments/${appointmentId}`)
    return response.data?.appointment
  },

  async updateAppointment(appointmentId, updates) {
    const response = await apiService.patch(`/appointments/${appointmentId}`, updates)
    return response.data?.appointment
  },

  async cancelAppointment(appointmentId, reason) {
    const response = await apiService.patch(`/appointments/${appointmentId}`, {
      status: 'cancelled',
      cancellationReason: reason
    })
    return response.data?.appointment
  },

  async rescheduleAppointment(appointmentId, newDateTime) {
    const response = await apiService.patch(`/appointments/${appointmentId}`, {
      datetime: newDateTime
    })
    return response.data?.appointment
  }
}
