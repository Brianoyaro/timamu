import { apiService } from './apiService'

export const assessmentService = {
  async getAssessments(filters = {}) {
    const response = await apiService.get('/assessments', filters)
    return response.assessments || []
  },

  async submitAssessment(assessmentData) {
    const response = await apiService.post('/assessments', assessmentData)
    return response.assessment
  },

  async getAssessmentHistory(type, patientId = null) {
    const params = { type }
    if (patientId) params.patient_id = patientId
    
    const response = await apiService.get('/assessments/history', params)
    return response.assessments || []
  },

  async getMoodCheckins(startDate, endDate) {
    const response = await apiService.get('/mood-checkins', {
      start_date: startDate,
      end_date: endDate
    })
    return response.checkins || []
  },

  async submitMoodCheckin(moodData) {
    const response = await apiService.post('/mood-checkins', moodData)
    return response.checkin
  },

  async getAssessmentTemplates() {
    const response = await apiService.get('/assessment-templates')
    return response.templates || []
  }
}
