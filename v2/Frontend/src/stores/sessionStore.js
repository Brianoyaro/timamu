import { create } from 'zustand';

const useSessionStore = create((set, get) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,
  availability: [],

  // Actions
  setSessions: (sessions) => set({ sessions }),
  
  setCurrentSession: (session) => set({ currentSession: session }),

  fetchSessions: async (token) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const sessions = await response.json();
      set({ sessions, isLoading: false });
      return sessions;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createSession: async (sessionData, token) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const newSession = await response.json();
      
      set((state) => ({
        sessions: [...state.sessions, newSession],
        isLoading: false,
      }));

      return newSession;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateSession: async (sessionId, updates, token) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      const updatedSession = await response.json();
      
      set((state) => ({
        sessions: state.sessions.map((session) =>
          session.id === sessionId ? updatedSession : session
        ),
        currentSession: state.currentSession?.id === sessionId 
          ? updatedSession 
          : state.currentSession,
        isLoading: false,
      }));

      return updatedSession;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  cancelSession: async (sessionId, token) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel session');
      }

      set((state) => ({
        sessions: state.sessions.filter((session) => session.id !== sessionId),
        currentSession: state.currentSession?.id === sessionId 
          ? null 
          : state.currentSession,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  joinSession: async (sessionId, token) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to join session');
      }

      const session = await response.json();
      set({ currentSession: session });
      return session;
    } catch (error) {
      throw error;
    }
  },

  addSessionNotes: async (sessionId, notes, token) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to add session notes');
      }

      const updatedSession = await response.json();
      
      set((state) => ({
        sessions: state.sessions.map((session) =>
          session.id === sessionId ? updatedSession : session
        ),
        currentSession: state.currentSession?.id === sessionId 
          ? updatedSession 
          : state.currentSession,
      }));

      return updatedSession;
    } catch (error) {
      throw error;
    }
  },

  // Availability management (for therapists)
  setAvailability: (availability) => set({ availability }),

  fetchAvailability: async (token) => {
    try {
      const response = await fetch('/api/users/availability', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }

      const availability = await response.json();
      set({ availability });
      return availability;
    } catch (error) {
      throw error;
    }
  },

  updateAvailability: async (availabilityData, token) => {
    try {
      const response = await fetch('/api/users/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(availabilityData),
      });

      if (!response.ok) {
        throw new Error('Failed to update availability');
      }

      const availability = await response.json();
      set({ availability });
      return availability;
    } catch (error) {
      throw error;
    }
  },
}));

export default useSessionStore;
