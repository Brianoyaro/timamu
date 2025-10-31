import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import useUnreadMessages from '../../hooks/useUnreadMessages';

// Components
import SessionCard from '../../components/Sessions/SessionCard';
import { 
  FaUserMd, 
  FaCalendarDay, 
  FaUsers, 
  FaBell, 
  FaClock, 
  FaVideo, 
  FaEye, 
  FaCalendarAlt,
  FaUserFriends,
  FaCommentMedical,
  FaClipboardList,
  FaUserCog,
  FaExclamationTriangle,
  FaPlus,
  FaChevronRight
} from 'react-icons/fa';
import { 
  HiOutlineVideoCamera, 
  HiOutlineUser, 
  HiOutlineBell, 
  HiOutlineCalendar,
  HiOutlineChatAlt2,
  HiOutlineClipboardList,
  HiOutlineCog
} from 'react-icons/hi';

const TherapistDashboard = ({ stats, user }) => {
  const navigate = useNavigate();
  const [selectedTimeframe, setSelectedTimeframe] = useState('today');
  const { 
    sessions, 
    todaySessions, 
    upcomingSessions, 
    fetchSessions, 
    loading: sessionsLoading 
  } = useSessionStore();
  const unreadCount = useUnreadMessages();
  
  useEffect(() => {
    // Fetch sessions when the component mounts
    fetchSessions({ 
      status: 'all',
      include_old: true
    });
  }, []);

  // Get current time and date for real-time display
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Calculate stats
  const todaySessionsCount = todaySessions?.length || 0;
  const upcomingSessionsCount = upcomingSessions?.length || 0;
  const totalPatientsCount = stats.stats?.total_patients || 0;
  const unreadNotifications = stats.notifications?.filter(n => !n.read)?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Welcome Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FaUserMd className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Welcome back, Dr. {user.last_name || user.lastName}
                  </h1>
                  <p className="text-gray-600 flex items-center gap-2">
                    <FaClock className="w-4 h-4" />
                    {currentDate} • {currentTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <FaCalendarDay className="w-4 h-4 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-600">{todaySessionsCount}</div>
                </div>
                <div className="text-sm text-gray-600">Today's Sessions</div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <FaUsers className="w-4 h-4 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">{totalPatientsCount}</div>
                </div>
                <div className="text-sm text-gray-600">Total Patients</div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <FaClock className="w-4 h-4 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-600">{upcomingSessionsCount}</div>
                </div>
                <div className="text-sm text-gray-600">Upcoming</div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm relative">
                <div className="flex items-center gap-2 mb-1">
                  <FaBell className="w-4 h-4 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-600">{unreadNotifications}</div>
                </div>
                <div className="text-sm text-gray-600">Notifications</div>
                {unreadNotifications > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Today's Schedule Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">Today's Schedule</h2>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/sessions/availability')}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FaCalendarAlt className="w-4 h-4 mr-2" />
                Manage Availability
              </button>
            </div>
          </div>

          {todaySessions && todaySessions.length > 0 ? (
            <div className="grid gap-4">
              {todaySessions.map((session) => (
                <SessionCard 
                  key={session.id}
                  session={session}
                  compact={true}
                  therapistView={true}
                  extraActions={
                    <button
                      onClick={() => navigate(`/patients/${session.patient_id}`)}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      <FaEye className="w-4 h-4 mr-2" />
                      View Patient
                    </button>
                  }
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCalendarAlt className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions scheduled for today</h3>
              <p className="text-gray-600 mb-6">Take some time to review patient progress or plan upcoming sessions.</p>
              <button
                onClick={() => navigate('/sessions/availability')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <FaCalendarAlt className="w-4 h-4 mr-2" />
                Set Your Availability
              </button>
            </div>
          )}
        </div>

        {/* Grid Layout for Secondary Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Patient Updates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Patient Updates</h3>
                <button
                  onClick={() => navigate('/patients')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              {stats.patient_updates && stats.patient_updates.length > 0 ? (
                <div className="space-y-4">
                  {stats.patient_updates.slice(0, 4).map((update) => (
                    <div key={update.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <HiOutlineUser className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{update.patient_name}</p>
                        <p className="text-sm text-gray-600 mt-1">{update.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(update.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaUserFriends className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600">No recent patient updates</p>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {unreadNotifications > 0 && (
                  <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
                    {unreadNotifications} new
                  </span>
                )}
              </div>
            </div>
            <div className="p-6">
              {stats.notifications && stats.notifications.length > 0 ? (
                <div className="space-y-4">
                  {stats.notifications.slice(0, 4).map((notification) => (
                    <div key={notification.id} className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-blue-400' : 'hover:bg-gray-50'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notification.type === 'urgent' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {notification.type === 'urgent' ? (
                          <FaExclamationTriangle className="w-4 h-4 text-red-600" />
                        ) : (
                          <HiOutlineBell className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <HiOutlineBell className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600">No new notifications</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/patients')}
                className="group p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300/50 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FaUserFriends className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-blue-900 mb-2">View Patients</h4>
                <p className="text-sm text-blue-700">Manage your patient roster</p>
              </button>

              <button
                onClick={() => navigate('/messages')}
                className="group relative p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200/50 hover:from-green-100 hover:to-emerald-100 hover:border-green-300/50 transition-all duration-200"
              >
                {unreadCount > 0 && (
                  <div className="absolute top-4 right-4 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white">{unreadCount}</span>
                  </div>
                )}
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <HiOutlineChatAlt2 className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-green-900 mb-2">Messages</h4>
                <p className="text-sm text-green-700">Communicate with patients</p>
              </button>

              <button
                onClick={() => navigate('/assignments')}
                className="group p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200/50 hover:from-purple-100 hover:to-violet-100 hover:border-purple-300/50 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <HiOutlineClipboardList className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-purple-900 mb-2">Assignments</h4>
                <p className="text-sm text-purple-700">Track patient progress</p>
              </button>

              <button
                onClick={() => navigate('/profile')}
                className="group p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200/50 hover:from-orange-100 hover:to-amber-100 hover:border-orange-300/50 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <HiOutlineCog className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-orange-900 mb-2">Profile</h4>
                <p className="text-sm text-orange-700">Manage your settings</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistDashboard;