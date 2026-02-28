import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import useAuthStore from '../store/authStore';
import useBookingStore from '../store/bookingStore';

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { fetchBooking, cancelBooking, updateBooking } = useBookingStore();

  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchBooking(id);
      if (result.success) {
        setBooking(result.booking);
        setNotes(result.booking.notes || '');
      } else {
        setError(result.error || 'Failed to load booking');
      }
    } catch (err) {
      setError('Failed to load booking details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      const result = await cancelBooking(id);
      if (result.success) {
        alert('Booking cancelled successfully');
        loadBooking();
      } else {
        alert(result.error || 'Failed to cancel booking');
      }
    }
  };

  const handleUpdateNotes = async () => {
    const result = await updateBooking(id, { notes });
    if (result.success) {
      alert('Notes updated successfully');
      setIsEditingNotes(false);
      loadBooking();
    } else {
      alert(result.error || 'Failed to update notes');
    }
  };

  const handleCompleteSession = async () => {
    if (confirm('Mark this session as completed?')) {
      const result = await updateBooking(id, { status: 'COMPLETED' });
      if (result.success) {
        alert('Session marked as completed');
        loadBooking();
      } else {
        alert(result.error || 'Failed to update session');
      }
    }
  };

  const handleJoinSession = () => {
    navigate(`/session/${id}`);
  };

  const canJoinSession = () => {
    if (!booking || booking.status !== 'SCHEDULED') return false;

    const scheduledDate = new Date(booking.scheduledAt);
    const now = new Date();

    // Can join 10 minutes before scheduled time
    const tenMinutesBefore = new Date(scheduledDate.getTime() - 10 * 60000);

    return now >= tenMinutesBefore;
  };

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
      return format(date, 'MMMM dd, yyyy - hh:mm a');
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Booking Details
            </h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Booking Details
            </h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="card text-center py-12">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Booking
            </h2>
            <p className="text-gray-600 mb-6">{error || 'Booking not found'}</p>
            <button onClick={() => navigate(-1)} className="btn btn-primary">
              Go Back
            </button>
          </div>
        </main>
      </div>
    );
  }

  const isPatient = user?.role === 'PATIENT';
  const isTherapist = user?.role === 'THERAPIST';
  const otherPerson = isPatient ? booking.therapist : booking.patient;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              Booking Details
            </h1>
            <button onClick={() => navigate(-1)} className="btn btn-secondary">
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Status and Actions Card */}
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Session Information
              </h2>
              <span className={getStatusBadge(booking.status)}>
                {booking.status}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            {booking.status === 'SCHEDULED' && canJoinSession() && (
              <button onClick={handleJoinSession} className="btn btn-success">
                Join Session
              </button>
            )}

            {booking.status === 'SCHEDULED' && !canJoinSession() && (
              <button
                disabled
                className="btn btn-secondary opacity-50 cursor-not-allowed"
                title="You can join 10 minutes before the scheduled time"
              >
                Join Session
              </button>
            )}

            {booking.status === 'SCHEDULED' && isTherapist && (
              <button onClick={handleCompleteSession} className="btn btn-primary">
                Mark as Completed
              </button>
            )}

            {booking.status === 'SCHEDULED' && (
              <button onClick={handleCancel} className="btn btn-danger">
                Cancel Booking
              </button>
            )}
          </div>

          {/* Scheduled Time */}
          <div className="border-t pt-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Scheduled Date & Time
                </h3>
                <p className="text-lg text-gray-900">
                  {formatDateTime(booking.scheduledAt)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Booking ID
                </h3>
                <p className="text-sm text-gray-700 font-mono">{booking.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Participant Information */}
        <div className="card mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {isPatient ? 'Therapist Information' : 'Patient Information'}
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Name</h4>
              <p className="text-lg text-gray-900">
                {otherPerson?.name || 'Not provided'}
              </p>
            </div>

            {otherPerson?.email && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  Email
                </h4>
                <p className="text-gray-900">{otherPerson.email}</p>
              </div>
            )}

            {otherPerson?.phone && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  Phone
                </h4>
                <p className="text-gray-900">{otherPerson.phone}</p>
              </div>
            )}

            {isPatient && booking.therapist?.therapistProfile && (
              <>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Specialization
                  </h4>
                  <p className="text-gray-900">
                    {booking.therapist.therapistProfile.specialization}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    License Number
                  </h4>
                  <p className="text-gray-900">
                    {booking.therapist.therapistProfile.licenseNumber}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Session Notes */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Session Notes</h3>
            {(isTherapist || (isPatient && booking.status === 'SCHEDULED')) &&
              !isEditingNotes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="btn btn-secondary"
                >
                  Edit
                </button>
              )}
          </div>

          {isEditingNotes ? (
            <div className="space-y-4">
              <textarea
                className="input"
                rows={6}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add session notes..."
              />
              <div className="flex gap-3">
                <button onClick={handleUpdateNotes} className="btn btn-primary">
                  Save Notes
                </button>
                <button
                  onClick={() => {
                    setIsEditingNotes(false);
                    setNotes(booking.notes || '');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg">
              {booking.notes ? (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {booking.notes}
                </p>
              ) : (
                <p className="text-gray-500 italic">No notes added yet</p>
              )}
            </div>
          )}
        </div>

        {/* Session Information */}
        {booking.session && (
          <div className="card">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Video Session
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium mb-2">
                  ✓ Session has been started
                </p>
                <p className="text-sm text-green-700">
                  Room: {booking.session.livekitRoom}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  Session Started
                </h4>
                <p className="text-gray-900">
                  {formatDateTime(booking.session.startedAt)}
                </p>
              </div>

              {booking.session.endedAt && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Session Ended
                  </h4>
                  <p className="text-gray-900">
                    {formatDateTime(booking.session.endedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Helpful Info */}
        {booking.status === 'SCHEDULED' && !canJoinSession() && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You can join the session 10 minutes before
              the scheduled time.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
