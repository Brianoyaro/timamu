/**
 * API Service for making HTTP requests to the backend
 * Handles authentication, error handling, and request/response interceptors
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'

/**
 * Custom error class for API errors
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
 * API Service class
 */
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  /**
   * Get authorization header with access token
   */
  getAuthHeader() {
    // Get token from auth store if available
    // This will be set by the auth service when needed
    if (typeof window !== 'undefined' && window.__authToken) {
      return { Authorization: `Bearer ${window.__authToken}` }
    }
    return {}
  }

  /**
   * Make HTTP request with error handling
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
      credentials: 'include', // Include cookies for CORS
      ...options,
    }

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`)
      
      const response = await fetch(url, config)
      
      // Handle different content types
      let data
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      console.log(`📡 API Response: ${response.status}`, data)

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `HTTP ${response.status}`
        throw new ApiError(errorMessage, response.status, data)
      }

      return data
    } catch (error) {
      console.error(`❌ API Error: ${options.method || 'GET'} ${url}`, error)

      if (error instanceof ApiError) {
        throw error
      }

      // Network or other errors
      throw new ApiError(
        error.message || 'Network error occurred',
        0,
        null
      )
    }
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options,
    })
  }

  /**
   * POST request
   */
  async post(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
      ...options,
    })
  }

  /**
   * PUT request
   */
  async put(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
      ...options,
    })
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : null,
      ...options,
    })
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options,
    })
  }

  /**
   * Upload file
   */
  async upload(endpoint, formData, options = {}) {
    const config = {
      method: 'POST',
      body: formData,
      headers: {
        ...this.getAuthHeader(),
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      credentials: 'include',
      ...options,
    }

    return this.request(endpoint, config)
  }
}

// Export singleton instance
export const apiService = new ApiService()
export { ApiError }
