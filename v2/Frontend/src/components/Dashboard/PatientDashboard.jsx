import { Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  VideoCameraIcon, 
  ChatBubbleLeftRightIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';

export default function PatientDashboard({ sessions = [], isLoading }) {
  // Ensure sessions is always an array
  const sessionsArray = Array.isArray(sessions) ? sessions : [];
  
  const upcomingSessions = sessionsArray
    .filter(session => {
      try {
        return session.scheduledAt && new Date(session.scheduledAt) > new Date();
      } catch (error) {
        console.error('Error filtering upcoming session:', error, session);
        return false;
      }
    })
    .sort((a, b) => {
      try {
        return new Date(a.scheduledAt) - new Date(b.scheduledAt);
      } catch (error) {
        console.error('Error sorting sessions:', error);
        return 0;
      }
    })
    .slice(0, 3);

  const recentSessions = sessionsArray
    .filter(session => session.status === 'COMPLETED')
    .sort((a, b) => {
      try {
        return new Date(b.scheduledAt) - new Date(a.scheduledAt);
      } catch (error) {
        console.error('Error sorting recent sessions:', error);
        return 0;
      }
    })
    .slice(0, 3);

  const stats = [
    {
      name: 'Total Sessions',
      value: sessionsArray.length,
      icon: VideoCameraIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Completed',
      value: sessionsArray.filter(s => s.status === 'COMPLETED').length,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Upcoming',
      value: upcomingSessions.length,
      icon: CalendarIcon,
      color: 'bg-yellow-500',
    },
  ];

  const getSessionTimeText = (scheduledAt) => {
    try {
      if (!scheduledAt) {
        return 'Time not available';
      }
      
      const date = parseISO(scheduledAt);
      
      // Check if the parsed date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      if (isToday(date)) {
        return `Today at ${format(date, 'h:mm a')}`;
      } else if (isTomorrow(date)) {
        return `Tomorrow at ${format(date, 'h:mm a')}`;
      } else {
        return format(date, 'MMM d, yyyy \'at\' h:mm a');
      }
    } catch (error) {
      console.error('Error formatting session time:', error, 'scheduledAt:', scheduledAt);
      return 'Time not available';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-lg font-medium text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Upcoming Sessions</h3>
              <Link
                to="/sessions"
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingSessions.length === 0 ? (
              <div className="p-6 text-center">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No upcoming sessions</p>
                <Link
                  to="/therapists"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Book a Session
                </Link>
              </div>
            ) : (
              upcomingSessions.map((session) => (
                <div key={session.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            Dr. {session.therapist?.firstName} {session.therapist?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {getSessionTimeText(session.scheduledAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {(() => {
                        try {
                          const sessionTime = new Date(session.scheduledAt);
                          const now = new Date();
                          const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
                          
                          return sessionTime <= tenMinutesFromNow && (
                            <Link
                              to={`/session/${session.id}`}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                              <VideoCameraIcon className="h-4 w-4 mr-1" />
                              Join
                            </Link>
                          );
                        } catch (error) {
                          console.error('Error checking session join time:', error);
                          return null;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Sessions</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentSessions.length === 0 ? (
              <div className="p-6 text-center">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No completed sessions yet</p>
              </div>
            ) : (
              recentSessions.map((session) => (
                <div key={session.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            Dr. {session.therapist?.firstName} {session.therapist?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {(() => {
                              try {
                                return session.scheduledAt ? format(parseISO(session.scheduledAt), 'MMM d, yyyy') : 'Date not available';
                              } catch (error) {
                                console.error('Error formatting recent session date:', error);
                                return 'Date not available';
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    </div>
                  </div>
                  {session.notes && (
                    <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      <p className="font-medium mb-1">Session Notes:</p>
                      <p>{session.notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/therapists"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CalendarIcon className="h-6 w-6 text-blue-600 mr-3" />
            <span className="text-sm font-medium text-gray-900">Book Session</span>
          </Link>
          <Link
            to="/sessions"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ClockIcon className="h-6 w-6 text-blue-600 mr-3" />
            <span className="text-sm font-medium text-gray-900">View Sessions</span>
          </Link>
          <Link
            to="/profile"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserIcon className="h-6 w-6 text-blue-600 mr-3" />
            <span className="text-sm font-medium text-gray-900">Edit Profile</span>
          </Link>
          <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-gray-400 mr-3" />
            <span className="text-sm font-medium text-gray-500">Messages (Coming Soon)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
