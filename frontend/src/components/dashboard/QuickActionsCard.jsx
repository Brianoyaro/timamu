import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  Calendar,
  MessageCircle,
  BookOpen,
  Heart
} from 'lucide-react'

export function QuickActionsCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tenantId } = useParams() // what if we instead get req.user.tenantId instead so ass to go round the possibility of tenantId being 'default' from AppRoutes.jsx routing?

  const quickActions = [
    {
      name: 'Schedule',
      icon: Calendar,
      path: '/schedule',
      color: 'primary'
    },
    {
      name: 'Messages',
      icon: MessageCircle,
      path: '/messages',
      color: 'therapeutic'
    },
    {
      name: 'Resources',
      icon: BookOpen,
      path: '/resources',
      color: 'primary'
    },
    {
      name: 'Mood Check',
      icon: Heart,
      action: 'moodCheckin',
      color: 'therapeutic'
    }
  ]

  const handleAction = (action) => {
    if (action.path) {
      navigate(`/t/${tenantId}${action.path}`)
    } else if (action.action === 'moodCheckin') {
      // Open mood check-in modal
      console.log('Open mood check-in modal') // mood check-in modal is nect component after this component. How may we render it? Or even better, what if we remove this icon to reduce redundancy? !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('dashboard.quickActions')}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.name}
            onClick={() => handleAction(action)}
            className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <action.icon className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 mx-auto" />
            <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {action.name}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
