import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  Calendar, 
  Clock, 
  MessageCircle,
  Video,
  Loader2
} from 'lucide-react'
import { format, isToday, isTomorrow } from 'date-fns'
import { schedulingService } from '../../services/schedulingService'
import { useToastStore } from '../../store/toastStore'

export function NextSessionCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tenantId } = useParams()
  const { addToast } = useToastStore()
  const [nextSession, setNextSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNextSession = async () => {
      try {
        setLoading(true)
        // Get upcoming appointments for the current user
        const today = new Date()
        const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        
        const response = await schedulingService.getAppointments({
          startDate: today.toISOString(),
          endDate: nextMonth.toISOString(),
          status: 'scheduled,confirmed',
          limit: 1
        })
        
        const upcomingAppointments = response.appointments || []
        
        if (upcomingAppointments.length > 0) {
          setNextSession(upcomingAppointments[0])
        }
      } catch (error) {
        console.error('Failed to fetch next session:', error)
        addToast({
          type: 'error',
          message: 'Failed to load upcoming session'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchNextSession()
  }, [addToast])

  const formatSessionDate = (date) => {
    const sessionDate = new Date(date)
    if (isToday(sessionDate)) {
      return `Today at ${format(sessionDate, 'h:mm a')}`
    } else if (isTomorrow(sessionDate)) {
      return `Tomorrow at ${format(sessionDate, 'h:mm a')}`
    } else {
      return format(sessionDate, 'EEEE, MMM d at h:mm a')
    }
  }

  const handleJoinSession = () => {
    navigate(`/t/${tenantId}/sessions/${nextSession.id}/video`)
  }

  const handleSendMessage = () => {
    navigate(`/t/${tenantId}/messages`)
  }

  if (loading) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('dashboard.nextSession')}
        </h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (!nextSession) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('dashboard.nextSession')}
        </h2>
        <div className="text-center py-8">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
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
          src={nextSession.therapist?.avatar || '/default-avatar.png'}
          alt={nextSession.therapist?.name || 'Therapist'}
          className="h-12 w-12 rounded-full object-cover"
        />
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {nextSession.therapist?.name || 'Therapist'}
          </h3>
          
          <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="h-4 w-4 mr-1" />
            {formatSessionDate(nextSession.datetime)}
          </div>
          
          <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4 mr-1" />
            {nextSession.duration} minutes
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            nextSession.status === 'confirmed' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          }`}>
            {nextSession.status}
          </span>
        </div>
      </div>

      <div className="mt-6 flex space-x-3">
        <button
          onClick={handleJoinSession}
          className="flex-1 btn btn-primary flex items-center justify-center"
        >
          <Video className="h-4 w-4 mr-2" />
          {t('dashboard.joinSession')}
        </button>
        
        <button
          onClick={handleSendMessage}
          className="btn btn-secondary flex items-center justify-center"
        >
          <MessageCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
