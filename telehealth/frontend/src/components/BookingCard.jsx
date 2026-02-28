import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function BookingCard({ booking, onCancel, onJoinSession, role }) {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    const badges = {
      SCHEDULED: 'badge badge-info',
      COMPLETED: 'badge badge-success',
      CANCELLED: 'badge badge-danger',
    };
    return badges[status] || 'badge badge-info';
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy - hh:mm a');
    } catch (error) {
      return dateString;
    }
  };

  const canJoinSession = () => {
    if (booking.status !== 'SCHEDULED') return false;
    
    const scheduledDate = new Date(booking.scheduledAt);
    const now = new Date();
    
    // Can join 10 minutes before scheduled time
    const tenMinutesBefore = new Date(scheduledDate.getTime() - 10 * 60000);
    
    return now >= tenMinutesBefore;
  };

  const isPatient = role === 'PATIENT';
  const otherPerson = isPatient ? booking.therapist : booking.patient;

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {isPatient ? 'Session with ' : 'Session with '}
              {otherPerson?.name || 'User'}
            </h3>
            <span className={getStatusBadge(booking.status)}>
              {booking.status}
            </span>
          </div>

          {isPatient && booking.therapist.therapistProfile && (
            <p className="text-sm text-primary-600">
              {booking.therapist.therapistProfile.specialization}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{formatDateTime(booking.scheduledAt)}</span>
        </div>

        {otherPerson?.email && (
          <div className="flex items-center text-sm text-gray-600">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>{otherPerson.email}</span>
          </div>
        )}
      </div>

      {booking.notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Notes:</span> {booking.notes}
          </p>
        </div>
      )}

      {booking.session && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-800 font-medium">
            Session has been started
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {booking.status === 'SCHEDULED' && canJoinSession() && (
          <button
            onClick={() => onJoinSession(booking.id)}
            className="flex-1 btn btn-success"
          >
            Join Session
          </button>
        )}

        {booking.status === 'SCHEDULED' && !canJoinSession() && (
          <button
            disabled
            className="flex-1 btn btn-secondary opacity-50 cursor-not-allowed"
            title="You can join 10 minutes before the scheduled time"
          >
            Join Session
          </button>
        )}

        {booking.status === 'SCHEDULED' && (
          <button
            onClick={() => onCancel(booking.id)}
            className="btn btn-danger"
          >
            Cancel
          </button>
        )}

        <button
          onClick={() => navigate(`/bookings/${booking.id}`)}
          className="btn btn-secondary"
        >
          Details
        </button>
      </div>
    </div>
  );
}
