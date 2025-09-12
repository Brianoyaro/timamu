import React, { useState, useEffect } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { Sidebar } from '../components/layout/Sidebar'
import { MobileTabBar } from '../components/layout/MobileTabBar'
import { CrisisButton } from '../components/crisis/CrisisButton'
import { useTenantStore } from '../store/tenantStore'
import { useAuthStore } from '../store/authStore'

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { tenantId } = useParams()
  const { loadTenants, setCurrentTenant, tenants } = useTenantStore()
  const { user } = useAuthStore()

  useEffect(() => {
    // Simple approach: if user has tenantId, set it directly
    if (user?.tenantId && !useTenantStore.getState().currentTenant) {
      setCurrentTenant({ id: user.tenantId, name: 'Current Tenant' })
    }
    
    // Load tenants and set current tenant
    const loadAndSetTenant = async () => {
      try {
        await loadTenants()
        // Get fresh tenants from the store after loading
        const currentTenants = useTenantStore.getState().tenants
        
        // Handle 'default' tenant case or find tenant by ID
        let targetTenant
        if (tenantId === 'default' || !tenantId) {
          // If tenantId is 'default' or missing, use user's tenantId or first available tenant
          targetTenant = currentTenants.find(t => t.id === user?.tenantId) || currentTenants[0]
        } else {
          targetTenant = currentTenants.find(t => t.id === tenantId)
        }
        
        // Fallback: if no tenant found by ID, use user's tenant or first available
        if (!targetTenant && currentTenants.length > 0) {
          targetTenant = currentTenants.find(t => t.id === user?.tenantId) || currentTenants[0]
        }
        
        if (targetTenant) {
          setCurrentTenant(targetTenant)
        }
      } catch (error) {
        console.error('Failed to load and set tenant:', error)
        // If tenant loading fails, try to set from user's tenantId
        if (user?.tenantId) {
          setCurrentTenant({ id: user.tenantId, name: 'Default' })
        }
      }
    }

    // Only load tenants if user is authenticated
    if (user) {
      loadAndSetTenant()
    }
  }, [tenantId, user?.tenantId, user, loadTenants, setCurrentTenant])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only fixed top-4 left-4 z-50 bg-primary-600 text-white px-4 py-2 rounded-lg"
      >
        Skip to main content
      </a>

      {/* Header */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64">
            <Sidebar />
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div 
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <main 
            id="main-content"
            className="flex-1 relative z-0 focus:outline-none pb-16 lg:pb-0"
            tabIndex={-1}
          >
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="lg:hidden">
        <MobileTabBar />
      </div>

      {/* Crisis button - always visible */}
      <CrisisButton />
    </div>
  )
}
