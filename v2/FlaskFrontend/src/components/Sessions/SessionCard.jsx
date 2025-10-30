import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SessionStatusBadge from './SessionStatusBadge';
import SessionTimer from './SessionTimer';
import { useSessionStore } from '../../stores/sessionStore';
import { FiCalendar, FiClock, FiUser, FiVideo, FiEye, FiX, FiStar } from 'react-icons/fi';

const SessionCard = ({ 
  session, 
  compact = false, 
  miniView = false,
  therapistView = false,
  extraActions = null
}) => {
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const { cancelSession } = useSessionStore();
  
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return `${formattedDate} at ${formattedTime}`;
  };
  
  const handleCancelSession = async () => {
    setCancelling(true);
    const result = await cancelSession(session.id, cancelReason);
    setCancelling(false);
    
    if (result.success) {
      setShowCancelModal(false);
    } else {
      // Handle error
      alert(result.error || 'Failed to cancel session');
    }
  };
  
  const handleJoinSession = () => {
    navigate(`/video-call/${session.room_id}`);
  };
  
  const canJoin = session.can_join && ['scheduled', 'started'].includes(session.status);
  const canCancel = session.status === 'scheduled';
  
  // Mini view for upcoming sessions in dashboard
  if (miniView) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FiUser className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{session.title}</p>
            <p className="text-xs text-gray-600">{formatDateTime(session.scheduled_at)}</p>
          </div>
        </div>
        <Link
          to={`/sessions/${session.id}`}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          View
        </Link>
      </div>
    );
  }
  
  // Compact view for dashboard today's sessions
  if (compact) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-md">
              <FiCalendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{session.title}</h4>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-600">{formatDateTime(session.scheduled_at)}</p>
                <SessionStatusBadge status={session.status} small />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {therapistView 
                  ? `Patient: ${session.patient_name}` 
                  : `Dr. ${session.therapist_name}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {canJoin && (
              <button
                onClick={handleJoinSession}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 text-sm transition-colors"
              >
                <FiVideo className="h-3 w-3" />
                Join
              </button>
            )}
            
            <Link
              to={`/sessions/${session.id}`}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 text-sm transition-colors"
            >
              Details
            </Link>
            
            {extraActions}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-xl text-gray-900">{session.title}</h3>
            <SessionStatusBadge status={session.status} />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
            <div className="flex items-center gap-2">
              <FiCalendar className="h-4 w-4 text-gray-500" />
              <span>{formatDateTime(session.scheduled_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <FiClock className="h-4 w-4 text-gray-500" />
              <span>{session.duration} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <FiUser className="h-4 w-4 text-gray-500" />
              <span>
                {therapistView || session.patient_name 
                  ? `Patient: ${session.patient_name}` 
                  : `Dr. ${session.therapist_name}`}
              </span>
            </div>
          </div>
          
          {session.scheduled_at && (
            <div className="mt-3">
              <SessionTimer scheduledAt={session.scheduled_at} status={session.status} />
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          {canJoin && (
            <button
              onClick={handleJoinSession}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <FiVideo className="h-4 w-4" />
              Join Session
            </button>
          )}
          
          {session.status === 'completed' && !session.has_review && !therapistView && (
            <Link
              to={`/therapists/${session.therapist_id}?review=true`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <FiStar className="h-4 w-4" />
              Write Review
            </Link>
          )}
          
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="border border-red-300 text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <FiX className="h-4 w-4" />
              Cancel
            </button>
          )}
          
          <Link
            to={`/sessions/${session.id}`}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <FiEye className="h-4 w-4" />
            Details
          </Link>
          
          {extraActions}
        </div>
      </div>
      
      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Cancel Session</h3>
            <p className="mb-4 text-gray-600">
              Are you sure you want to cancel this session? Please provide a reason:
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-4 min-h-24"
              placeholder="Reason for cancellation (optional)"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Keep Session
              </button>
              <button
                onClick={handleCancelSession}
                disabled={cancelling}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionCard;
