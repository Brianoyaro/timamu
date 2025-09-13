import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Tenant store for multi-tenant application
 * Manages current tenant context and tenant-related data
 */
export const useTenantStore = create(
  persist(
    (set, get) => ({
      // State
      currentTenant: null,
      tenants: [],
      isLoading: false,

      // Actions
      /**
       * Set current tenant
       * @param {Object} tenant - Tenant object
       */
      setCurrentTenant: (tenant) => {
        set({ currentTenant: tenant })
      },

      /**
       * Set available tenants list
       * @param {Array} tenantsList - Array of tenant objects
       */
      setTenants: (tenantsList) => {
        set({ tenants: tenantsList })
      },

      /**
       * Add or update a tenant in the list
       * @param {Object} tenant - Tenant object to add/update
       */
      updateTenant: (tenant) => {
        const tenants = get().tenants
        const existingIndex = tenants.findIndex(t => t.id === tenant.id)
        
        if (existingIndex >= 0) {
          const updatedTenants = [...tenants]
          updatedTenants[existingIndex] = { ...updatedTenants[existingIndex], ...tenant }
          set({ tenants: updatedTenants })
        } else {
          set({ tenants: [...tenants, tenant] })
        }
      },

      /**
       * Set loading state
       * @param {boolean} loading - Loading state
       */
      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      /**
       * Get tenant headers for API calls
       * @returns {Object} Headers object with tenant info
       */
      getTenantHeaders: () => {
        const currentTenant = get().currentTenant
        return currentTenant ? { 'X-Tenant-ID': currentTenant.id } : {}
      },

      /**
       * Clear tenant data
       */
      clearTenantData: () => {
        set({
          currentTenant: null,
          tenants: [],
        })
      },
    }),
    {
      name: 'tenant-storage', // Persist to localStorage
      partialize: (state) => ({
        currentTenant: state.currentTenant,
        tenants: state.tenants,
      }),
    }
  )
)
