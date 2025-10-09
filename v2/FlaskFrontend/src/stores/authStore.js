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

    // Load user profile - use this when you need full user data
  loadUser: async () => {
    const currentState = get();
    const token = currentState.token || getStoredToken();
    
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return null;
    }

    // If we already have user data, return it
    if (currentState.user) {
      return currentState.user;
    }

    set({ isLoading: true });
    try {
      const response = await api.get('/auth/me');
      const { user } = response.data;
      set({ user, isLoading: false, isAuthenticated: true });
      return user;
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: error.message });
      throw error;
    }
  },

    // Check if current token is valid
  validateToken: async () => {
    const currentState = get();
    const token = currentState.token || getStoredToken();
    
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return false;
    }

    try {
      const response = await api.get('/auth/verify');
      // Only update basic auth status, don't overwrite user data
      set({ isAuthenticated: true });
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
      return false;
    }
  },

  // Refresh token (if refresh functionality is needed)
  refreshToken: async () => {
    const currentState = get();
    const token = currentState.token || getStoredToken();
    
    if (!token) {
      return false;
    }

    try {
      // Attempt to refresh the token using the refresh endpoint
      const response = await api.post('/auth/refresh', { refresh_token: token });
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      set({ token: access_token, isAuthenticated: true });
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
      return false;
    }
  }
}));