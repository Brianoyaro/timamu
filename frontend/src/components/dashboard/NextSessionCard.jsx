import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  CalendarIcon, 
  ClockIcon, 
  VideoIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { format, isToday, isTomorrow } from 'date-fns'

export function NextSessionCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tenantId } = useParams()

  // Mock next session data - replace with real API call
  const nextSession = {
    id: '1',
    therapist: {
      name: 'Dr. Sarah Johnson',
      avatar: 'https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg?auto=compress&cs=tinysrgb&w=150'
    },
    datetime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    duration: 60,
    type: 'therapy',
    status: 'confirmed'
  }

  const formatSessionDate = (date) => {
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`
    } else if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, 'h:mm a')}`
    } else {
      return format(date, 'EEEE, MMM d at h:mm a')
    }
  }

  const handleJoinSession = () => {
    navigate(`/t/${tenantId}/sessions/${nextSession.id}/video`)
  }

  const handleSendMessage = () => {
    navigate(`/t/${tenantId}/messages/${nextSession.therapist.id}`)
  }

  if (!nextSession) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('dashboard.nextSession')}
        </h2>
        <div className="text-center py-8">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            No upcoming sessions scheduled
          </p>
          <button
            onClick={() => navigate(`/t/${tenantId}/therapists`)}
            className="mt-4 btn btn-primary"
          >
            Book a Session
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('dashboard.nextSession')}
      </h2>

      <div className="flex items-start space-x-4">
        <img
          src={nextSession.therapist.avatar}
          alt={nextSession.therapist.name}
          className="h-12 w-12 rounded-full object-cover"
        />
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {nextSession.therapist.name}
          </h3>
          
          <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <CalendarIcon className="h-4 w-4 mr-1" />
            {formatSessionDate(nextSession.datetime)}
          </div>
          
          <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <ClockIcon className="h-4 w-4 mr-1" />
            {nextSession.duration} minutes
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            {nextSession.status}
          </span>
        </div>
      </div>

      <div className="mt-6 flex space-x-3">
        <button
          onClick={handleJoinSession}
          className="flex-1 btn btn-primary flex items-center justify-center"
        >
          <VideoIcon className="h-4 w-4 mr-2" />
          {t('dashboard.joinSession')}
        </button>
        
        <button
          onClick={handleSendMessage}
          className="btn btn-secondary flex items-center justify-center"
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
