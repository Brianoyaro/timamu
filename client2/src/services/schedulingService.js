import { apiService } from './apiService'

/**
 * Scheduling service for appointment management
 * Handles booking, availability, and appointment operations
 */
export const schedulingService = {
  /**
   * Get user appointments
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} List of appointments
   */
  async getAppointments(filters = {}) {
    const response = await apiService.get('/appointments', filters)
    return response.data?.appointments || response.appointments || []
  },

  /**
   * Get therapist availability
   * @param {string} therapistId - Therapist ID
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @returns {Promise<Array>} Available time slots
   */
  async getTherapistAvailability(therapistId, startDate, endDate) {
    const response = await apiService.get(`/therapists/${therapistId}/availability`, {
      startDate,
      endDate,
    })
    return response.data?.slots || response.slots || []
  },

  /**
   * Book an appointment
   * @param {Object} appointmentData - Appointment details
   * @returns {Promise<Object>} Created appointment
   */
  async bookAppointment(appointmentData) {
    const response = await apiService.post('/appointments', appointmentData)
    return response.data?.appointment || response.appointment
  },

  /**
   * Update appointment
   * @param {string} appointmentId - Appointment ID
   * @param {Object} updates - Appointment updates
   * @returns {Promise<Object>} Updated appointment
   */
  async updateAppointment(appointmentId, updates) {
    const response = await apiService.patch(`/appointments/${appointmentId}`, updates)
    return response.data?.appointment || response.appointment
  },

  /**
   * Cancel appointment
   * @param {string} appointmentId - Appointment ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Response message
   */
  async cancelAppointment(appointmentId, reason) {
    const response = await apiService.patch(`/appointments/${appointmentId}/cancel`, {
      reason,
    })
    return response
  },

  /**
   * Get appointment details
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Object>} Appointment details
   */
  async getAppointment(appointmentId) {
    const response = await apiService.get(`/appointments/${appointmentId}`)
    return response.data?.appointment || response.appointment
  },

  /**
   * Set therapist availability (therapist only)
   * @param {Array} availabilitySlots - Array of availability slots
   * @returns {Promise<Object>} Response message
   */
  async setAvailability(availabilitySlots) {
    const response = await apiService.post('/therapists/availability', {
      slots: availabilitySlots,
    })
    return response
  },
}
