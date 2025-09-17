import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getApiUrl } from '../utils/api';

// Secure token storage utilities
const STORAGE_KEYS = {
  REFRESH_TOKEN: 'timamu_refresh_token',
  USER_PROFILE: 'timamu_user_profile'
};

const secureStorage = {
  setRefreshToken: (token, rememberMe = false) => {
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    }
  },
  
  getRefreshToken: () => {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || 
           sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
  
  removeRefreshToken: () => {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
  
  setUserProfile: (user) => {
    // Only store minimal, non-sensitive user data
    const minimalUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified
    };
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(minimalUser));
  },
  
  getUserProfile: () => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return stored ? JSON.parse(stored) : null;
  },
  
  removeUserProfile: () => {
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  }
};

const useAuthStore = create((set, get) => ({
  user: secureStorage.getUserProfile(),
  token: null, // Never persisted - always in memory
  isAuthenticated: !!secureStorage.getRefreshToken(),
  isLoading: false,
  tokenRefreshPromise: null, // Prevent multiple refresh attempts

  // Actions
  setUser: (user) => {
    const minimalUser = user ? {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified
    } : null;
    
    set({ user: minimalUser, isAuthenticated: !!user });
    
    if (user) {
      secureStorage.setUserProfile(user);
    } else {
      secureStorage.removeUserProfile();
    }
  },
  
  setTokens: (token, refreshToken, rememberMe = false) => {
    set({ token, isAuthenticated: !!token });
    
    if (refreshToken) {
      secureStorage.setRefreshToken(refreshToken, rememberMe);
    }
  },

  login: async (credentials, rememberMe = false) => {
    console.log('🔐 AuthStore: login() called with credentials:', { 
      email: credentials.email, 
      password: '[REDACTED]',
      rememberMe 
    });
    set({ isLoading: true });
    try {
      const apiUrl = `${getApiUrl()}/api/auth/login`;
      console.log('🔐 AuthStore: Making login request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        }),
      });

      console.log('🔐 AuthStore: Login response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        console.error('🔐 AuthStore: Login failed with error:', errorData);
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      console.log('🔐 AuthStore: Login successful, user data:', { 
        userId: data.data?.user?.id, 
        email: data.data?.user?.email,
        role: data.data?.user?.role,
        hasToken: !!data.data?.accessToken 
      });
      
      // Store tokens securely
      get().setTokens(data.data.accessToken, data.data.refreshToken, rememberMe);
      get().setUser(data.data.user);
      
      set({ isLoading: false });
      return data.data;
    } catch (error) {
      console.error('🔐 AuthStore: Login error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

      register: async (userData) => {
        console.log('📝 AuthStore: register() called with userData:', { 
          firstName: userData.firstName, 
          lastName: userData.lastName,
          email: userData.email, 
          role: userData.role,
          password: '[REDACTED]' 
        });
        set({ isLoading: true });
        try {
          const apiUrl = `${getApiUrl()}/api/auth/register`;
          console.log('📝 AuthStore: Making register request to:', apiUrl);
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });

          console.log('📝 AuthStore: Register response status:', response.status);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
            console.error('📝 AuthStore: Registration failed with error:', errorData);
            throw new Error(errorData.message || 'Registration failed');
          }

          const data = await response.json();
          console.log('📝 AuthStore: Registration successful');
          
          set({ isLoading: false });
          return data;
        } catch (error) {
          console.error('📝 AuthStore: Register error:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        console.log('🚪 AuthStore: logout() called');
        
        // Attempt to revoke refresh token on server
        const refreshToken = secureStorage.getRefreshToken();
        if (refreshToken) {
          try {
            await fetch(`${getApiUrl()}/api/auth/logout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-refresh-token': refreshToken
              }
            });
          } catch (error) {
            console.warn('Failed to revoke token on server:', error);
          }
        }
        
        // Clear all stored data
        secureStorage.removeRefreshToken();
        secureStorage.removeUserProfile();
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          tokenRefreshPromise: null
        });
      },

      refreshAccessToken: async () => {
        console.log('🔄 AuthStore: refreshAccessToken() called');
        
        // Prevent multiple concurrent refresh attempts
        const { tokenRefreshPromise } = get();
        if (tokenRefreshPromise) {
          console.log('🔄 AuthStore: Refresh already in progress, waiting...');
          return tokenRefreshPromise;
        }
        
        const refreshToken = secureStorage.getRefreshToken();
        if (!refreshToken) {
          console.error('🔄 AuthStore: No refresh token available');
          get().logout();
          throw new Error('No refresh token available');
        }

        const refreshPromise = (async () => {
          try {
            const apiUrl = `${getApiUrl()}/api/auth/refresh`;
            console.log('🔄 AuthStore: Making refresh request to:', apiUrl);
            
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refreshToken }),
            });

            console.log('🔄 AuthStore: Refresh response status:', response.status);

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ message: 'Token refresh failed' }));
              console.error('🔄 AuthStore: Token refresh failed:', errorData);
              throw new Error(errorData.message || 'Token refresh failed');
            }

            const data = await response.json();
            console.log('🔄 AuthStore: Token refresh successful');
            
            // Update tokens
            const isRemembered = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            get().setTokens(data.data.accessToken, data.data.refreshToken, !!isRemembered);
            
            set({ tokenRefreshPromise: null });
            return data.data.accessToken;
          } catch (error) {
            set({ tokenRefreshPromise: null });
            // If refresh fails, logout the user
            get().logout();
            throw error;
          }
        })();
        
        set({ tokenRefreshPromise: refreshPromise });
        return refreshPromise;
      },

      updateProfile: async (profileData) => {
        const { token } = get();
        set({ isLoading: true });
        
        try {
          const response = await fetch(`${getApiUrl()}/api/users/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(profileData),
          });

          if (!response.ok) {
            throw new Error('Profile update failed');
          }

          const data = await response.json();
          
          get().setUser(data.data.user);
          set({ isLoading: false });

          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Initialize auth state on app load
      initializeAuth: () => {
        const user = secureStorage.getUserProfile();
        const hasRefreshToken = !!secureStorage.getRefreshToken();
        
        set({
          user,
          isAuthenticated: hasRefreshToken,
          token: null // Will be set when first API call is made
        });
        
        console.log('🔐 AuthStore: Initialized with stored user:', !!user);
      }
    }));

export default useAuthStore;
