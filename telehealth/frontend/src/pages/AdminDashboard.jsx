import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { adminAPI } from '../services/api';

export default function AdminDashboard() {
  const { user } = useAuthStore();

  const [metrics, setMetrics] = useState(null);
  const [therapists, setTherapists] = useState([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isLoadingTherapists, setIsLoadingTherapists] = useState(false);
  const [filter, setFilter] = useState('pending'); // 'pending' or 'all'

  useEffect(() => {
    loadMetrics();
    loadTherapists();
  }, [filter]);

  const loadMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const response = await adminAPI.getMetrics();
      setMetrics(response.data.data.metrics);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  const loadTherapists = async () => {
    setIsLoadingTherapists(true);
    try {
      const params = filter === 'pending' ? { isApproved: 'false' } : {};
      const response = await adminAPI.getTherapists(params);
      setTherapists(response.data.data.therapists);
    } catch (error) {
      console.error('Failed to load therapists:', error);
    } finally {
      setIsLoadingTherapists(false);
    }
  };

  const handleApproveTherapist = async (therapistId, isApproved) => {
    const action = isApproved ? 'approve' : 'reject';
    if (confirm(`Are you sure you want to ${action} this therapist?`)) {
      try {
        await adminAPI.updateTherapistApproval(therapistId, { isApproved });
        alert(`Therapist ${action}d successfully`);
        loadTherapists();
        loadMetrics();
      } catch (error) {
        alert(`Failed to ${action} therapist`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                System Overview & Management
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
        {/* System Metrics */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            System Metrics
          </h2>

          {isLoadingMetrics ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : metrics ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Total Users */}
              <div className="card">
                <div className="text-sm text-gray-600 mb-1">Total Users</div>
                <div className="text-3xl font-bold text-gray-900">
                  {metrics.users.total}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Patients: {metrics.users.patients} | Therapists:{' '}
                  {metrics.users.therapists}
                </div>
              </div>

              {/* Therapists */}
              <div className="card">
                <div className="text-sm text-gray-600 mb-1">Therapists</div>
                <div className="text-3xl font-bold text-green-600">
                  {metrics.therapists.approved}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Approved | Pending: {metrics.therapists.pending}
                </div>
              </div>

              {/* Total Bookings */}
              <div className="card">
                <div className="text-sm text-gray-600 mb-1">Total Bookings</div>
                <div className="text-3xl font-bold text-primary-600">
                  {metrics.bookings.total}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Scheduled: {metrics.bookings.scheduled}
                </div>
              </div>

              {/* Sessions */}
              <div className="card">
                <div className="text-sm text-gray-600 mb-1">
                  Completed Sessions
                </div>
                <div className="text-3xl font-bold text-purple-600">
                  {metrics.bookings.completed}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Total sessions: {metrics.sessions.total}
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-600">Failed to load metrics</p>
            </div>
          )}
        </section>

        {/* Booking Status Breakdown */}
        {metrics && (
          <section className="mb-12">
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Booking Status Overview
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics.bookings.scheduled}
                  </div>
                  <div className="text-sm text-gray-600">Scheduled</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {metrics.bookings.completed}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded">
                  <div className="text-2xl font-bold text-red-600">
                    {metrics.bookings.cancelled}
                  </div>
                  <div className="text-sm text-gray-600">Cancelled</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Therapist Management */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Therapist Management
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('pending')}
                className={`btn ${
                  filter === 'pending' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                Pending ({metrics?.therapists.pending || 0})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`btn ${
                  filter === 'all' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                All Therapists
              </button>
            </div>
          </div>

          {isLoadingTherapists ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : therapists.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-600">
                {filter === 'pending'
                  ? 'No pending therapists'
                  : 'No therapists found'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {therapists.map((therapist) => (
                <div key={therapist.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {therapist.user.name || 'Unnamed Therapist'}
                      </h3>
                      <p className="text-sm text-primary-600">
                        {therapist.specialization}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {therapist.user.email}
                      </p>
                    </div>
                    {therapist.isApproved ? (
                      <span className="badge badge-success">Approved</span>
                    ) : (
                      <span className="badge badge-warning">Pending</span>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">License:</span>{' '}
                      {therapist.licenseNumber}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {therapist.bio}
                    </p>
                  </div>

                  {!therapist.isApproved && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleApproveTherapist(therapist.userId, true)
                        }
                        className="flex-1 btn btn-success"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          handleApproveTherapist(therapist.userId, false)
                        }
                        className="flex-1 btn btn-danger"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {therapist.isApproved && (
                    <button
                      onClick={() =>
                        handleApproveTherapist(therapist.userId, false)
                      }
                      className="w-full btn btn-danger"
                    >
                      Revoke Approval
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
