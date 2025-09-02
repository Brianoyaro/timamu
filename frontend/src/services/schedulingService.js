import { apiService } from './apiService'

export const schedulingService = {
  async getAvailability(therapistId, startDate, endDate) {
    const response = await apiService.get(`/therapists/${therapistId}/availability`, {
      start_date: startDate,
      end_date: endDate
    })
    return response.availability || []
  },

  async setAvailability(therapistId, availabilityData) {
    const response = await apiService.post(`/therapists/${therapistId}/availability`, availabilityData)
    return response.availability
  },

  async getAppointments(filters = {}) {
    const response = await apiService.get('/appointments', filters)
    return response.appointments || []
  },

  async createAppointment(appointmentData) {
    const response = await apiService.post('/appointments', appointmentData)
    return response.appointment
  },

  async getAppointment(appointmentId) {
    const response = await apiService.get(`/appointments/${appointmentId}`)
    return response.appointment
  },

  async updateAppointment(appointmentId, updates) {
    const response = await apiService.patch(`/appointments/${appointmentId}`, updates)
    return response.appointment
  },

  async cancelAppointment(appointmentId, reason) {
    const response = await apiService.patch(`/appointments/${appointmentId}`, {
      status: 'cancelled',
      cancellation_reason: reason
    })
    return response.appointment
  },

  async rescheduleAppointment(appointmentId, newDateTime) {
    const response = await apiService.patch(`/appointments/${appointmentId}`, {
      datetime: newDateTime,
      status: 'rescheduled'
    })
    return response.appointment
  }
}
