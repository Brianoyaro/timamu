import { apiService } from './apiService'

export const sessionService = {
  async getSessions(filters = {}) {
    const response = await apiService.get('/sessions', filters)
    return response.data || { sessions: [], pagination: {} }
  },

  async getSession(sessionId) {
    const response = await apiService.get(`/sessions/${sessionId}`)
    return response.data?.session
  },

  async createSession(sessionData) {
    const response = await apiService.post('/sessions', sessionData)
    return response.data?.session
  },

  async joinSession(sessionId) {
    const response = await apiService.post(`/sessions/${sessionId}/join`)
    return response.data?.session
  },

  async endSession(sessionId) {
    await apiService.post(`/sessions/${sessionId}/end`)
  },

  async updateSessionStatus(sessionId, status) {
    const response = await apiService.patch(`/sessions/${sessionId}`, { status })
    return response.data?.session
  },

  // WebRTC signaling
  async sendSignal(sessionId, signal) {
    const response = await apiService.post(`/sessions/${sessionId}/signal`, signal)
    return response.data
  },

  async getSignals(sessionId, lastSignalId = null) {
    const params = lastSignalId ? { after: lastSignalId } : {}
    const response = await apiService.get(`/sessions/${sessionId}/signals`, params)
    return response.data?.signals || []
  },

  async admitPatient(sessionId) {
    const response = await apiService.post(`/sessions/${sessionId}/admit`)
    return response.data?.session
  },

  async getSessionNotes(sessionId) {
    const response = await apiService.get(`/sessions/${sessionId}/notes`)
    return response.data?.notes || []
  },

  async createSessionNote(sessionId, noteData) {
    const response = await apiService.post(`/sessions/${sessionId}/notes`, noteData)
    return response.data?.note
  },

  async updateSessionNote(sessionId, noteId, updates) {
    const response = await apiService.patch(`/sessions/${sessionId}/notes/${noteId}`, updates)
    return response.data?.note
  }
}
