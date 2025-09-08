import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  BuildingOfficeIcon,
  ArrowRightIcon,
  UserGroupIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

export function TenantOverviewCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tenantId } = useParams()

  // Mock tenant stats - replace with real API call
  const tenantStats = {
    totalTenants: 12,
    activeTenants: 10,
    totalUsers: 1247,
    activeSessions: 23,
    monthlyGrowth: 15.3
  }

  const handleViewTenants = () => {
    navigate(`/t/${tenantId}/admin/tenants`)
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <BuildingOfficeIcon className="h-5 w-5 mr-2" />
          Tenant Overview
        </h2>
        
        <button
          onClick={handleViewTenants}
          className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 flex items-center"
        >
          View all
          <ArrowRightIcon className="h-4 w-4 ml-1" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {tenantStats.totalTenants}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Tenants
          </p>
        </div>

        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {tenantStats.activeTenants}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Active Tenants
          </p>
        </div>

        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {tenantStats.totalUsers.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Users
          </p>
        </div>

        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {tenantStats.activeSessions}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Active Sessions
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 rounded-lg">
        <p className="text-sm text-green-800 dark:text-green-200">
          <strong>+{tenantStats.monthlyGrowth}%</strong> growth this month
        </p>
      </div>
    </div>
  )
}
