import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTokenValidator } from '../../hooks/useTokenValidator';
import api from '../../utils/api';

const SessionDetailPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const user = useAuthStore((state) => state.user);

  // Validate token every 2 minutes
  useTokenValidator(120000);

  useEffect(() => {
    loadSessionDetails();
  }, [sessionId]);

  const loadSessionDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sessions/${sessionId}`);
      setSession(response.data);
    } catch (error) {
      console.error('Error loading session details:', error);
      if (error.response?.status === 404) {
        setError('Session not found');
      } else if (error.response?.status === 403) {
        setError('You do not have access to view this session');
      } else {
        setError('Error loading session details');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not scheduled';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'Not specified';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'started': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-yellow-100 text-yellow-800';
      case 'forfeited': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled': return 'Scheduled';
      case 'started': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'no_show': return 'No Show';
      case 'forfeited': return 'Forfeited';
      default: return status;
    }
  };

  const canJoinSession = () => {
    if (!session || !['scheduled', 'started'].includes(session.status)) return false;
    
    // Use the backend's can_join field if available
    if (session.hasOwnProperty('can_join')) {
      return session.can_join;
    }
    
    // Allow joining anytime (removed time restrictions for testing)
    return true;
  };

  const canCancelSession = () => {
    if (!session) return false;
    return session.status === 'scheduled' && new Date() < new Date(session.scheduled_at);
  };

  const handleJoinSession = async () => {
    try {
      // Navigate directly to video call like the dashboard and sessions page
      navigate(`/video-call/${session.room_id}`);
    } catch (error) {
      console.error('Error joining session:', error);
      alert(error.message || 'Error joining session');
    }
  };

  const handleCancelSession = async () => {
    try {
      setCancelling(true);
      await api.post(`/sessions/${sessionId}/cancel`, {
        reason: cancellationReason
      });
      
      // Reload session details to show updated status
      await loadSessionDetails();
      setShowCancelModal(false);
      setCancellationReason('');
    } catch (error) {
      console.error('Error cancelling session:', error);
      alert(error.response?.data?.error || 'Error cancelling session');
    } finally {
      setCancelling(false);
    }
  };

  const getTimingInfo = () => {
    if (!session || !session.scheduled_at) return null;
    
    const now = new Date();
    const sessionTime = new Date(session.scheduled_at);
    const diffMs = sessionTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (session.status === 'scheduled') {
      if (diffMins > 15) {
        return {
          text: `Starts in ${Math.floor(diffMins / 60)}h ${diffMins % 60}m`,
          color: 'text-gray-600'
        };
      } else if (diffMins > 0) {
        return {
          text: `Starts in ${diffMins} minutes`,
          color: 'text-blue-600'
        };
      } else if (diffMins >= -15) {
        return {
          text: `Started ${Math.abs(diffMins)} minutes ago`,
          color: 'text-orange-600'
        };
      } else if (diffMins >= -60) {
        return {
          text: `Started ${Math.abs(diffMins)} minutes ago - Late join available`,
          color: 'text-red-600'
        };
      } else {
        return {
          text: 'Session window expired',
          color: 'text-red-600'
        };
      }
    } else if (session.status === 'started') {
      return {
        text: 'Session in progress',
        color: 'text-green-600'
      };
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            to="/sessions"
            className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Back to Sessions
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center">
          <p className="text-gray-600">Session not found</p>
        </div>
      </div>
    );
  }

  const timingInfo = getTimingInfo();

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link
            to="/sessions"
            className="text-indigo-600 hover:text-indigo-800 mb-2 inline-flex items-center"
          >
            ← Back to Sessions
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
              {getStatusText(session.status)}
            </span>
            {timingInfo && (
              <span className={`text-sm font-medium ${timingInfo.color}`}>
                {timingInfo.text}
              </span>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {canJoinSession() && (
            <button
              onClick={handleJoinSession}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Join Session
            </button>
          )}
          {canCancelSession() && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Cancel Session
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Session Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Session Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <p className="text-gray-900 capitalize">{session.session_type || 'Individual'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <p className="text-gray-900">{formatDuration(session.duration)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Time</label>
                <p className="text-gray-900">{formatDateTime(session.scheduled_at)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <p className="text-gray-900">{session.timezone || 'UTC'}</p>
              </div>
              {session.started_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Started At</label>
                  <p className="text-gray-900">{formatDateTime(session.started_at)}</p>
                </div>
              )}
              {session.ended_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ended At</label>
                  <p className="text-gray-900">{formatDateTime(session.ended_at)}</p>
                </div>
              )}
              {session.actual_duration && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actual Duration</label>
                  <p className="text-gray-900">{formatDuration(session.actual_duration)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {session.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Session Notes</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{session.notes}</p>
            </div>
          )}

          {/* Session History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Session Timeline</h2>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-600 mr-2">Created:</span>
                <span className="text-gray-900">{formatDateTime(session.created_at)}</span>
              </div>
              {session.started_at && (
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600 mr-2">Started:</span>
                  <span className="text-gray-900">{formatDateTime(session.started_at)}</span>
                </div>
              )}
              {session.ended_at && (
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-gray-500 rounded-full mr-3"></div>
                  <span className="text-gray-600 mr-2">Ended:</span>
                  <span className="text-gray-900">{formatDateTime(session.ended_at)}</span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-gray-600 mr-2">Last Updated:</span>
                <span className="text-gray-900">{formatDateTime(session.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Participants */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Participants</h2>
            <div className="space-y-4">
              {session.patient && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-medium">
                        {session.patient.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">{session.patient.name}</p>
                      <p className="text-gray-600 text-sm">{session.patient.email}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {session.therapist && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Therapist</label>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-medium">
                        {session.therapist.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">{session.therapist.name}</p>
                      <p className="text-gray-600 text-sm">{session.therapist.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                to="/sessions"
                className="block w-full text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                All Sessions
              </Link>
              <Link
                to="/sessions/schedule"
                className="block w-full text-center bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-200 transition-colors"
              >
                Schedule New Session
              </Link>
              {user?.role === 'therapist' && (
                <Link
                  to="/sessions/availability"
                  className="block w-full text-center bg-green-100 text-green-700 px-4 py-2 rounded-md hover:bg-green-200 transition-colors"
                >
                  Manage Availability
                </Link>
              )}
            </div>
          </div>

          {/* Meeting Link */}
          {session.room_id && ['scheduled', 'started'].includes(session.status) && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Video Session</h3>
              <p className="text-blue-700 text-sm mb-3">
                {canJoinSession() 
                  ? "Ready to join the video session" 
                  : "Video session is now available for testing"
                }
              </p>
              {canJoinSession() ? (
                <button
                  onClick={handleJoinSession}
                  className="block w-full text-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Join Video Session
                </button>
              ) : (
                <button
                  disabled
                  className="block w-full text-center bg-gray-400 text-white px-4 py-2 rounded-md cursor-not-allowed"
                >
                  Join Available Soon
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Session Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Cancel Session</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this session? This action cannot be undone.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows="3"
                placeholder="Provide a reason for cancellation..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Keep Session
              </button>
              <button
                onClick={handleCancelSession}
                disabled={cancelling}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionDetailPage;