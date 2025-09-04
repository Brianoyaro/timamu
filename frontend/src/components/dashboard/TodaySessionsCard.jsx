import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  CalendarIcon, 
  ClockIcon, 
  VideoIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { format, isWithinInterval, addMinutes } from 'date-fns'
import { schedulingService } from '../../services/schedulingService'
import { useAuthStore } from '../../store/authStore'

export function TodaySessionsCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tenantId } = useParams()
  const { user } = useAuthStore()
  const [todaySessions, setTodaySessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTodaySessions = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get today's appointments for the current user (if therapist)
        const therapistId = user?.roles?.includes('therapist') ? user.id : null
        const sessions = await schedulingService.getTodayAppointments(therapistId)
        
        setTodaySessions(sessions)
      } catch (err) {
        console.error('Error fetching today\'s sessions:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchTodaySessions()
    }
  }, [user])

  const canJoinSession = (session) => {
    const now = new Date()
    const sessionStart = new Date(session.datetime)
    const sessionEnd = addMinutes(sessionStart, session.duration)
    
    return isWithinInterval(now, {
      start: addMinutes(sessionStart, -15), // 15 minutes before
      end: sessionEnd
    })
  }

  const handleJoinSession = (sessionId) => {
    navigate(`/t/${tenantId}/sessions/${sessionId}/video`)
  }

  const handleViewPatient = (patientId) => {
    navigate(`/t/${tenantId}/patients/${patientId}`)
  }

  if (loading) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Today's Sessions
        </h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Today's Sessions
        </h2>
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">
            Error loading sessions: {error}
          </p>
        </div>
      </div>
    )
  }

  if (todaySessions.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Today's Sessions
        </h2>
        <div className="text-center py-8">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            No sessions scheduled for today
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Today's Sessions ({todaySessions.length})
      </h2>

      <div className="space-y-4">
        {todaySessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <img
              src={session.patient?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.patient?.name || 'Unknown')}&background=3b82f6&color=fff`}
              alt={session.patient?.name || 'Unknown Patient'}
              className="h-12 w-12 rounded-full object-cover"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {session.patient?.name || 'Unknown Patient'}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  session.status === 'confirmed' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : session.status === 'scheduled'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {session.status}
                </span>
              </div>
              
              <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <ClockIcon className="h-4 w-4 mr-1" />
                {format(new Date(session.datetime), 'h:mm a')} - {session.duration} min
              </div>
              
              {session.notes && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 truncate">
                  {session.notes}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {canJoinSession(session) ? (
                <button
                  onClick={() => handleJoinSession(session.id)}
                  className="btn btn-primary btn-sm flex items-center"
                >
                  <VideoIcon className="h-4 w-4 mr-1" />
                  Join
                </button>
              ) : (
                <button
                  onClick={() => handleViewPatient(session.patientId)}
                  className="btn btn-secondary btn-sm flex items-center"
                >
                  <UserIcon className="h-4 w-4 mr-1" />
                  View
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
