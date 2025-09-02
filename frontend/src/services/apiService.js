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
  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`
    const { token } = useAuthStore.getState()
    const tenantHeaders = useTenantStore.getState().getTenantHeaders()
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...tenantHeaders,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
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
    const { token } = useAuthStore.getState()
    const tenantHeaders = useTenantStore.getState().getTenantHeaders()
    
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
      
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }
      
      Object.entries(tenantHeaders).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value)
      })

      xhr.send(formData)
    })
  }
}

export const apiService = new ApiService()
