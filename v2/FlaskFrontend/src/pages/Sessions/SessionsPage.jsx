import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTokenValidator } from '../../hooks/useTokenValidator';
import api from '../../utils/api';

const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled

  const user = useAuthStore((state) => state.user);

  // Validate token every 2 minutes
  useTokenValidator(120000);

  useEffect(() => {
    loadSessions();
  }, [filter]); // Reload when filter changes

  const loadSessions = async () => {
    try {
      setLoading(true);
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
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not scheduled';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'started':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-orange-100 text-orange-800';
      case 'forfeited':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayText = (status) => {
    switch (status?.toLowerCase()) {
      case 'no_show':
        return 'NO SHOW';
      case 'forfeited':
        return 'FORFEITED';
      default:
        return status?.toUpperCase() || 'UNKNOWN';
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
      // Check session status before joining
      const statusResponse = await api.get(`/sessions/${session.id}/status`);
      const statusInfo = statusResponse.data;
      if (!statusInfo.can_join) {
        setMessage(`Cannot join session: ${statusInfo.join_message}`);
        return;
      }
      // Show warning for late joins
      if (statusInfo.join_status === 'late_join_warning') {
        const proceed = window.confirm(
          `${statusInfo.join_message}\n\nFuture late attendance may result in session forfeiture. Do you want to continue?`
        );
        if (!proceed) return;
      }
      // Attempt to join the session
      const joinResponse = await api.post(`/sessions/${session.id}/join`);
      if (joinResponse.data.warning) {
        alert(`Warning: ${joinResponse.data.warning}`);
      }
      // Navigate to video call
      window.location.href = `/video-call/${session.room_id}`;
    } catch (error) {
      console.error('Error joining session:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to join session';
      setMessage(`Error: ${errorMessage}`);
      // If it's a forfeit error, reload sessions to update status
      if (error.response?.status === 410) {
        loadSessions();
      }
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
          canJoin: false
        };
      } else if (diffMins > 0) {
        return { 
          text: `Starts in ${diffMins} minutes`, 
          color: 'text-blue-600',
          canJoin: true
        };
      } else if (diffMins > -30) {
        return { 
          text: `Started ${Math.abs(diffMins)} minutes ago`, 
          color: 'text-orange-600',
          canJoin: true,
          warning: diffMins < -15 ? 'Late join may result in session forfeiture' : null
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
    
    // Fallback client-side logic
    if (!['scheduled', 'started'].includes(session.status)) {
      return false;
    }
    
    const now = new Date();
    const sessionTime = new Date(session.scheduled_at);
    const joinWindow = 15 * 60 * 1000; // 15 minutes in milliseconds
    const maxDelay = 60 * 60 * 1000; // 1 hour max delay
    
    return now >= (sessionTime.getTime() - joinWindow) && 
           now <= (sessionTime.getTime() + maxDelay);
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
      <div className="max-w-6xl mx-auto mt-8 p-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
        {user?.role?.toUpperCase() === 'PATIENT' && (
          <Link
            to="/sessions/schedule"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Schedule New Session
          </Link>
        )}
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.includes('Error') 
            ? 'bg-red-50 border border-red-200 text-red-800' 
            : 'bg-green-50 border border-green-200 text-green-800'
        }`}>
          {message}
          <button
            onClick={() => setMessage('')}
            className="ml-2 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['all', 'upcoming', 'completed', 'cancelled'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                filter === filterOption
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {filterOption}
              <span className="ml-1 text-xs text-gray-400">
                ({sessions.filter(s => {
                  if (filterOption === 'all') return true;
                  if (filterOption === 'upcoming') return ['scheduled', 'started'].includes(s.status);
                  if (filterOption === 'completed') return s.status === 'completed';
                  if (filterOption === 'cancelled') return ['cancelled', 'no_show', 'forfeited'].includes(s.status);
                  return true;
                }).length})
              </span>
            </button>
          ))}
        </nav>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No sessions found.</p>
          {user?.role?.toUpperCase() === 'PATIENT' && filter === 'all' && (
            <Link
              to="/sessions/schedule"
              className="text-indigo-600 hover:text-indigo-500 underline"
            >
              Schedule your first session
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-lg shadow border border-gray-200 p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {session.title}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Date & Time:</strong> {formatDateTime(session.scheduled_at)}</p>
                    <p><strong>Duration:</strong> {session.duration} minutes</p>
                    <p><strong>Type:</strong> {session.session_type?.replace('_', ' ')}</p>
                    {user?.role?.toUpperCase() === 'PATIENT' && (
                      <p><strong>Therapist:</strong> {session.therapist_name}</p>
                    )}
                    {user?.role?.toUpperCase() === 'THERAPIST' && (
                      <p><strong>Patient:</strong> {session.patient_name}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                    {getStatusDisplayText(session.status)}
                  </span>
                  
                  {/* Show timing info for scheduled sessions */}
                  {session.status === 'scheduled' && (() => {
                    const timingInfo = getTimingInfo(session);
                    return timingInfo ? (
                      <div className="text-xs text-center">
                        <div className={timingInfo.color}>
                          {timingInfo.text}
                        </div>
                        {timingInfo.warning && (
                          <div className="text-red-500 mt-1">
                            ⚠️ {timingInfo.warning}
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()}
                  
                  <div className="flex space-x-2">
                    {canJoinSession(session) && (
                      <button
                        onClick={() => handleJoinSession(session)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Join Session
                      </button>
                    )}
                    
                    {canCancelSession(session) && (
                      <button
                        onClick={() => {
                          const reason = prompt('Please provide a reason for cancellation (optional):');
                          if (reason !== null) { // User didn't cancel the prompt
                            handleCancelSession(session.id, reason);
                          }
                        }}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    
                    <Link
                      to={`/sessions/${session.id}`}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
              
              {session.notes && (
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600">
                    <strong>Notes:</strong> {session.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionsPage;