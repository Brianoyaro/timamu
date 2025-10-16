import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Enhanced request interceptor with smart token management
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

// Smart response interceptor with intelligent error handling and automatic token refresh
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

    // Handle 401 Unauthorized errors - smart token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn(`[DEBUG API] 401 Unauthorized error detected for ${originalRequest.url}`);
      originalRequest._retry = true;
      
      // Only try refresh if we have a refresh token and this isn't already an auth endpoint
      const refreshToken = localStorage.getItem('refresh_token');
      const isAuthEndpoint = originalRequest.url.includes('/auth/');
      
      if (refreshToken && !isAuthEndpoint) {
        try {
          console.log(`[DEBUG API] Attempting to refresh token...`);
          const refreshResponse = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`, 
            { refresh_token: refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );
          
          const { access_token, refresh_token: newRefreshToken } = refreshResponse.data;
          
          // Update tokens in localStorage
          localStorage.setItem('token', access_token);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }
          
          // Update the original request with new token
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
          
          // Retry the original request
          console.log(`[DEBUG API] Token refreshed successfully, retrying original request...`);
          return api(originalRequest);
        } catch (refreshError) {
          console.error(`[DEBUG API] Token refresh failed:`, refreshError);
          
          // Only clear tokens on actual auth failures (not network errors)
          if (refreshError.response?.status === 401 || refreshError.response?.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            console.log(`[DEBUG API] Auth tokens cleared due to refresh failure`);
          }
        }
      } else if (!refreshToken) {
        console.log(`[DEBUG API] No refresh token available for retry`);
      }
    }
    
    // Handle other errors gracefully without clearing auth state
    if (error.response?.status === 403) {
      console.warn(`[DEBUG API] 403 Forbidden error detected for ${originalRequest.url}. User might not have sufficient privileges.`);
    }
    
    if (error.response?.status >= 500) {
      console.error(`[DEBUG API] Server error ${error.response.status} for ${originalRequest.url}`);
    }

    // Handle network errors
    if (!error.response) {
      console.error(`[DEBUG API] Network error for ${originalRequest.url}:`, error.message);
    }

    return Promise.reject(error);
  }
);

export default api;