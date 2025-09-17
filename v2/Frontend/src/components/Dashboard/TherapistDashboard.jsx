import { Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  UsersIcon, 
  ClockIcon,
  CheckCircleIcon,
  VideoCameraIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';

export default function TherapistDashboard({ sessions = [], isLoading }) {
  // Ensure sessions is always an array
  const sessionsArray = Array.isArray(sessions) ? sessions : [];
  
  const todaySessions = sessionsArray
    .filter(session => session.scheduledAt && isToday(parseISO(session.scheduledAt)))
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const upcomingSessions = sessionsArray
    .filter(session => session.scheduledAt && new Date(session.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .slice(0, 5);

  const recentCompletedSessions = sessions
    ?.filter(session => session.status === 'COMPLETED')
    ?.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
    ?.slice(0, 3) || [];

  const stats = [
    {
      name: 'Today\'s Sessions',
      value: todaySessions.length,
      icon: CalendarIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Patients',
      value: new Set(sessionsArray.map(s => s.patientId)).size,
      icon: UsersIcon,
      color: 'bg-green-500',
    },
    {
      name: 'This Week',
      value: sessionsArray.filter(s => {
        const sessionDate = parseISO(s.scheduledAt);
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(now.setDate(weekStart.getDate() + 6));
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      }).length,
      icon: ClockIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Completed',
      value: sessionsArray.filter(s => s.status === 'COMPLETED').length,
      icon: CheckCircleIcon,
      color: 'bg-purple-500',
    },
  ];

  const getSessionTimeText = (scheduledAt) => {
    const date = parseISO(scheduledAt);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy \'at\' h:mm a');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        {/* Today's Schedule */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Today's Schedule</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {todaySessions.length === 0 ? (
              <div className="p-6 text-center">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No sessions scheduled for today</p>
              </div>
            ) : (
              todaySessions.map((session) => (
                <div key={session.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {session.patient?.firstName?.[0]}{session.patient?.lastName?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {session.patient?.firstName} {session.patient?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(parseISO(session.scheduledAt), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {new Date(session.scheduledAt) <= new Date(Date.now() + 10 * 60 * 1000) && (
                        <Link
                          to={`/session/${session.id}`}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          <VideoCameraIcon className="h-4 w-4 mr-1" />
                          Join
                        </Link>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        session.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                        session.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' :
                        session.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {session.status.replace('_', ' ').toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

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
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming sessions</p>
              </div>
            ) : (
              upcomingSessions.map((session) => (
                <div key={session.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {session.patient?.firstName?.[0]}{session.patient?.lastName?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {session.patient?.firstName} {session.patient?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getSessionTimeText(session.scheduledAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Completed Sessions */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Completed Sessions</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentCompletedSessions.length === 0 ? (
            <div className="p-6 text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No completed sessions yet</p>
            </div>
          ) : (
            recentCompletedSessions.map((session) => (
              <div key={session.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {session.patient?.firstName} {session.patient?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(parseISO(session.scheduledAt), 'MMM d, yyyy \'at\' h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                      View Notes
                    </button>
                  </div>
                </div>
                {session.notes && (
                  <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    <p className="font-medium mb-1">Session Notes:</p>
                    <p className="text-sm">{session.notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/sessions"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CalendarIcon className="h-6 w-6 text-blue-600 mr-3" />
            <span className="text-sm font-medium text-gray-900">Manage Schedule</span>
          </Link>
          <Link
            to="/profile"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ClockIcon className="h-6 w-6 text-blue-600 mr-3" />
            <span className="text-sm font-medium text-gray-900">Set Availability</span>
          </Link>
          <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
            <UsersIcon className="h-6 w-6 text-gray-400 mr-3" />
            <span className="text-sm font-medium text-gray-500">Patient Management</span>
          </div>
          <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
            <DocumentTextIcon className="h-6 w-6 text-gray-400 mr-3" />
            <span className="text-sm font-medium text-gray-500">Session Notes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
