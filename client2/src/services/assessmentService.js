import { apiService } from './apiService'

export const assessmentService = {
  async getAssessments(filters = {}) {
    const response = await apiService.get('/assessments', filters)
    return response.data || { assessments: [], pagination: {} }
  },

  async submitAssessment(assessmentData) {
    const response = await apiService.post('/assessments', assessmentData)
    return response.data?.assessment
  },

  async getAssessmentHistory(type, patientId = null) {
    const params = { type }
    if (patientId) params.patientId = patientId
    
    const response = await apiService.get('/assessments/history', params)
    return response.data?.assessments || []
  },

  async getMoodCheckins(startDate, endDate) {
    const response = await apiService.get('/mood-checkins', {
      startDate: startDate,
      endDate: endDate
    })
    return response.data?.checkins || []
  },

  async submitMoodCheckin(moodData) {
    const response = await apiService.post('/mood-checkins', moodData)
    return response.data?.checkin
  },

  // async submitMoodCheckin(moodData, notes) {
  //   const response = await apiService.post('/mood-checkins', { moodData, notes})
  //   return response.data?.checkin
  // },

  async getAssessmentTemplates() {
    const response = await apiService.get('/assessment-templates')
    return response.data?.templates || []
  }
}
