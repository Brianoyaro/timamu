import { create } from 'zustand';
import api from '../utils/api';

// Helper function to safely get token from localStorage
const getStoredToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || null;
  }
  return null;
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,

  // Initialize store with localStorage data
  initialize: () => {
    const token = getStoredToken();
    set({ 
      token, 
      isAuthenticated: !!token,
      isInitialized: true 
    });
  },

  // Login function
  login: async (email, password, rememberMe) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user } = response.data;
      
      // Choose which token to store based on remember me
      const tokenToStore = rememberMe ? refresh_token : access_token;
      
      // Always store token in localStorage for API requests
      localStorage.setItem('token', tokenToStore);

      // Update state
      set({ token: tokenToStore, user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Register function
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', userData);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Logout function
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  // Load user profile
  loadUser: async () => {
    const currentState = get();
    const token = currentState.token || getStoredToken();
    
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    // If we already have a user, don't make another API call
    if (currentState.user) {
      return;
    }

    set({ isLoading: true });
    try {
      // Since /auth/me doesn't exist, we'll skip loading user profile
      // The user data should come from the login response
      set({ isLoading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: error.message });
    }
  }
}));