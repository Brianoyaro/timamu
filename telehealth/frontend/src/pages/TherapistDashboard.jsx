import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useBookingStore from '../store/bookingStore';
import { therapistsAPI } from '../services/api';
import BookingCard from '../components/BookingCard';

export default function TherapistDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { bookings, fetchBookings, cancelBooking, updateBooking } =
    useBookingStore();

  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [editingAvailability, setEditingAvailability] = useState(false);
  const [availability, setAvailability] = useState({});

  useEffect(() => {
    loadProfile();
    fetchBookings();
  }, []);

  const loadProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const response = await therapistsAPI.getMyProfile();
      setProfile(response.data.data.therapist);
      setAvailability(response.data.data.therapist.availability || {});
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSaveAvailability = async () => {
    try {
      await therapistsAPI.updateAvailability({ availability });
      alert('Availability updated successfully');
      setEditingAvailability(false);
      loadProfile();
    } catch (error) {
      alert('Failed to update availability');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      const result = await cancelBooking(bookingId);
      if (result.success) {
        alert('Booking cancelled successfully');
      } else {
        alert(result.error || 'Failed to cancel booking');
      }
    }
  };

  const handleJoinSession = (bookingId) => {
    navigate(`/session/${bookingId}`);
  };

  const handleCompleteSession = async (bookingId) => {
    if (confirm('Mark this session as completed?')) {
      const result = await updateBooking(bookingId, { status: 'COMPLETED' });
      if (result.success) {
        alert('Session marked as completed');
      } else {
        alert(result.error || 'Failed to update session');
      }
    }
  };

  const upcomingBookings = bookings.filter((b) => b.status === 'SCHEDULED');
  const pastBookings = bookings.filter(
    (b) => b.status === 'COMPLETED' || b.status === 'CANCELLED'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Therapist Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user?.name || 'Therapist'}
              </p>
            </div>
            <button
              onClick={() => useAuthStore.getState().logout()}
              className="btn btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Profile Status */}
        {profile && (
          <section className="mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Profile Status
                  </h2>
                  <div className="flex items-center gap-3">
                    {profile.isApproved ? (
                      <span className="badge badge-success">✓ Approved</span>
                    ) : (
                      <span className="badge badge-warning">
                        ⏳ Pending Approval
                      </span>
                    )}
                    <span className="text-sm text-gray-600">
                      {profile.specialization}
                    </span>
                  </div>
                </div>
              </div>

              {!profile.isApproved && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    Your profile is pending admin approval. You'll be able to
                    accept bookings once approved.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Availability Section */}
        <section className="mb-12">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Availability</h2>
              <button
                onClick={() => setEditingAvailability(!editingAvailability)}
                className="btn btn-secondary"
              >
                {editingAvailability ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editingAvailability ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Add time slots for each day (e.g., "09:00-12:00, 14:00-17:00")
                </p>
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(
                  (day) => (
                    <div key={day}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {day}
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., 09:00-12:00, 14:00-17:00"
                        value={
                          availability[day]
                            ? availability[day].join(', ')
                            : ''
                        }
                        onChange={(e) =>
                          setAvailability({
                            ...availability,
                            [day]: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter((s) => s),
                          })
                        }
                      />
                    </div>
                  )
                )}
                <button
                  onClick={handleSaveAvailability}
                  className="btn btn-primary"
                >
                  Save Availability
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.keys(availability).length === 0 ? (
                  <p className="text-gray-600">No availability set</p>
                ) : (
                  Object.entries(availability).map(([day, slots]) => (
                    <div
                      key={day}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded"
                    >
                      <span className="font-medium capitalize">{day}</span>
                      <span className="text-sm text-gray-600">
                        {slots.join(', ')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Sessions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Upcoming Sessions ({upcomingBookings.length})
          </h2>

          {upcomingBookings.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-600">No upcoming sessions</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  role="THERAPIST"
                  onCancel={handleCancelBooking}
                  onJoinSession={handleJoinSession}
                />
              ))}
            </div>
          )}
        </section>

        {/* Past Sessions */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Past Sessions ({pastBookings.length})
          </h2>

          {pastBookings.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-600">No past sessions</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pastBookings.slice(0, 6).map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  role="THERAPIST"
                  onCancel={handleCancelBooking}
                  onJoinSession={handleJoinSession}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
