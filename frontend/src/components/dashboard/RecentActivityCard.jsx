import React from 'react'
import { useTranslation } from 'react-i18next'
import { 
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

export function RecentActivityCard() {
  const { t } = useTranslation()

  // Mock recent activity data - replace with real API call
  const recentActivity = [
    {
      id: '1',
      type: 'session',
      icon: CalendarIcon,
      title: 'Session with Dr. Sarah Johnson',
      description: 'Completed therapy session',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      color: 'text-primary-600'
    },
    {
      id: '2',
      type: 'message',
      icon: ChatBubbleLeftRightIcon,
      title: 'New message from Dr. Johnson',
      description: 'Follow-up resources shared',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      color: 'text-therapeutic-600'
    },
    {
      id: '3',
      type: 'assessment',
      icon: DocumentTextIcon,
      title: 'PHQ-9 Assessment',
      description: 'Score: 8 (Mild depression)',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      color: 'text-yellow-600'
    },
    {
      id: '4',
      type: 'mood',
      icon: HeartIcon,
      title: 'Mood Check-in',
      description: 'Feeling good (4/5)',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      color: 'text-green-600'
    }
  ]

  if (recentActivity.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('dashboard.recentActivity')}
        </h2>
        <div className="text-center py-8">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
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
        {recentActivity.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className={`flex-shrink-0 ${activity.color}`}>
              <activity.icon className="h-5 w-5" />
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
        ))}
      </div>

      <div className="mt-4 text-center">
        <button className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400">
          View all activity
        </button>
      </div>
    </div>
  )
}
