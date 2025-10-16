import { create } from 'zustand';
import api from '../utils/api';

// Helper functions for secure storage management
const getStoredToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || null;
  }
  return null;
};

const getStoredRefreshToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refresh_token') || null;
  }
  return null;
};

const getStoredUser = () => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user');
    try {
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }
  return null;
};

const getRememberMe = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('remember_me') === 'true';
  }
  return false;
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
  lastTokenCheck: null,
  tokenCheckInterval: 5 * 60 * 1000, // Check token every 5 minutes instead of every request

  // Initialize store with localStorage data - NO VALIDATION ON INIT
  initialize: () => {
    console.log('[Auth] Initializing auth store...');
    const token = getStoredToken();
    const user = getStoredUser();
    const rememberMe = getRememberMe();
    
    // Be more lenient with authentication - trust tokens even without full user data
    const hasValidToken = !!token;
    const hasUserData = !!user;
    
    // Consider authenticated if we have a token (user data can be loaded later)
    const isAuthenticated = hasValidToken;
    
    set({ 
      token, 
      user,
      isAuthenticated,
      isInitialized: true,
      lastTokenCheck: hasValidToken && rememberMe ? Date.now() : null
    });
    
    console.log('[Auth] Initialized with stored data:', { 
      hasToken: hasValidToken, 
      hasUser: hasUserData, 
      isAuthenticated,
      rememberMe: rememberMe
    });
  },

  // Enhanced login function with remember me support
  login: async (email, password, rememberMe = false) => {
    set({ isLoading: true, error: null });

    try {
      console.log('[Auth] Attempting login...', { email, rememberMe });
      const response = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user } = response.data;
      
      // Store access token for API requests
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Handle remember me functionality
      if (rememberMe && refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('remember_me');
      }

      // Update state
      set({ 
        token: access_token, 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        lastTokenCheck: Date.now(),
        error: null
      });
      
      console.log('[Auth] Login successful');
      return user;
    } catch (error) {
      console.error('[Auth] Login failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  // Enhanced register function
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      console.log('[Auth] Attempting registration...');
      const response = await api.post('/auth/register', userData);
      const { access_token, refresh_token, user } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('remember_me', 'true'); // Default to remember for new registrations
      }
      
      // Update auth state
      set({ 
        token: access_token, 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        lastTokenCheck: Date.now(),
        error: null
      });
      
      console.log('[Auth] Registration successful');
      return user;
    } catch (error) {
      console.error('[Auth] Registration failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  // Enhanced logout function
  logout: async () => {
    console.log('[Auth] Logging out...');
    
    // Attempt to revoke refresh token on server (use Flask backend format)
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refresh_token: refreshToken });
        console.log('[Auth] Refresh token revoked on server');
      } catch (error) {
        console.warn('[Auth] Failed to revoke token on server:', error);
      }
    }
    
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('remember_me');
    
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false,
      lastTokenCheck: null,
      error: null
    });
    
    console.log('[Auth] Logout completed');
  },

  // Enhanced load user profile function
  loadUser: async () => {
    const currentState = get();
    
    // If we already have fresh user data, return it
    if (currentState.user) {
      return currentState.user;
    }

    const token = currentState.token || getStoredToken();
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return null;
    }

    set({ isLoading: true });
    try {
      console.log('[Auth] Loading fresh user data...');
      const response = await api.get('/auth/me');
      const userData = response.data.user || response.data; // Handle different response formats
      
      // Store user data in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userData));
      
      set({ 
        user: userData, 
        isLoading: false, 
        isAuthenticated: true,
        lastTokenCheck: Date.now(),
        error: null
      });
      
      return userData;
    } catch (error) {
      console.error('[Auth] Failed to load user:', error);
      // Don't immediately logout on loadUser failure - might be network issue
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Smart token validation - only check when really needed
  validateToken: async (force = false) => {
    const currentState = get();
    const now = Date.now();
    
    // Don't validate too frequently unless forced
    if (!force && currentState.lastTokenCheck && 
        (now - currentState.lastTokenCheck) < currentState.tokenCheckInterval) {
      console.log('[Auth] Token check skipped - too recent');
      return currentState.isAuthenticated;
    }

    const token = currentState.token || getStoredToken();
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return false;
    }

    try {
      console.log('[Auth] Validating token...');
      await api.get('/auth/verify');
      
      set({ 
        isAuthenticated: true,
        lastTokenCheck: now,
        error: null
      });
      
      return true;
    } catch (error) {
      console.warn('[Auth] Token validation failed:', error);
      
      // Try to refresh token before giving up
      const refreshSuccess = await get().refreshToken();
      if (!refreshSuccess) {
        // Only logout if refresh also fails
        console.log('[Auth] Both token validation and refresh failed, logging out');
        get().logout();
        return false;
      }
      
      return true;
    }
  },

  // Improved refresh token functionality
  refreshToken: async () => {
    try {
      const refreshToken = getStoredRefreshToken();
      
      if (!refreshToken) {
        console.log('[Auth] No refresh token available');
        return false;
      }

      console.log('[Auth] Attempting to refresh token...');
      const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
      const { access_token, refresh_token: newRefreshToken } = response.data;
      
      // Update stored tokens
      localStorage.setItem('token', access_token);
      if (newRefreshToken) {
        localStorage.setItem('refresh_token', newRefreshToken);
      }
      
      set({ 
        token: access_token, 
        isAuthenticated: true,
        lastTokenCheck: Date.now(),
        error: null
      });
      
      console.log('[Auth] Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('[Auth] Token refresh failed:', error);
      
      // Only logout if this is a definitive auth failure (401/403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('[Auth] Refresh token invalid, logging out');
        get().logout();
      }
      
      return false;
    }
  },

  // Check if user should remain logged in (for remember me)
  shouldPersistSession: () => {
    return localStorage.getItem('remember_me') === 'true';
  }
}));