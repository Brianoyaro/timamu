import { useTenantStore } from '../store/tenantStore'
import { useAuthStore } from '../store/authStore'

const BASE_URL = import.meta.env.VITE_BACKEND_URL

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export class ApiService {
  // Determine which headers are needed based on the endpoint
  getRequiredHeaders(endpoint) {
    const { token, isAuthenticated } = useAuthStore.getState()
    const tenantHeaders = useTenantStore.getState().getTenantHeaders()
    
    const headers = {
      'Content-Type': 'application/json'
    }
    
    // Endpoints that don't require authentication
    const noAuthEndpoints = [
      '/auth/login',
      '/auth/register', 
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/refresh'
    ]
    
    // Endpoints that require both auth and tenant headers
    const tenantRequiredEndpoints = [
      '/users',
      '/sessions', 
      '/appointments',
      '/threads', // messaging
      '/assessments',
      '/mood-checkins'
    ]
    
    const needsAuth = !noAuthEndpoints.some(path => endpoint.startsWith(path))
    const needsTenant = tenantRequiredEndpoints.some(path => endpoint.startsWith(path))
    
    // Check if required auth is available
    if (needsAuth) {
      if (!token || !isAuthenticated) {
        throw new ApiError('Authentication required but no valid token available', 401)
      }
      headers.Authorization = `Bearer ${token}`
    }
    
    // Check if required tenant header is available
    if (needsTenant) {
      if (!tenantHeaders['x-tenant-id']) {
        throw new ApiError('Tenant context required but no tenant selected', 400)
      }
      Object.assign(headers, tenantHeaders)
    }
    
    return headers
  }

  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`
    const requiredHeaders = this.getRequiredHeaders(endpoint)
    
    const config = {
      headers: {
        ...requiredHeaders,
        ...options.headers // Allow override of headers
      },
      ...options
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        // If we get 401 and have a refresh token, try to refresh
        if (response.status === 401 && !endpoint.includes('/auth/')) {
          const { refreshToken, refreshAccessToken } = await import('../store/authStore').then(m => m.useAuthStore.getState())
          
          if (refreshToken && refreshAccessToken) {
            console.log('🔄 ApiService: Access token expired, attempting refresh...')
            const refreshSuccess = await refreshAccessToken()
            
            if (refreshSuccess) {
              console.log('✅ ApiService: Token refreshed, retrying request...')
              // Retry the request with new token
              const newHeaders = this.getRequiredHeaders(endpoint)
              const retryConfig = {
                ...config,
                headers: {
                  ...newHeaders,
                  ...options.headers
                }
              }
              
              const retryResponse = await fetch(url, retryConfig)
              if (retryResponse.ok) {
                const data = await retryResponse.json()
                return data
              }
            }
          }
        }
        
        const errorData = await response.json().catch(() => null)
        throw new ApiError(
          errorData?.message || `HTTP ${response.status}`,
          response.status,
          errorData
        )
      }

      // Handle no content responses
      if (response.status === 204) {
        return null
      }

      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      // Network or other errors
      throw new ApiError(
        error.message || 'Network error occurred',
        0
      )
    }
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return this.request(url, { method: 'GET' })
  }

  async post(endpoint, data = null) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null
    })
  }

  async put(endpoint, data = null) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : null
    })
  }

  async patch(endpoint, data = null) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : null
    })
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  // File upload with progress support
  async uploadFile(endpoint, file, onProgress = null) {
    const requiredHeaders = this.getRequiredHeaders(endpoint)
    
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch (error) {
            resolve(null)
          }
        } else {
          reject(new ApiError(`Upload failed: ${xhr.status}`, xhr.status))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new ApiError('Upload failed', 0))
      })

      xhr.open('POST', `${BASE_URL}${endpoint}`)
      
      // Set headers (excluding Content-Type for FormData)
      Object.entries(requiredHeaders).forEach(([key, value]) => {
        if (key !== 'Content-Type') { // FormData sets its own Content-Type
          xhr.setRequestHeader(key, value)
        }
      })

      xhr.send(formData)
    })
  }
}

export const apiService = new ApiService()
