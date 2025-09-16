/**
 * API utilities for handling environment-aware URL configuration
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

// Create fetch wrapper with authentication
export const fetchWithAuth = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${getApiUrl()}${endpoint}`;
  
  // Get token from localStorage or wherever it's stored
  const token = localStorage.getItem('auth-storage') ? 
    JSON.parse(localStorage.getItem('auth-storage')).state?.token : null;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  return fetch(url, config);
};
