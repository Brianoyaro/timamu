import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  CalendarIcon, 
  ClockIcon, 
  VideoIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { format, isWithinInterval, addMinutes } from 'date-fns'

export function TodaySessionsCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tenantId } = useParams()

  // Mock today's sessions - replace with real API call
  const todaySessions = [
    {
      id: '1',
      patient: {
        name: 'John Doe',
        avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150'
      },
      datetime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      duration: 60,
      type: 'therapy',
      status: 'confirmed',
      notes: 'Follow-up on anxiety management techniques'
    },
    {
      id: '2',
      patient: {
        name: 'Jane Smith',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150'
      },
      datetime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      duration: 45,
      type: 'consultation',
      status: 'confirmed',
      notes: 'Initial consultation for depression symptoms'
    },
    {
      id: '3',
      patient: {
        name: 'Mike Johnson',
        avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150'
      },
      datetime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      duration: 60,
      type: 'therapy',
      status: 'pending',
      notes: 'PTSD treatment session'
    }
  ]

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
              src={session.patient.avatar}
              alt={session.patient.name}
              className="h-12 w-12 rounded-full object-cover"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {session.patient.name}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  session.status === 'confirmed' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
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
                  onClick={() => handleViewPatient(session.patient.id)}
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
