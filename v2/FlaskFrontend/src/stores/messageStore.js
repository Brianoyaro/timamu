import { create } from 'zustand';
import api from '../utils/api';
import toast from 'react-hot-toast';

const useMessageStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchConversations: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get('/messages/conversations');
      const data = response.data;
      // Normalize response to ensure conversations is always an array.
      // API might return an array directly or an object like { conversations: [...] }
      const conversations = Array.isArray(data)
        ? data
        : data?.conversations || data?.items || data?.data || [];

      set({ conversations, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      toast.error('Failed to load conversations');
    }
  },

  fetchMessages: async (threadId, page = 1, perPage = 20) => {
    try {
      set({ isLoading: true });
      const response = await api.get(`/messages/conversations/${threadId}/messages`, {
        params: { page, perPage }
      });
      set({ messages: response.data.messages, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      toast.error('Failed to load messages');
    }
  },

  sendMessage: async (threadId, content, attachments = null) => {
    try {
      const response = await api.post(`/messages/conversations/${threadId}/messages`, {
        content,
        attachments,
        message_type: attachments ? 'file' : 'text'
      });
      
      // Update messages list with new message
      const messages = get().messages;
      set({ messages: [response.data, ...messages] });
      
      // Update conversation's last message
      const conversations = get().conversations.map(conv => {
        if (conv.id === threadId) {
          return {
            ...conv,
            last_message: response.data,
            last_message_at: response.data.created_at
          };
        }
        return conv;
      });
      
      set({ conversations });
      return response.data;
    } catch (error) {
      toast.error('Failed to send message');
      throw error;
    }
  },

  startConversation: async (participantId, sessionId = null) => {
    try {
      const response = await api.post('/messages/conversations', {
        participant_id: participantId,
        session_id: sessionId
      });
      
      await get().fetchConversations();
      return response.data.thread_id;
    } catch (error) {
      toast.error('Failed to start conversation');
      throw error;
    }
  },

  archiveConversation: async (threadId) => {
    try {
      await api.post(`/messages/conversations/${threadId}/archive`);
      const conversations = get().conversations.filter(conv => conv.id !== threadId);
      set({ conversations });
      toast.success('Conversation archived');
    } catch (error) {
      toast.error('Failed to archive conversation');
      throw error;
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await api.get('/messages/conversations/unread-count');
      set({ unreadCount: response.data.unread_count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  clearCurrentConversation: () => {
    set({ currentConversation: null });
  }
}));

export default useMessageStore;