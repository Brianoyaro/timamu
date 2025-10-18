import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useSessionStore } from '../../stores/sessionStore';
import { useTokenValidator } from '../../hooks/useTokenValidator';

// Components
import SessionCard from '../../components/Sessions/SessionCard';
import SessionCalendarView from '../../components/Sessions/SessionCalendarView';

// Icons
import { 
  FiCalendar, 
  FiClock, 
  FiUser, 
  FiVideo, 
  FiList,
  FiGrid,
  FiPlus,
  FiFilter,
  FiEye,
  FiX,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiSettings
} from 'react-icons/fi';

const SessionsPage = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  const user = useAuthStore((state) => state.user);
  const { sessions, loading, fetchSessions } = useSessionStore();

  // Validate token every 2 minutes
  useTokenValidator(120000);

  useEffect(() => {
    loadSessions();
  }, [filter]); // Reload when filter changes

  const loadSessions = async (showRefreshSpinner = false) => {
    try {
      if (showRefreshSpinner) {
        setRefreshing(true);
      }
      
      await fetchSessions({ 
        status: filter === 'all' ? 'all' : filter,
        include_old: filter === 'all'
      });
    } catch (error) {
      console.error('Error loading sessions:', error);
      setMessage('Error loading sessions');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle session selection from calendar view
  const handleSelectSession = (session) => {
    navigate(`/sessions/${session.id}`);
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return ['scheduled', 'started'].includes(session.status);
    if (filter === 'completed') return session.status === 'completed';
    if (filter === 'cancelled') return ['cancelled', 'no_show', 'forfeited'].includes(session.status);
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Sessions</h1>
              <p className="text-gray-600 mt-1">Manage your therapy appointments</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadSessions(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              
              {user?.role?.toUpperCase() === 'PATIENT' && (
                <Link
                  to="/sessions/schedule"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiPlus className="h-4 w-4" />
                  Schedule Session
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.includes('Error') 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            <div className="flex items-center justify-between">
              <span>{message}</span>
              <button
                onClick={() => setMessage('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Filter Tabs and View Toggle */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200">
            <nav className="flex space-x-1 sm:space-x-8 overflow-x-auto">
              {[
                { key: 'all', label: 'All', icon: FiCalendar },
                { key: 'upcoming', label: 'Upcoming', icon: FiClock },
                { key: 'completed', label: 'Completed', icon: FiCheckCircle },
                { key: 'cancelled', label: 'Cancelled', icon: FiXCircle }
              ].map((tab) => {
                const Icon = tab.icon;
                const count = sessions.filter(s => {
                  if (tab.key === 'all') return true;
                  if (tab.key === 'upcoming') return ['scheduled', 'started'].includes(s.status);
                  if (tab.key === 'completed') return s.status === 'completed';
                  if (tab.key === 'cancelled') return ['cancelled', 'no_show', 'forfeited'].includes(s.status);
                  return true;
                }).length;
                
                return (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                      filter === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
            
            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 flex items-center gap-1 ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FiList className="h-4 w-4" />
                <span className="text-sm">List</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 flex items-center gap-1 ${
                  viewMode === 'calendar' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FiGrid className="h-4 w-4" />
                <span className="text-sm">Calendar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sessions Content */}
        {viewMode === 'list' ? (
          // List View
          filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <FiCalendar className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
                <p className="text-gray-600 mb-6">
                  {filter === 'all' 
                    ? "You haven't scheduled any sessions yet." 
                    : `No ${filter} sessions to display.`}
                </p>
                {user?.role?.toUpperCase() === 'PATIENT' && filter === 'all' && (
                  <Link
                    to="/sessions/schedule"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiPlus className="h-4 w-4" />
                    Schedule Your First Session
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:gap-6">
              {filteredSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )
        ) : (
          // Calendar View
          <SessionCalendarView onSelectSession={handleSelectSession} />
        )}
      </div>
    </div>
  );
};

export default SessionsPage;