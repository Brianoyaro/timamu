import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useBookingStore from '../store/bookingStore';
import { therapistsAPI } from '../services/api';
import TherapistCard from '../components/TherapistCard';
import BookingCard from '../components/BookingCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { bookings, fetchBookings, cancelBooking } = useBookingStore();

  const [therapists, setTherapists] = useState([]);
  const [isLoadingTherapists, setIsLoadingTherapists] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [bookingData, setBookingData] = useState({
    scheduledAt: '',
    notes: '',
  });

  useEffect(() => {
    loadTherapists();
    fetchBookings();
  }, []);

  const loadTherapists = async () => {
    setIsLoadingTherapists(true);
    try {
      const response = await therapistsAPI.getAll();
      setTherapists(response.data.data.therapists);
    } catch (error) {
      console.error('Failed to load therapists:', error);
    } finally {
      setIsLoadingTherapists(false);
    }
  };

  const handleBookSession = (therapist) => {
    setSelectedTherapist(therapist);
    setShowBookingModal(true);
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();

    if (!selectedTherapist || !bookingData.scheduledAt) {
      alert('Please select a date and time');
      return;
    }

    try {
      const result = await useBookingStore.getState().createBooking({
        therapistId: selectedTherapist.userId,
        scheduledAt: new Date(bookingData.scheduledAt).toISOString(),
        notes: bookingData.notes,
      });

      if (result.success) {
        alert('Booking created successfully!');
        setShowBookingModal(false);
        setBookingData({ scheduledAt: '', notes: '' });
        setSelectedTherapist(null);
      } else {
        alert(result.error || 'Failed to create booking');
      }
    } catch (error) {
      alert('Failed to create booking');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {user?.name || 'Patient'}
            </h1>
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
        {/* My Bookings Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            My Sessions
          </h2>

          {bookings.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-600 mb-4">
                You don't have any bookings yet
              </p>
              <p className="text-sm text-gray-500">
                Browse therapists below to book your first session
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  role="PATIENT"
                  onCancel={handleCancelBooking}
                  onJoinSession={handleJoinSession}
                />
              ))}
            </div>
          )}
        </section>

        {/* Available Therapists Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Available Therapists
          </h2>

          {isLoadingTherapists ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading therapists...</p>
            </div>
          ) : therapists.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-600">No therapists available at the moment</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {therapists.map((therapist) => (
                <TherapistCard
                  key={therapist.id}
                  therapist={therapist}
                  onBook={handleBookSession}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Booking Modal */}
      {showBookingModal && selectedTherapist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Book Session with {selectedTherapist.user.name}
            </h3>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  className="input"
                  value={bookingData.scheduledAt}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      scheduledAt: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Any specific concerns or topics..."
                  value={bookingData.notes}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      notes: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex gap-3">
                <button type="submit" className="flex-1 btn btn-primary">
                  Confirm Booking
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedTherapist(null);
                    setBookingData({ scheduledAt: '', notes: '' });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
