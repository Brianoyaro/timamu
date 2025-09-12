import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Calendar,
  MessageCircle,
  FileText,
  Heart,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { activityService } from '../../services/activityService'
import { useToastStore } from '../../store/toastStore'
import { useTenantStore } from '../../store/tenantStore'

export function RecentActivityCard() {
  const { t } = useTranslation()
  const { addToast } = useToastStore()
  const { currentTenant } = useTenantStore()
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentActivity = async () => {
      // Wait for tenant to be loaded before making API calls
      if (!currentTenant) {
        return
      }

      try {
        setLoading(true)
        const activities = await activityService.getRecentActivity(6)
        setRecentActivity(activities)
      } catch (error) {
        console.error('Failed to fetch recent activity:', error)
        addToast({
          type: 'error',
          message: 'Failed to load recent activity'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRecentActivity()
  }, [addToast, currentTenant]) // Add currentTenant as dependency

  const getIcon = (iconType) => {
    switch (iconType) {
      case 'calendar':
        return Calendar
      case 'message':
        return MessageCircle
      case 'fileText':
        return FileText
      case 'heart':
        return Heart
      default:
        return FileText
    }
  }

  if (loading) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('dashboard.recentActivity')}
        </h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (recentActivity.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('dashboard.recentActivity')}
        </h2>
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            No recent activity to show
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('dashboard.recentActivity')}
      </h2>

      <div className="space-y-3">
        {recentActivity.map((activity) => {
          const IconComponent = getIcon(activity.icon)
          return (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className={`flex-shrink-0 ${activity.color}`}>
                <IconComponent className="h-5 w-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {format(activity.timestamp, 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 text-center">
        <button className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400">
          View all activity
        </button>
      </div>
    </div>
  )
}
