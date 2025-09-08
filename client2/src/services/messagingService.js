import { apiService } from './apiService'

export const messagingService = {
  async getThreads() {
    const response = await apiService.get('/threads')
    return response.data?.threads || []
  },

  async getThread(threadId) {
    const response = await apiService.get(`/threads/${threadId}`)
    return response.data?.thread
  },

  async getMessages(threadId, page = 1, limit = 50) {
    const response = await apiService.get(`/threads/${threadId}/messages`, {
      page,
      limit
    })
    return response.data || { messages: [], pagination: {} }
  },

  async sendMessage(threadId, messageData) {
    const response = await apiService.post(`/threads/${threadId}/messages`, messageData)
    return response.data?.message
  },

  async markAsRead(threadId, messageId) {
    await apiService.patch(`/threads/${threadId}/messages/${messageId}/read`)
  },

  async markThreadAsRead(threadId) {
    await apiService.patch(`/threads/${threadId}/read`)
  },

  async uploadAttachment(threadId, file, onProgress) {
    const response = await apiService.uploadFile(
      `/threads/${threadId}/attachments`, 
      file, 
      onProgress
    )
    return response.data
  },

  async deleteMessage(threadId, messageId) {
    await apiService.delete(`/threads/${threadId}/messages/${messageId}`)
  },

  async createThread(participantIds, initialMessage = null) {
    const response = await apiService.post('/threads', {
      participants: participantIds,
      initialMessage: initialMessage
    })
    return response.data?.thread
  },

  async getUnreadCount() {
    const response = await apiService.get('/threads/unread-count')
    return response.data?.count || 0
  }
}
