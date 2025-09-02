import { apiService } from './apiService'

export const sessionService = {
  async getSessions(filters = {}) {
    const response = await apiService.get('/sessions', filters)
    return response.sessions || []
  },

  async getSession(sessionId) {
    const response = await apiService.get(`/sessions/${sessionId}`)
    return response.session
  },

  async createSession(sessionData) {
    const response = await apiService.post('/sessions', sessionData)
    return response.session
  },

  async joinSession(sessionId) {
    const response = await apiService.post(`/sessions/${sessionId}/join`)
    return response.session
  },

  async endSession(sessionId) {
    await apiService.post(`/sessions/${sessionId}/end`)
  },

  async updateSessionStatus(sessionId, status) {
    const response = await apiService.patch(`/sessions/${sessionId}`, { status })
    return response.session
  },

  // WebRTC signaling
  async sendSignal(sessionId, signal) {
    const response = await apiService.post(`/sessions/${sessionId}/signal`, signal)
    return response
  },

  async getSignals(sessionId, lastSignalId = null) {
    const params = lastSignalId ? { after: lastSignalId } : {}
    const response = await apiService.get(`/sessions/${sessionId}/signals`, params)
    return response.signals || []
  },

  async admitPatient(sessionId) {
    const response = await apiService.post(`/sessions/${sessionId}/admit`)
    return response.session
  },

  async getSessionNotes(sessionId) {
    const response = await apiService.get(`/sessions/${sessionId}/notes`)
    return response.notes || []
  },

  async createSessionNote(sessionId, noteData) {
    const response = await apiService.post(`/sessions/${sessionId}/notes`, noteData)
    return response.note
  },

  async updateSessionNote(sessionId, noteId, updates) {
    const response = await apiService.patch(`/sessions/${sessionId}/notes/${noteId}`, updates)
    return response.note
  }
}
