import { useEffect, useState } from 'react';
import useAuthStore from '../../stores/authStore';
import useSessionStore from '../../stores/sessionStore';
import PatientDashboard from '../../components/Dashboard/PatientDashboard';
import TherapistDashboard from '../../components/Dashboard/TherapistDashboard';
import AdminDashboard from '../../components/Dashboard/AdminDashboard';

export default function DashboardPage() {
  const { user, token } = useAuthStore();
  const { fetchSessions, sessions, isLoading } = useSessionStore();
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        await fetchSessions(token);
        
        // Fetch additional role-specific data
        if (user?.role === 'ADMIN') {
          // Fetch admin analytics
          const response = await fetch('/api/admin/analytics', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const analytics = await response.json();
            setDashboardData(analytics);
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    if (token) {
      loadDashboardData();
    }
  }, [token, user?.role, fetchSessions]);

  const renderDashboard = () => {
    switch (user?.role) {
      case 'PATIENT':
        return <PatientDashboard sessions={sessions} isLoading={isLoading} />;
      case 'THERAPIST':
        return <TherapistDashboard sessions={sessions} isLoading={isLoading} />;
      case 'ADMIN':
        return <AdminDashboard sessions={sessions} analytics={dashboardData} isLoading={isLoading} />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">Welcome to TelePsy</h2>
            <p className="mt-2 text-gray-600">Your dashboard is loading...</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="mt-1 text-gray-600">
              {user?.role === 'PATIENT' && 'Manage your therapy sessions and progress'}
              {user?.role === 'THERAPIST' && 'View your upcoming sessions and patient management'}
              {user?.role === 'ADMIN' && 'Platform overview and administrative controls'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Role-specific Dashboard */}
      {renderDashboard()}
    </div>
  );
}
