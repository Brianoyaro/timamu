import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/password', data),
  deleteAccount: () => api.delete('/users/account'),
};

// Therapists API
export const therapistsAPI = {
  getAll: (params) => api.get('/therapists', { params }),
  getById: (id) => api.get(`/therapists/${id}`),
  getMyProfile: () => api.get('/therapists/me'),
  updateProfile: (data) => api.put('/therapists/me', data),
  updateAvailability: (data) => api.put('/therapists/availability', data),
};

// Bookings API
export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  cancel: (id) => api.post(`/bookings/${id}/cancel`),
};

// Sessions API
export const sessionsAPI = {
  start: (bookingId) => api.post(`/sessions/${bookingId}/start`),
  getToken: (bookingId) => api.get(`/sessions/${bookingId}/token`),
  end: (bookingId) => api.post(`/sessions/${bookingId}/end`),
  getDetails: (bookingId) => api.get(`/sessions/${bookingId}`),
};

// Admin API
export const adminAPI = {
  getMetrics: () => api.get('/admin/metrics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getTherapists: (params) => api.get('/admin/therapists', { params }),
  updateTherapistApproval: (therapistId, data) =>
    api.put(`/admin/therapists/${therapistId}/approval`, data),
  getBookings: (params) => api.get('/admin/bookings', { params }),
};

export default api;
