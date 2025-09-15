import React from 'react'
import { useAuthStore } from '../../store/authStore'
import PatientDashboard from './PatientDashboard'
import TherapistDashboard from './TherapistDashboard'
import AdminDashboard from './AdminDashboard'
import LoadingSpinner from '../ui/LoadingSpinner'

/**
 * Main Dashboard component that renders role-specific dashboards
 * Routes users to appropriate dashboard based on their role
 */
const Dashboard = () => {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Unable to load dashboard. Please sign in again.</p>
      </div>
    )
  }

  // Determine which dashboard to show based on user roles
  const getUserDashboard = () => {
    const roles = user.roles || []

    // Admin has highest priority
    if (roles.includes('admin')) {
      return <AdminDashboard />
    }

    // Then therapist
    if (roles.includes('therapist')) {
      return <TherapistDashboard />
    }

    // Default to patient dashboard
    return <PatientDashboard />
  }

  return (
    <div className="max-w-7xl mx-auto">
      {getUserDashboard()}
    </div>
  )
}

export default Dashboard
