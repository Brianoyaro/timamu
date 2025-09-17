/**
 * API utilities for handling environment-aware URL configuration and authentication
 */

// Helper function to get the correct API URL
export const getApiUrl = () => {
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  return isProduction 
    ? (import.meta.env.VITE_API_URL || 'https://timamu-v2-backend.onrender.com')
    : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
};

// Helper function to get the correct Socket.IO URL
export const getSocketUrl = () => {
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  return isProduction 
    ? (import.meta.env.VITE_SOCKET_URL || 'https://timamu-v2-backend.onrender.com')
    : (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000');
};

// Track ongoing refresh to prevent multiple attempts
let refreshPromise = null;

// Enhanced fetch wrapper with automatic token refresh
export const fetchWithAuth = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${getApiUrl()}${endpoint}`;
  
  // Dynamic import to avoid circular dependency
  const useAuthStore = (await import('../stores/authStore')).default;
  const { token, refreshAccessToken, logout } = useAuthStore.getState();
  
  const makeRequest = async (accessToken) => {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers,
      },
      ...options,
    };

    return fetch(url, config);
  };

  try {
    // Try the initial request
    let response = await makeRequest(token);
    
    // If 401 and we have a refresh token, try to refresh
    if (response.status === 401 && !options.skipTokenRefresh) {
      console.log('🔄 API: Received 401, attempting token refresh...');
      
      try {
        // Prevent multiple concurrent refresh attempts
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        
        const newToken = await refreshPromise;
        console.log('🔄 API: Token refreshed successfully, retrying request...');
        
        // Retry the original request with new token
        response = await makeRequest(newToken);
        
        // If still 401 after refresh, logout user
        if (response.status === 401) {
          console.error('🔄 API: Still 401 after refresh, logging out user');
          logout();
          throw new Error('Authentication failed');
        }
        
      } catch (refreshError) {
        console.error('🔄 API: Token refresh failed:', refreshError);
        logout();
        throw new Error('Session expired. Please login again.');
      }
    }
    
    return response;
  } catch (error) {
    // Network or other errors
    console.error('🔄 API: Request failed:', error);
    throw error;
  }
};

// Convenience methods for common HTTP verbs
export const api = {
  get: (endpoint, options = {}) => 
    fetchWithAuth(endpoint, { ...options, method: 'GET' }),
    
  post: (endpoint, data, options = {}) => 
    fetchWithAuth(endpoint, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    
  put: (endpoint, data, options = {}) => 
    fetchWithAuth(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
    
  delete: (endpoint, options = {}) => 
    fetchWithAuth(endpoint, { ...options, method: 'DELETE' }),
    
  patch: (endpoint, data, options = {}) => 
    fetchWithAuth(endpoint, { 
      ...options, 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    })
};

// Response handler utility
export const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      message: `HTTP ${response.status}: ${response.statusText}` 
    }));
    throw new Error(errorData.message || 'An error occurred');
  }
  
  return response.json();
};
