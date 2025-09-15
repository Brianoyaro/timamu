import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../ui/LoadingSpinner'

/**
 * Protected Route component that requires authentication
 * Redirects to sign in if user is not authenticated
 */
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, isInitialized, hasRole, user } = useAuthStore()
  const location = useLocation()

  // Show loading while auth store is initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to sign in if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />
  }

  // Check role-based access if required
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

/**
 * Public Route component that redirects authenticated users
 * Useful for auth pages that shouldn't be accessible when logged in
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuthStore()

  // Show loading while auth store is initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export { ProtectedRoute, PublicRoute }
