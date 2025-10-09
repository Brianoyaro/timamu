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
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sessions/');
      setSessions(response.data);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setMessage('Error loading sessions');
    } finally {
      setLoading(false);
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canJoinSession = (session) => {
    if (session.status !== 'scheduled' && session.status !== 'started') {
      return false;
    }
    
    const now = new Date();
    const sessionTime = new Date(session.scheduled_at);
    const joinWindow = 15 * 60 * 1000; // 15 minutes in milliseconds
    
    return now >= (sessionTime.getTime() - joinWindow);
  };

  const canCancelSession = (session) => {
    return session.status === 'scheduled';
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return ['scheduled', 'started'].includes(session.status);
    if (filter === 'completed') return session.status === 'completed';
    if (filter === 'cancelled') return session.status === 'cancelled';
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
                  if (filterOption === 'cancelled') return s.status === 'cancelled';
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
                    {session.status?.toUpperCase()}
                  </span>
                  
                  <div className="flex space-x-2">
                    {canJoinSession(session) && (
                      <Link
                        to={`/video-call/${session.room_id}`}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Join Session
                      </Link>
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