import { useAuthStore } from '@/stores/authStore'
import { useTenantStore } from '@/stores/tenantStore'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/**
 * API Service class for making HTTP requests
 * Handles authentication, tenant context, and error handling
 */
class ApiService {
  /**
   * Get request headers including auth and tenant info
   * @param {Object} additionalHeaders - Additional headers to include
   * @returns {Object} Headers object
   */
  getHeaders(additionalHeaders = {}) {
    const authHeaders = useAuthStore.getState().getAuthHeaders()
    const tenantHeaders = useTenantStore.getState().getTenantHeaders()
    
    return {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...tenantHeaders,
      ...additionalHeaders,
    }
  }

  /**
   * Make HTTP request with error handling
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} Response data
   */
  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`
    const config = {
      headers: this.getHeaders(options.headers),
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type')
      let data = null
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (!response.ok) {
        throw new ApiError(
          data?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data
        )
      }

      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      // Network or other errors
      throw new ApiError(
        error.message || 'Network error occurred',
        0,
        error
      )
    }
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<any>} Response data
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    
    return this.request(url, {
      method: 'GET',
    })
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, data = null) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
    })
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @returns {Promise<any>} Response data
   */
  async put(endpoint, data = null) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
    })
  }

  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @returns {Promise<any>} Response data
   */
  async patch(endpoint, data = null) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : null,
    })
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<any>} Response data
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    })
  }

  /**
   * Upload file
   * @param {string} endpoint - API endpoint
   * @param {File} file - File to upload
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<any>} Response data
   */
  async uploadFile(endpoint, file, onProgress = null) {
    const formData = new FormData()
    formData.append('file', file)

    const authHeaders = useAuthStore.getState().getAuthHeaders()
    const tenantHeaders = useTenantStore.getState().getTenantHeaders()

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100
            onProgress(percentComplete)
          }
        })
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            resolve(data)
          } catch (error) {
            resolve(xhr.responseText)
          }
        } else {
          reject(new ApiError(`Upload failed: ${xhr.statusText}`, xhr.status))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new ApiError('Upload failed: Network error', 0))
      })

      xhr.open('POST', `${BASE_URL}${endpoint}`)
      
      // Set headers
      Object.entries({ ...authHeaders, ...tenantHeaders }).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value)
      })

      xhr.send(formData)
    })
  }
}

// Export singleton instance
export const apiService = new ApiService()
export { ApiError }
