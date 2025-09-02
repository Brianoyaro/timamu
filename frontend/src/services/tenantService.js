import { apiService } from './apiService'

export const tenantService = {
  async getTenants() {
    const response = await apiService.get('/tenants')
    return response.tenants || []
  },

  async getTenant(tenantId) {
    const response = await apiService.get(`/tenants/${tenantId}`)
    return response.tenant
  },

  async createTenant(tenantData) {
    const response = await apiService.post('/tenants', tenantData)
    return response.tenant
  },

  async updateTenant(tenantId, updates) {
    const response = await apiService.patch(`/tenants/${tenantId}`, updates)
    return response.tenant
  },

  async deleteTenant(tenantId) {
    await apiService.delete(`/tenants/${tenantId}`)
  },

  async getTenantUsers(tenantId, filters = {}) {
    const response = await apiService.get(`/tenants/${tenantId}/users`, filters)
    return response.users || []
  },

  async getTenantSettings(tenantId) {
    const response = await apiService.get(`/tenants/${tenantId}/settings`)
    return response.settings
  },

  async updateTenantSettings(tenantId, settings) {
    const response = await apiService.patch(`/tenants/${tenantId}/settings`, settings)
    return response.settings
  }
}
