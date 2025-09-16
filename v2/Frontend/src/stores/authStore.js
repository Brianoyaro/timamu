import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getApiUrl } from '../utils/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setTokens: (token, refreshToken) => set({ 
        token, 
        refreshToken,
        isAuthenticated: !!token 
      }),

      login: async (credentials) => {
        console.log('🔐 AuthStore: login() called with credentials:', { email: credentials.email, password: '[REDACTED]' });
        set({ isLoading: true });
        try {
          const apiUrl = `${getApiUrl()}/api/auth/login`;
          console.log('🔐 AuthStore: Making login request to:', apiUrl);
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });

          console.log('🔐 AuthStore: Login response status:', response.status);

          if (!response.ok) {
            const errorData = await response.text();
            console.error('🔐 AuthStore: Login failed with error:', errorData);
            throw new Error('Login failed');
          }

          const data = await response.json();
          console.log('🔐 AuthStore: Full response data:', data);
          console.log('🔐 AuthStore: Login successful, user data:', { 
            userId: data.data?.user?.id, 
            email: data.data?.user?.email,
            role: data.data?.user?.role,
            hasToken: !!data.data?.accessToken 
          });
          
          set({
            user: data.data.user,
            token: data.data.accessToken,
            refreshToken: data.data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

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
            const errorData = await response.text();
            console.error('📝 AuthStore: Registration failed with error:', errorData);
            throw new Error('Registration failed');
          }

          const data = await response.json();
          console.log('📝 AuthStore: Full response data:', data);
          console.log('📝 AuthStore: Registration successful, user data:', { 
            userId: data.data?.user?.id, 
            email: data.data?.user?.email,
            role: data.data?.user?.role,
            isVerified: data.data?.user?.isVerified
          });
          
          // Registration doesn't automatically log in - user needs to verify email first
          set({
            isLoading: false,
          });

          return data;
        } catch (error) {
          console.error('📝 AuthStore: Register error:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        console.log('🚪 AuthStore: logout() called');
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      refreshAccessToken: async () => {
        console.log('🔄 AuthStore: refreshAccessToken() called');
        const { refreshToken } = get();
        if (!refreshToken) {
          console.error('🔄 AuthStore: No refresh token available');
          throw new Error('No refresh token available');
        }

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
            const errorData = await response.text();
            console.error('🔄 AuthStore: Token refresh failed with error:', errorData);
            throw new Error('Token refresh failed');
          }

          const data = await response.json();
          console.log('🔄 AuthStore: Full response data:', data);
          console.log('🔄 AuthStore: Token refresh successful, new token received');
          
          set({
            token: data.data.accessToken,
            refreshToken: data.data.refreshToken,
          });

          return data.data.accessToken;
        } catch (error) {
          // If refresh fails, logout the user
          get().logout();
          throw error;
        }
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
          
          set({
            user: data.user,
            isLoading: false,
          });

          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
