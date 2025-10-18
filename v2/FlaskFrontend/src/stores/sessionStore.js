import { create } from 'zustand';
import api from '../utils/api';

export const useSessionStore = create((set, get) => ({
  sessions: [],
  todaySessions: [],
  upcomingSessions: [],
  pastSessions: [],
  loading: false,
  error: null,
  
  // Dashboard stats
  dashboardStats: {
    totalSessions: 0,
    completedSessions: 0,
    upcomingCount: 0,
    thisWeekCount: 0
  },
  
  // Fetch sessions with filtering
  fetchSessions: async (filters = {}) => {
    set({ loading: true });
    try {
      const response = await api.get('/sessions/', { params: filters });
      const sessionsData = Array.isArray(response.data) 
        ? response.data 
        : response.data.sessions || [];
      
      // Process and categorize sessions
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      
      const todaySessions = sessionsData.filter(session => {
        const sessionDate = new Date(session.scheduled_at);
        return sessionDate.toDateString() === now.toDateString();
      });
      
      const upcomingSessions = sessionsData.filter(session => 
        new Date(session.scheduled_at) > now && 
        session.status === 'scheduled'
      );
      
      const pastSessions = sessionsData.filter(session => 
        new Date(session.scheduled_at) < now || 
        ['completed', 'cancelled', 'no_show', 'forfeited'].includes(session.status)
      );
      
      // Calculate dashboard stats
      const dashboardStats = {
        totalSessions: sessionsData.length,
        completedSessions: sessionsData.filter(s => s.status === 'completed').length,
        upcomingCount: upcomingSessions.length,
        thisWeekCount: todaySessions.length + upcomingSessions.filter(session => {
          const sessionDate = new Date(session.scheduled_at);
          const nextWeek = new Date(now);
          nextWeek.setDate(nextWeek.getDate() + 7);
          return sessionDate <= nextWeek;
        }).length
      };
      
      set({ 
        sessions: sessionsData, 
        todaySessions, 
        upcomingSessions, 
        pastSessions,
        dashboardStats,
        loading: false,
        error: null
      });
      
    } catch (error) {
      console.error('Error fetching sessions:', error);
      set({ error: 'Failed to load sessions', loading: false });
    }
  },
  
  // Cancel a session
  cancelSession: async (sessionId, reason) => {
    try {
      await api.post(`/availability/cancel-booking/${sessionId}`, { reason });
      
      // Update local state optimistically
      set(state => ({
        sessions: state.sessions.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'cancelled', cancellation_reason: reason }
            : session
        ),
        // Update categorized lists as well
        upcomingSessions: state.upcomingSessions.filter(s => s.id !== sessionId),
        todaySessions: state.todaySessions.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'cancelled', cancellation_reason: reason }
            : session
        )
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Error cancelling session:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to cancel session' 
      };
    }
  },
  
  // Join a session
  joinSession: async (sessionId) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/join`);
      return { 
        success: true, 
        roomId: response.data.session.room_id,
        joinUrl: response.data.session.join_url
      };
    } catch (error) {
      console.error('Error joining session:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to join session' 
      };
    }
  }
}));