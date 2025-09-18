import { create } from 'zustand';
import { getApiUrl } from '../utils/api';

const useSessionStore = create((set, get) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,
  therapists: [],
  availability: [],

  // Actions
  setSessions: (sessions) => set({ sessions }),
  
  setCurrentSession: (session) => set({ currentSession: session }),

  setTherapists: (therapists) => set({ therapists }),

  // Fetch user's sessions (lean API)
  fetchSessions: async (token) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${getApiUrl()}/api/lean/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch sessions');
      }

      // Handle API response format
      const sessions = data.data?.sessions || data.data || [];
      set({ sessions: Array.isArray(sessions) ? sessions : [], isLoading: false });
      return sessions;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      // Set empty array on error to prevent filter issues
      set({ sessions: [], isLoading: false });
      throw error;
    }
  },

  // Create new session with direct booking (lean API)
  createSession: async (sessionData, token) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${getApiUrl()}/api/lean/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(sessionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create session');
      }

      const newSession = data.data?.session || data.data;
      
      set((state) => ({
        sessions: [...state.sessions, newSession],
        isLoading: false,
      }));

      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Search therapists with filters (lean API)
  searchTherapists: async (filters, token) => {
    set({ isLoading: true });
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.specialization) queryParams.append('specialization', filters.specialization);
      if (filters.language) queryParams.append('language', filters.language);
      if (filters.availability) queryParams.append('availability', filters.availability);
      if (filters.emergency !== undefined) queryParams.append('emergency', filters.emergency);

      const response = await fetch(`${getApiUrl()}/api/lean/therapists/search?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search therapists');
      }

      const therapists = data.data?.therapists || [];
      set({ therapists, isLoading: false });
      return therapists;
    } catch (error) {
      console.error('Error searching therapists:', error);
      set({ therapists: [], isLoading: false });
      throw error;
    }
  },

  // Get therapist availability (lean API)
  getTherapistAvailability: async (therapistId, date, token) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/lean/therapists/${therapistId}/availability?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get therapist availability');
      }

      return data.data;
    } catch (error) {
      throw error;
    }
  },

  // Update session status/details (lean API)
  updateSession: async (sessionId, updates, token) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${getApiUrl()}/api/lean/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update session');
      }

      const updatedSession = data.data?.session || data.data;
      
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

  // Cancel session (lean API)
  cancelSession: async (sessionId, token) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${getApiUrl()}/api/lean/sessions/${sessionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel session');
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

  // Join session (lean API)
  joinSession: async (sessionId, token) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/lean/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to join session');
      }

      const session = data.data?.session || data.data;
      set({ currentSession: session });
      return session;
    } catch (error) {
      throw error;
    }
  },

  // Add session notes (lean API)
  addSessionNotes: async (sessionId, notes, token) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/lean/sessions/${sessionId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add session notes');
      }

      const updatedSession = data.data?.session || data.data;
      
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

  // Rate session/therapist (lean API)
  rateSession: async (sessionId, rating, comment, token) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/lean/sessions/${sessionId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to rate session');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Therapist availability management (lean API)
  setAvailability: (availability) => set({ availability }),

  // Fetch therapist's availability (lean API)
  fetchMyAvailability: async (token) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/lean/therapists/availability`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch availability');
      }

      const availability = data.data?.availability || {};
      set({ availability });
      return availability;
    } catch (error) {
      throw error;
    }
  },

  // Update therapist's availability (lean API)
  updateMyAvailability: async (availabilityData, token) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/lean/therapists/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(availabilityData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update availability');
      }

      const availability = data.data?.availability || {};
      set({ availability });
      return availability;
    } catch (error) {
      throw error;
    }
  },

  // Clear store data
  clearSessionData: () => set({
    sessions: [],
    currentSession: null,
    therapists: [],
    availability: [],
    isLoading: false,
  }),
}));

export default useSessionStore;
