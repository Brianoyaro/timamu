import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  VideoCameraIcon, 
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';
import { format, parseISO, isAfter, isBefore, addMinutes } from 'date-fns';
import useAuthStore from '../../stores/authStore';
import useSessionStore from '../../stores/sessionStore';

export default function SessionsPage() {
  const { user, token } = useAuthStore();
  const { sessions, fetchSessions, isLoading } = useSessionStore();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (token) {
      fetchSessions(token);
    }
  }, [token, fetchSessions]);

  const filteredSessions = sessions?.filter(session => {
    const now = new Date();
    const sessionDate = parseISO(session.scheduledFor);
    
    switch (filter) {
      case 'upcoming':
        return isAfter(sessionDate, now);
      case 'completed':
        return session.status === 'COMPLETED';
      case 'cancelled':
        return session.status === 'CANCELLED';
      default:
        return true;
    }
  }) || [];

  const canJoinSession = (session) => {
    const now = new Date();
    const sessionStart = parseISO(session.scheduledFor);
    const joinWindow = addMinutes(sessionStart, -10); // Allow joining 10 minutes early
    const sessionEnd = addMinutes(sessionStart, 60); // 1 hour session
    
    return isAfter(now, joinWindow) && isBefore(now, sessionEnd) && session.status === 'SCHEDULED';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
            <p className="mt-1 text-gray-600">
              Manage your therapy sessions and appointments
            </p>
          </div>
          {user?.role === 'PATIENT' && (
            <Link
              to="/therapists"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Book Session
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex space-x-4">
          {['all', 'upcoming', 'completed', 'cancelled'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === filterOption
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white shadow-sm rounded-lg">
        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You don't have any sessions yet." 
                : `No ${filter} sessions found.`}
            </p>
            {user?.role === 'PATIENT' && (
              <Link
                to="/therapists"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Book Your First Session
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSessions.map((session) => (
              <div key={session.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">
                            {user?.role === 'PATIENT' 
                              ? `Dr. ${session.therapist?.firstName} ${session.therapist?.lastName}`
                              : `${session.patient?.firstName} ${session.patient?.lastName}`
                            }
                          </h3>
                          <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                            {session.status.replace('_', ' ').toLowerCase()}
                          </span>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {format(parseISO(session.scheduledFor), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                        </div>
                        {session.type && (
                          <div className="mt-1 text-sm text-gray-600">
                            Session Type: {session.type}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {canJoinSession(session) && (
                      <Link
                        to={`/session/${session.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <VideoCameraIcon className="h-4 w-4 mr-2" />
                        Join Session
                      </Link>
                    )}
                    
                    {session.status === 'SCHEDULED' && !canJoinSession(session) && (
                      <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        Reschedule
                      </button>
                    )}
                    
                    {session.status === 'COMPLETED' && session.notes && (
                      <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        View Notes
                      </button>
                    )}
                  </div>
                </div>
                
                {session.notes && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Session Notes:</h4>
                    <p className="text-sm text-gray-700">{session.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
