import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useTokenValidator } from '../../hooks/useTokenValidator';
import api from '../../utils/api';

// Dashboard Components
import PatientDashboard from '../../components/Dashboard/PatientDashboard';
import TherapistDashboard from '../../components/Dashboard/TherapistDashboard';
import AdminDashboard from '../../components/Dashboard/AdminDashboard';

const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    upcomingSessions: [],
    notifications: [],
    sessions: {
      today: [],
      upcoming: [],
      this_week: []
    },
    stats: {},
    patient_updates: [],
    todaySessions: []
  });

  // Validate token every 5 minutes instead of every minute to reduce API calls
  useTokenValidator(300000); // 5 minutes

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.role) return;
      
      setIsLoading(true);
      try {
        // Use the new unified dashboard endpoint
        const dashboardResponse = await api.get('/dashboard/stats');
        setStats(dashboardResponse.data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        // Set empty data on error to prevent crashes
        setStats({
          upcomingSessions: [],
          notifications: [],
          patientUpdates: [],
          todaySessions: [],
          stats: {}
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.role]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Render different dashboard based on user role
  if (user?.role === 'PATIENT') {
    return <PatientDashboard stats={stats} user={user} />;
  } else if (user?.role === 'THERAPIST') {
    return <TherapistDashboard stats={stats} user={user} />;
  } else if (user?.role === 'ADMIN' || user?.role === 'admin') {
    console.log('[DashboardPage] Rendering AdminDashboard for user role:', user.role);
    return <AdminDashboard stats={stats} user={user} />;
  }

  console.log('[DashboardPage] Unknown user role:', user?.role);
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to Timamu</h1>
      <p>Your role ({user?.role}) is not configured correctly. Please contact support.</p>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-bold">Debug Info:</h3>
        <p>User ID: {user?.id}</p>
        <p>User Role: {user?.role}</p>
        <p>User Email: {user?.email}</p>
      </div>
    </div>
  );
};

export default DashboardPage;