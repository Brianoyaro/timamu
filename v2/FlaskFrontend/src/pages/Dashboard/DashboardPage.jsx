import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
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
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        let dashboardData = {
          upcomingSessions: [],
          notifications: [],
          stats: {}
        };

        // Load data based on user role
        if (user?.role === 'PATIENT') {
          // Load sessions for patient
          const sessionsResponse = await api.get('/sessions');
          dashboardData.upcomingSessions = sessionsResponse.data.slice(0, 5); // Get first 5
          dashboardData.stats = {
            total_sessions: sessionsResponse.data.length,
            upcoming_sessions: dashboardData.upcomingSessions.length
          };
        } else if (user?.role === 'THERAPIST') {
          // Load sessions and patients for therapist
          const [sessionsResponse, patientsResponse] = await Promise.all([
            api.get('/sessions'),
            api.get('/patients')
          ]);
          dashboardData.upcomingSessions = sessionsResponse.data.slice(0, 5);
          dashboardData.stats = {
            total_patients: patientsResponse.data.length,
            total_sessions: sessionsResponse.data.length,
            upcoming_sessions: dashboardData.upcomingSessions.length
          };
        } else if (user?.role === 'ADMIN') {
          // Load comprehensive data for admin
          const [usersResponse, sessionsResponse, patientsResponse, therapistsResponse] = await Promise.all([
            api.get('/admin/users'),
            api.get('/sessions'),
            api.get('/patients'),
            api.get('/therapists')
          ]);
          dashboardData.stats = {
            total_users: usersResponse.data.length,
            total_patients: patientsResponse.data.length,
            total_therapists: therapistsResponse.data.length,
            total_sessions: sessionsResponse.data.length
          };
          dashboardData.upcomingSessions = sessionsResponse.data.slice(0, 5);
        }

        setStats(dashboardData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        // Set empty data on error to prevent crashes
        setStats({
          upcomingSessions: [],
          notifications: [],
          stats: {}
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role) {
      loadDashboardData();
    }
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
  } else if (user?.role === 'ADMIN') {
    return <AdminDashboard stats={stats} user={user} />;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to Timamu</h1>
      <p>Your role is not configured correctly. Please contact support.</p>
    </div>
  );
};

export default DashboardPage;