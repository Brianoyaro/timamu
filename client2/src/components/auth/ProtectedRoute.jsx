import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitialized } = useAuthStore()
  const location = useLocation()

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />
  }

  return children
}
