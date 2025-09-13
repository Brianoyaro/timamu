import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

/**
 * ProtectedRoute component for handling authentication and authorization
 * Redirects to login if not authenticated, shows error if insufficient permissions
 */
export function ProtectedRoute({ children, requiredRole = null, requiredPermissions = [] }) {
  const location = useLocation()
  const { isAuthenticated, user, hasRole, hasPermission, isLoading } = useAuthStore()

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/auth/signin" 
        state={{ from: location }} 
        replace 
      />
    )
  }

  // Check role-based access
  if (requiredRole && !hasRole(requiredRole)) {
    return <ForbiddenPage />
  }

  // Check permission-based access
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      hasPermission(permission)
    )
    
    if (!hasAllPermissions) {
      return <ForbiddenPage />
    }
  }

  // User is authenticated and authorized
  return children
}

/**
 * Forbidden access page
 */
function ForbiddenPage() {
  const { user } = useAuthStore()
  
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
        
        <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
        
        <p className="text-muted-foreground">
          You don't have permission to access this page. 
          {user?.role && (
            <span className="block mt-2">
              Current role: <span className="font-medium">{user.role}</span>
            </span>
          )}
        </p>
        
        <div className="space-x-2 pt-4">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
