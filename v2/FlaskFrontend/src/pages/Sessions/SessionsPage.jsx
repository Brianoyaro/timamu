import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTokenValidator } from '../../hooks/useTokenValidator';
import api from '../../utils/api';

// Icons
import { 
  FiCalendar, 
  FiClock, 
  FiUser, 
  FiVideo, 
  FiMoreVertical,
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
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled
  const [refreshing, setRefreshing] = useState(false);

  const user = useAuthStore((state) => state.user);

  // Validate token every 2 minutes
  useTokenValidator(120000);

  useEffect(() => {
    loadSessions();
  }, [filter]); // Reload when filter changes

  const loadSessions = async (showRefreshSpinner = false) => {
    try {
      if (showRefreshSpinner) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await api.get('/sessions/', {
        params: { 
          status: filter === 'all' ? 'all' : filter,
          include_old: filter === 'all'
        }
      });
      // Handle both old format (array) and new format (object with sessions array)
      const sessionsData = Array.isArray(response.data) ? response.data : response.data.sessions || [];
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setMessage('Error loading sessions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not scheduled';
    
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    let dateLabel = '';
    const timeDiff = sessionDate.getTime() - today.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      dateLabel = 'Today';
    } else if (daysDiff === 1) {
      dateLabel = 'Tomorrow';
    } else if (daysDiff === -1) {
      dateLabel = 'Yesterday';
    } else if (daysDiff > 1 && daysDiff <= 7) {
      dateLabel = date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      dateLabel = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
    
    const timeLabel = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return `${dateLabel} at ${timeLabel}`;
  };

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return {
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: FiClock,
          text: 'SCHEDULED'
        };
      case 'started':
        return {
          color: 'bg-green-50 text-green-700 border-green-200',
          icon: FiVideo,
          text: 'IN PROGRESS'
        };
      case 'completed':
        return {
          color: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: FiCheckCircle,
          text: 'COMPLETED'
        };
      case 'cancelled':
        return {
          color: 'bg-red-50 text-red-700 border-red-200',
          icon: FiXCircle,
          text: 'CANCELLED'
        };
      case 'no_show':
        return {
          color: 'bg-orange-50 text-orange-700 border-orange-200',
          icon: FiAlertCircle,
          text: 'NO SHOW'
        };
      case 'forfeited':
        return {
          color: 'bg-red-100 text-red-800 border-red-300',
          icon: FiXCircle,
          text: 'FORFEITED'
        };
      default:
        return {
          color: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: FiAlertCircle,
          text: status?.toUpperCase() || 'UNKNOWN'
        };
    }
  };

  const handleCancelSession = async (sessionId, reason) => {
    try {
      await api.post(`/sessions/${sessionId}/cancel`, { reason });
      setMessage('Session cancelled successfully');
      loadSessions(); // Reload sessions
    } catch (error) {
      console.error('Error cancelling session:', error);
      setMessage(`Error: ${error.response?.data?.message || error.message || 'Failed to cancel session'}`);
    }
  };

  const handleJoinSession = async (session) => {
    try {
      // Navigate directly to video call like the dashboard does
      navigate(`/video-call/${session.room_id}`);
    } catch (error) {
      console.error('Error joining session:', error);
      setMessage(`Error: ${error.message || 'Failed to join session'}`);
    }
  };

  const getTimingInfo = (session) => {
    const now = new Date();
    const sessionTime = new Date(session.scheduled_at);
    const diffMs = sessionTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (session.status === 'scheduled') {
      if (diffMins > 15) {
        return { 
          text: `Starts in ${Math.floor(diffMins / 60)}h ${diffMins % 60}m`, 
          color: 'text-gray-600',
          canJoin: false,
          detail: `Join button available 15 min before start time`
        };
      } else if (diffMins > 0) {
        return { 
          text: `Starts in ${diffMins} minutes`, 
          color: 'text-blue-600',
          canJoin: true,
          detail: 'Ready to join!'
        };
      } else if (diffMins >= -15) {
        return { 
          text: `Started ${Math.abs(diffMins)} minutes ago`, 
          color: 'text-orange-600',
          canJoin: true,
          detail: 'On time - join now'
        };
      } else if (diffMins >= -60) {
        return { 
          text: `Started ${Math.abs(diffMins)} minutes ago`, 
          color: 'text-red-600',
          canJoin: true,
          warning: 'Late join - may result in session forfeiture',
          detail: 'Join within 1 hour of start time'
        };
      } else {
        return { 
          text: 'Session window expired', 
          color: 'text-red-600',
          canJoin: false
        };
      }
    }
    return null;
  };

  const canJoinSession = (session) => {
    // Use the backend's can_join field if available, otherwise fall back to client-side logic
    if (session.hasOwnProperty('can_join')) {
      return session.can_join && (session.status === 'scheduled' || session.status === 'started');
    }
    
    // Fallback client-side logic - more lenient than backend
    if (!['scheduled', 'started'].includes(session.status)) {
      return false;
    }
    
    const now = new Date();
    const sessionTime = new Date(session.scheduled_at);
    const joinWindowStart = sessionTime.getTime() - (15 * 60 * 1000); // 15 minutes before
    const maxDelay = sessionTime.getTime() + (60 * 60 * 1000); // 1 hour after
    
    // Allow joining if within the time window
    return now.getTime() >= joinWindowStart && now.getTime() <= maxDelay;
  };

  const canCancelSession = (session) => {
    return session.status === 'scheduled';
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

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
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
          </div>
        </div>

        {/* Sessions Grid */}
        {filteredSessions.length === 0 ? (
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
            {filteredSessions.map((session) => {
              const statusConfig = getStatusConfig(session.status);
              const StatusIcon = statusConfig.icon;
              const timingInfo = getTimingInfo(session);
              const canJoin = canJoinSession(session);
              
              return (
                <div
                  key={session.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-4 sm:p-6">
                    {/* Mobile Layout */}
                    <div className="sm:hidden">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg mb-1">
                            {session.title}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${statusConfig.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.text}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <FiCalendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDateTime(session.scheduled_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiClock className="h-4 w-4 text-gray-400" />
                          <span>{session.duration} minutes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiUser className="h-4 w-4 text-gray-400" />
                          <span>
                            {user?.role?.toUpperCase() === 'PATIENT' 
                              ? `Dr. ${session.therapist_name}` 
                              : session.patient_name}
                          </span>
                        </div>
                      </div>
                      
                      {/* Timing Info */}
                      {timingInfo && (
                        <div className="mb-4">
                          <div className={`text-sm font-medium ${timingInfo.color}`}>
                            {timingInfo.text}
                          </div>
                          {timingInfo.detail && (
                            <div className="text-xs text-gray-500 mt-1">
                              {timingInfo.detail}
                            </div>
                          )}
                          {timingInfo.warning && (
                            <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <FiAlertCircle className="h-3 w-3" />
                              {timingInfo.warning}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Mobile Actions */}
                      <div className="flex gap-2">
                        {canJoin ? (
                          <button
                            onClick={() => handleJoinSession(session)}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <FiVideo className="h-4 w-4" />
                            Join Session
                          </button>
                        ) : (
                          session.status === 'scheduled' && (() => {
                            const now = new Date();
                            const sessionTime = new Date(session.scheduled_at);
                            const diffMins = Math.floor((sessionTime.getTime() - now.getTime()) / (1000 * 60));
                            
                            if (diffMins > 15) {
                              return (
                                <div className="flex-1 text-center text-xs text-gray-500 px-4 py-2 bg-gray-50 rounded-lg">
                                  Join in {diffMins - 15} min
                                </div>
                              );
                            } else if (diffMins < -60) {
                              return (
                                <div className="flex-1 text-center text-xs text-red-500 px-4 py-2 bg-red-50 rounded-lg">
                                  Session expired
                                </div>
                              );
                            }
                            return null;
                          })()
                        )}
                        
                        {canCancelSession(session) && (
                          <button
                            onClick={() => {
                              const reason = prompt('Please provide a reason for cancellation (optional):');
                              if (reason !== null) {
                                handleCancelSession(session.id, reason);
                              }
                            }}
                            className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        
                        <Link
                          to={`/sessions/${session.id}`}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                        >
                          <FiEye className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:block">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {session.title}
                              </h3>
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <FiCalendar className="h-4 w-4 text-gray-400" />
                                  <span>{formatDateTime(session.scheduled_at)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FiClock className="h-4 w-4 text-gray-400" />
                                  <span>{session.duration} minutes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FiUser className="h-4 w-4 text-gray-400" />
                                  <span>
                                    {user?.role?.toUpperCase() === 'PATIENT' 
                                      ? `Dr. ${session.therapist_name}` 
                                      : session.patient_name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400">Type:</span>
                                  <span className="capitalize">{session.session_type?.replace('_', ' ')}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                                  <StatusIcon className="h-4 w-4" />
                                  {statusConfig.text}
                                </span>
                                
                                {/* Timing Info */}
                                {timingInfo && (
                                  <div className="mt-2 text-right">
                                    <div className={`text-sm font-medium ${timingInfo.color}`}>
                                      {timingInfo.text}
                                    </div>
                                    {timingInfo.warning && (
                                      <div className="text-xs text-red-600 mt-1 flex items-center justify-end gap-1">
                                        <FiAlertCircle className="h-3 w-3" />
                                        {timingInfo.warning}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Desktop Actions */}
                              <div className="flex items-center gap-2">
                                {canJoin ? (
                                  <button
                                    onClick={() => handleJoinSession(session)}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                  >
                                    <FiVideo className="h-4 w-4" />
                                    Join Session
                                  </button>
                                ) : (
                                  session.status === 'scheduled' && (() => {
                                    const now = new Date();
                                    const sessionTime = new Date(session.scheduled_at);
                                    const diffMins = Math.floor((sessionTime.getTime() - now.getTime()) / (1000 * 60));
                                    
                                    if (diffMins > 15) {
                                      return (
                                        <span className="text-sm text-gray-500 px-4 py-2 bg-gray-50 rounded-lg">
                                          Join in {diffMins - 15} min
                                        </span>
                                      );
                                    } else if (diffMins < -60) {
                                      return (
                                        <span className="text-sm text-red-500 px-4 py-2 bg-red-50 rounded-lg">
                                          Session expired
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()
                                )}
                                
                                {canCancelSession(session) && (
                                  <button
                                    onClick={() => {
                                      const reason = prompt('Please provide a reason for cancellation (optional):');
                                      if (reason !== null) {
                                        handleCancelSession(session.id, reason);
                                      }
                                    }}
                                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                )}
                                
                                <Link
                                  to={`/sessions/${session.id}`}
                                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                  <FiEye className="h-4 w-4" />
                                  Details
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {session.notes && (
                    <div className="border-t border-gray-100 px-4 sm:px-6 py-3 bg-gray-50">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {session.notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsPage;