import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../utils/api';

const AdminDashboard = ({ stats, user }) => {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    totalPatients: 0,
    totalTherapists: 0,
    newUsersThisWeek: 0
  });
  const [sessionStats, setSessionStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadAdminStats = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/admin/stats');
        const { users, sessions } = response.data;
        
        setUserStats(users);
        setSessionStats(sessions);
      } catch (error) {
        console.error('Failed to load admin statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminStats();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user.firstName} {user.lastName}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-1">Total Users</h2>
              <p className="text-3xl font-bold">{userStats.totalUsers}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-1">Patients</h2>
              <p className="text-3xl font-bold">{userStats.totalPatients}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-1">Therapists</h2>
              <p className="text-3xl font-bold">{userStats.totalTherapists}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-1">New This Week</h2>
              <p className="text-3xl font-bold">{userStats.newUsersThisWeek}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-1">Total Sessions</h2>
              <p className="text-3xl font-bold">{sessionStats.totalSessions}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-1">Completed Sessions</h2>
              <p className="text-3xl font-bold">{sessionStats.completedSessions}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-1">Upcoming Sessions</h2>
              <p className="text-3xl font-bold">{sessionStats.upcomingSessions}</p>
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {stats.recentActivity.map((activity) => (
                <li key={activity.id} className="py-3">
                  <div className="flex">
                    <div className="w-full">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No recent activity</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">System Notifications</h2>
          {stats.systemNotifications && stats.systemNotifications.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {stats.systemNotifications.map((notification) => (
                <li key={notification.id} className="py-3">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No system notifications</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Administrative Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/users')}
            className="py-3 px-4 bg-blue-100 rounded-lg text-center hover:bg-blue-200"
          >
            <span className="block text-blue-700 font-medium">Manage Users</span>
          </button>
          <button
            onClick={() => navigate('/admin/sessions')}
            className="py-3 px-4 bg-green-100 rounded-lg text-center hover:bg-green-200"
          >
            <span className="block text-green-700 font-medium">Session Overview</span>
          </button>
          <button
            onClick={() => navigate('/admin/reports')}
            className="py-3 px-4 bg-yellow-100 rounded-lg text-center hover:bg-yellow-200"
          >
            <span className="block text-yellow-700 font-medium">Reports</span>
          </button>
          <button
            onClick={() => navigate('/admin/settings')}
            className="py-3 px-4 bg-purple-100 rounded-lg text-center hover:bg-purple-200"
          >
            <span className="block text-purple-700 font-medium">System Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;