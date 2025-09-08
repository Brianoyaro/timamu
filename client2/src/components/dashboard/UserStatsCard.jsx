import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  UserGroupIcon,
  ArrowRightIcon,
  TrendingUpIcon
} from '@heroicons/react/24/outline'

export function UserStatsCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tenantId } = useParams()

  // Mock user stats - replace with real API call
  const userStats = {
    totalUsers: 1247,
    newUsersThisMonth: 89,
    activeUsers: 892,
    therapists: 156,
    patients: 1091,
    growthRate: 12.5
  }

  const handleViewUsers = () => {
    navigate(`/t/${tenantId}/admin/users`)
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <UserGroupIcon className="h-5 w-5 mr-2" />
          User Statistics
        </h2>
        
        <button
          onClick={handleViewUsers}
          className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 flex items-center"
        >
          Manage
          <ArrowRightIcon className="h-4 w-4 ml-1" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {userStats.therapists}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Therapists
            </p>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {userStats.patients.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Patients
            </p>
          </div>
        </div>

        <div className="p-3 bg-primary-50 dark:bg-primary-900 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-800 dark:text-primary-200">
                Active Users
              </p>
              <p className="text-lg font-bold text-primary-900 dark:text-primary-100">
                {userStats.activeUsers.toLocaleString()}
              </p>
            </div>
            <TrendingUpIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
        </div>

        <div className="p-3 bg-green-50 dark:bg-green-900 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>+{userStats.newUsersThisMonth}</strong> new users this month
          </p>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            {userStats.growthRate}% growth rate
          </p>
        </div>
      </div>
    </div>
  )
}
