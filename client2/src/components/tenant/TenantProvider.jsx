import React, { createContext, useContext, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTenantStore } from '@/stores/tenantStore'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

const TenantContext = createContext({})

/**
 * TenantProvider component for managing tenant context
 * Loads tenant information based on URL parameter
 */
export function TenantProvider({ children }) {
  const { tenantId } = useParams()
  const { 
    currentTenant, 
    isLoading, 
    error, 
    loadTenant, 
    clearTenant 
  } = useTenantStore()

  useEffect(() => {
    if (tenantId) {
      loadTenant(tenantId)
    } else {
      clearTenant()
    }
  }, [tenantId, loadTenant, clearTenant])

  // Show loading while tenant is being loaded
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    )
  }

  // Show error if tenant loading failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-destructive" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-foreground">Workspace Not Found</h2>
          
          <p className="text-muted-foreground">
            {error.message || 'The workspace you\'re trying to access doesn\'t exist or you don\'t have permission to view it.'}
          </p>
          
          <div className="space-x-2 pt-4">
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show message if no tenant is found
  if (!currentTenant && tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-muted-foreground">Workspace Not Available</h2>
          <p className="text-muted-foreground">
            The workspace "{tenantId}" is not available.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  // Provide tenant context to children
  const contextValue = {
    tenant: currentTenant,
    tenantId,
    isLoading,
    error,
  }

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  )
}

/**
 * Hook to use tenant context
 */
export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}
