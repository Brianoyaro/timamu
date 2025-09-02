import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { analyticsService } from '../services/analyticsService'
import { PatientDashboard } from '../components/dashboard/PatientDashboard'
import { TherapistDashboard } from '../components/dashboard/TherapistDashboard'
import { AdminDashboard } from '../components/dashboard/AdminDashboard'

export function DashboardPage() {
  const { t } = useTranslation()
  const { user, hasRole } = useAuthStore()

  useEffect(() => {
    analyticsService.page('Dashboard')
  }, [])

  const renderDashboard = () => {
    if (hasRole('admin')) {
      return <AdminDashboard />
    } else if (hasRole('therapist')) {
      return <TherapistDashboard />
    } else {
      return <PatientDashboard />
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.welcome')}, {user?.name}
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {renderDashboard()}
    </div>
  )
}
