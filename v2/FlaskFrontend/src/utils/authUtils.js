/**
 * Enhanced Authentication utilities for improved user experience
 * Provides background token validation, session management, and graceful error handling
 */
import { useAuthStore } from '../stores/authStore';

// Background token validation - runs periodically to keep session alive
let backgroundValidationTimer = null;

export const startBackgroundTokenValidation = () => {
  const rememberMe = localStorage.getItem('remember_me') === 'true';
  
  // Only start background validation if user wants to be remembered
  if (!rememberMe) {
    console.log('[AuthUtils] Background validation disabled - remember me not enabled');
    return null;
  }

  // Clear any existing timer
  if (backgroundValidationTimer) {
    clearInterval(backgroundValidationTimer);
  }

  console.log('[AuthUtils] Starting background token validation...');
  
  backgroundValidationTimer = setInterval(async () => {
    const currentState = useAuthStore.getState();
    
    // Only validate if we're currently authenticated
    if (currentState.isAuthenticated && currentState.user) {
      try {
        await currentState.validateToken(false); // Non-forced validation
        console.log('[AuthUtils] Background token validation successful');
      } catch (error) {
        console.warn('[AuthUtils] Background token validation failed:', error);
        // Stop the interval if validation fails
        stopBackgroundTokenValidation();
      }
    } else {
      // If no longer authenticated, stop background validation
      stopBackgroundTokenValidation();
    }
  }, 10 * 60 * 1000); // Check every 10 minutes

  return backgroundValidationTimer;
};

// Clean up background validation
export const stopBackgroundTokenValidation = () => {
  if (backgroundValidationTimer) {
    clearInterval(backgroundValidationTimer);
    backgroundValidationTimer = null;
    console.log('[AuthUtils] Background token validation stopped');
  }
};

// Check if we should auto-login (for remember me functionality)
export const shouldAutoLogin = () => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refresh_token');
  const rememberMe = localStorage.getItem('remember_me') === 'true';
  const user = localStorage.getItem('user');
  
  return !!(token && user && rememberMe) || !!(refreshToken && rememberMe);
};

// Session restoration for page refreshes
export const restoreSession = async () => {
  const authStore = useAuthStore.getState();
  
  // Initialize the store first if not already done
  if (!authStore.isInitialized) {
    console.log('[AuthUtils] Initializing auth store during session restoration...');
    authStore.initialize();
    
    // Get updated state after initialization
    const updatedState = useAuthStore.getState();
    
    // If user has remember me enabled and is authenticated, start background validation
    const rememberMe = localStorage.getItem('remember_me') === 'true';
    if (rememberMe && updatedState.isAuthenticated && updatedState.user) {
      console.log('[AuthUtils] Restoring session with background validation');
      startBackgroundTokenValidation();
      return true;
    }

    // If no remember me but has tokens, try to validate once
    if (updatedState.isAuthenticated && !rememberMe) {
      console.log('[AuthUtils] Session restoration without remember me');
      try {
        const isValid = await updatedState.validateToken(true); // Force validation
        return isValid;
      } catch (error) {
        console.warn('[AuthUtils] Session restoration validation failed:', error);
        return false;
      }
    }

    return updatedState.isAuthenticated;
  }

  // If already initialized, check session status
  const rememberMe = localStorage.getItem('remember_me') === 'true';
  if (rememberMe && authStore.isAuthenticated && authStore.user) {
    console.log('[AuthUtils] Session already restored, starting background validation');
    startBackgroundTokenValidation();
    return true;
  }

  return authStore.isAuthenticated;
};

// Get time until token should be refreshed (for proactive refresh)
export const getTokenRefreshTime = () => {
  const lastCheck = useAuthStore.getState().lastTokenCheck;
  const interval = useAuthStore.getState().tokenCheckInterval;
  
  if (!lastCheck) return 0;
  
  const timeSinceCheck = Date.now() - lastCheck;
  const timeUntilRefresh = interval - timeSinceCheck;
  
  return Math.max(0, timeUntilRefresh);
};

// Enhanced login with better error handling and background validation setup
export const enhancedLogin = async (email, password, rememberMe = false) => {
  const { login } = useAuthStore.getState();
  
  try {
    console.log('[AuthUtils] Enhanced login attempt...');
    const user = await login(email, password, rememberMe);
    
    // Start background validation if remember me is enabled
    if (rememberMe) {
      console.log('[AuthUtils] Starting background validation for remember me user');
      startBackgroundTokenValidation();
    }
    
    return { success: true, user };
  } catch (error) {
    console.error('[AuthUtils] Enhanced login failed:', error);
    
    let userMessage = 'Login failed. Please try again.';
    
    if (error.message.includes('Invalid credentials') || error.message.includes('Invalid email or password')) {
      userMessage = 'Invalid email or password.';
    } else if (error.response?.status === 429) {
      userMessage = 'Too many login attempts. Please try again later.';
    } else if (error.response?.status >= 500) {
      userMessage = 'Server error. Please try again later.';
    } else if (!navigator.onLine) {
      userMessage = 'No internet connection. Please check your connection and try again.';
    } else if (error.message) {
      userMessage = error.message;
    }
    
    return { success: false, error: userMessage };
  }
};

// Enhanced logout with cleanup
export const enhancedLogout = async () => {
  const { logout } = useAuthStore.getState();
  
  try {
    console.log('[AuthUtils] Enhanced logout...');
    
    // Stop background validation
    stopBackgroundTokenValidation();
    
    // Perform logout
    await logout();
    
    console.log('[AuthUtils] Enhanced logout completed');
    return { success: true };
  } catch (error) {
    console.error('[AuthUtils] Enhanced logout failed:', error);
    
    // Even if logout API fails, clear local data
    stopBackgroundTokenValidation();
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('remember_me');
    
    return { success: true, warning: 'Logged out locally but server logout may have failed' };
  }
};

// Check authentication status without triggering API calls
export const getAuthStatus = () => {
  const authStore = useAuthStore.getState();
  return {
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    hasRememberMe: localStorage.getItem('remember_me') === 'true',
    isInitialized: authStore.isInitialized,
    isLoading: authStore.isLoading
  };
};

// Graceful authentication check for protected routes
export const checkAuthForRoute = async (requireAuth = true) => {
  const authStore = useAuthStore.getState();
  
  // Initialize if not already done
  if (!authStore.isInitialized) {
    authStore.initialize();
  }

  // If route doesn't require auth, allow access
  if (!requireAuth) {
    return true;
  }

  // If user is authenticated and we have user data, allow access
  if (authStore.isAuthenticated && authStore.user) {
    return true;
  }

  // If we have tokens but no user data, try to load user
  if (authStore.token && !authStore.user) {
    try {
      await authStore.loadUser();
      return authStore.isAuthenticated;
    } catch (error) {
      console.warn('[AuthUtils] Failed to load user for route check:', error);
      return false;
    }
  }

  // No valid authentication
  return false;
};

// Initialize authentication utilities when app starts
export const initializeAuth = async () => {
  console.log('[AuthUtils] Initializing authentication...');
  
  try {
    // Check if auth store is already initialized
    const authStore = useAuthStore.getState();
    if (authStore.isInitialized) {
      console.log('[AuthUtils] Auth store already initialized, skipping...');
      return authStore.isAuthenticated;
    }
    
    // Restore session if applicable
    const sessionRestored = await restoreSession();
    console.log('[AuthUtils] Session restoration result:', sessionRestored);
    
    return sessionRestored;
  } catch (error) {
    console.error('[AuthUtils] Authentication initialization failed:', error);
    return false;
  }
};

// Cleanup when app unmounts
export const cleanupAuth = () => {
  console.log('[AuthUtils] Cleaning up authentication...');
  stopBackgroundTokenValidation();
};

export default {
  startBackgroundTokenValidation,
  stopBackgroundTokenValidation,
  shouldAutoLogin,
  restoreSession,
  getTokenRefreshTime,
  enhancedLogin,
  enhancedLogout,
  getAuthStatus,
  checkAuthForRoute,
  initializeAuth,
  cleanupAuth
};