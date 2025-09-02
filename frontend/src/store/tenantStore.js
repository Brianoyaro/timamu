import { create } from 'zustand'
import { tenantService } from '../services/tenantService'

export const useTenantStore = create((set, get) => ({
  currentTenant: null,
  tenants: [],
  isLoading: false,

  setCurrentTenant: (tenant) => {
    set({ currentTenant: tenant })
    localStorage.setItem('mindlink_current_tenant', JSON.stringify(tenant))
  },

  loadTenants: async () => {
    set({ isLoading: true })
    try {
      const tenants = await tenantService.getTenants()
      set({ tenants, isLoading: false })
      
      // Set current tenant from localStorage or first available
      const savedTenant = localStorage.getItem('mindlink_current_tenant')
      if (savedTenant) {
        const tenant = JSON.parse(savedTenant)
        const validTenant = tenants.find(t => t.id === tenant.id)
        if (validTenant) {
          set({ currentTenant: validTenant })
        }
      } else if (tenants.length > 0) {
        get().setCurrentTenant(tenants[0])
      }
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to load tenants:', error)
    }
  },

  getTenantHeaders: () => {
    const { currentTenant } = get()
    return currentTenant ? { 'x-tenant-id': currentTenant.id } : {}
  }
}))
