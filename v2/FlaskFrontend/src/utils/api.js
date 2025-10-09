import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log(`[DEBUG API] Request to: ${config.url}`);
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log(`[DEBUG API] Token attached to request: ${token.substring(0, 20)}...`);
    } else {
      console.warn(`[DEBUG API] No token found in localStorage for request to ${config.url}`);
    }
    
    console.log(`[DEBUG API] Request headers:`, config.headers);
    if (config.data) {
      console.log(`[DEBUG API] Request data:`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error(`[DEBUG API] Request interceptor error:`, error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log(`[DEBUG API] Response from ${response.config.url}:`, {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error(`[DEBUG API] Error in response from ${originalRequest?.url}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn(`[DEBUG API] 401 Unauthorized error detected for ${originalRequest.url}`);
      originalRequest._retry = true;
      
      // Try to refresh the token first
      const currentToken = localStorage.getItem('token');
      if (currentToken && !originalRequest.url.includes('/auth/verify') && !originalRequest.url.includes('/auth/me')) {
        try {
          console.log(`[DEBUG API] Attempting to refresh token...`);
          const refreshResponse = await api.post('/auth/refresh', { refresh_token: currentToken });
          const { access_token } = refreshResponse.data;
          
          // Update token in localStorage
          localStorage.setItem('token', access_token);
          
          // Update the original request with new token
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
          
          // Retry the original request
          console.log(`[DEBUG API] Token refreshed successfully, retrying original request...`);
          return api(originalRequest);
        } catch (refreshError) {
          console.error(`[DEBUG API] Token refresh failed:`, refreshError);
          // If refresh fails, clear token and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No token or this is already a verify/me request failing, redirect to login
        console.log(`[DEBUG API] No token available or auth request failed, redirecting to login page`);
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }
    
    // Handle 403 Forbidden errors (insufficient permissions)
    if (error.response?.status === 403) {
      console.warn(`[DEBUG API] 403 Forbidden error detected for ${originalRequest.url}. User might not have the right role.`);
    }
    
    // Handle server errors
    if (error.response?.status >= 500) {
      console.error(`[DEBUG API] Server error ${error.response.status} for ${originalRequest.url}`);
    }

    return Promise.reject(error);
  }
);

export default api;