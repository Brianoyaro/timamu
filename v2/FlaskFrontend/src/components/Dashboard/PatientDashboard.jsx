import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTokenValidator } from '../../hooks/useTokenValidator';
import { useSessionStore } from '../../stores/sessionStore';
import api from '../../utils/api';

// Components
import SessionCard from '../../components/Sessions/SessionCard';

// Icons
import { 
  FiCalendar, 
  FiClock, 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiSettings, 
  FiVideo, 
  FiMessageSquare,
  FiBook,
  FiActivity,
  FiAlertCircle,
  FiPlus,
  FiArrowRight,
  FiStar,
  FiTrendingUp,
  FiCheckCircle,
  FiXCircle,
  FiX
} from 'react-icons/fi';

const PatientDashboard = ({ stats, user }) => {
  const navigate = useNavigate();
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    upcomingCount: 0,
    thisWeekCount: 0
  });
  
  // Use the global session store instead of local state
  const { 
    sessions, 
    todaySessions, 
    upcomingSessions, 
    fetchSessions, 
    loading: sessionsLoading 
  } = useSessionStore();

  // Validate token
  useTokenValidator(300000);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Use the global session store to fetch sessions
      await fetchSessions({ 
        status: 'all',
        include_old: true
      });
      
      // Calculate dashboard stats using the global store's data
      setDashboardStats({
        totalSessions: sessions.length,
        completedSessions: sessions.filter(s => s.status === 'completed').length,
        upcomingCount: upcomingSessions.length,
        thisWeekCount: todaySessions.length + upcomingSessions.length
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // These utility functions are now handled by the SessionCard component

  const quickActions = [
    {
      icon: FiCalendar,
      label: 'Schedule Session',
      description: 'Book your next therapy session',
      color: 'blue',
      action: () => navigate('/sessions/schedule')
    },
    {
      icon: FiMessageSquare,
      label: 'Messages',
      description: 'Chat with your therapist',
      color: 'green',
      action: () => navigate('/messages')
    },
    {
      icon: FiBook,
      label: 'My Sessions',
      description: 'View all your sessions',
      color: 'purple',
      action: () => navigate('/sessions')
    },
    {
      icon: FiUser,
      label: 'Profile',
      description: 'Manage your profile',
      color: 'gray',
      action: () => navigate('/profile')
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      gray: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
      red: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
    };
    return colors[color] || colors.gray;
  };

  if (loading || sessionsLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {user.first_name}! 👋
                </h1>
                <p className="text-indigo-100 text-lg">
                  Ready to continue your wellness journey?
                </p>
              </div>
              <button
                onClick={() => setShowEmergencyModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FiAlertCircle className="h-5 w-5" />
                Emergency Help
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiActivity className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalSessions}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiCheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.completedSessions}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiClock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.upcomingCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FiTrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.thisWeekCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Today's Sessions & Upcoming */}
          <div className="lg:col-span-2 space-y-8">
            {/* Today's Sessions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FiCalendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Today's Sessions</h2>
                  </div>
                  <Link
                    to="/sessions"
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                  >
                    View All <FiArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                {todaySessions.length > 0 ? (
                  <div className="space-y-4">
                    {todaySessions.map((session) => (
                      <SessionCard 
                        key={session.id} 
                        session={session} 
                        compact={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <FiCalendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions today</h3>
                    <p className="text-gray-600 mb-4">You have a free day! Want to schedule a session?</p>
                    <button
                      onClick={() => navigate('/sessions/schedule')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                      <FiPlus className="h-4 w-4" />
                      Schedule Session
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FiClock className="h-5 w-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Upcoming This Week</h2>
                </div>
              </div>
              
              <div className="p-6">
                {upcomingSessions.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSessions.slice(0, 3).map((session) => (
                      <SessionCard 
                        key={session.id} 
                        session={session} 
                        compact={true} 
                        miniView={true}
                      />
                    ))}
                    {upcomingSessions.length > 3 && (
                      <div className="text-center pt-3">
                        <Link
                          to="/sessions"
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          +{upcomingSessions.length - 3} more sessions
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-600">No upcoming sessions this week</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Emergency */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FiSettings className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className={`w-full p-4 rounded-lg border transition-all duration-200 text-left ${getColorClasses(action.color)}`}
                    >
                      <div className="flex items-center gap-3">
                        <action.icon className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{action.label}</p>
                          <p className="text-sm opacity-80">{action.description}</p>
                        </div>
                        <FiArrowRight className="h-4 w-4 ml-auto" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Wellness Tips */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FiStar className="h-5 w-5 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Wellness Tip</h2>
                </div>
                <p className="text-gray-700 mb-4">
                  "Take 5 minutes today to practice deep breathing. It can help reduce stress and improve your mood."
                </p>
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                  <FiCheckCircle className="h-4 w-4" />
                  Try it now
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Need Support?</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowEmergencyModal(true)}
                    className="w-full p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 hover:bg-red-100 transition-colors flex items-center gap-2"
                  >
                    <FiAlertCircle className="h-4 w-4" />
                    Emergency Help
                  </button>
                  <button
                    onClick={() => navigate('/contact')}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    <FiMail className="h-4 w-4" />
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FiAlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Emergency Support</h3>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">Crisis Hotline</h4>
                <p className="text-red-700 mb-3">
                  If you're in immediate danger or having thoughts of self-harm, please call:
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <FiPhone className="h-4 w-4 text-red-600" />
                  <a href="tel:988" className="font-mono text-lg font-bold text-red-800">988</a>
                </div>
                <p className="text-sm text-red-600">Available 24/7</p>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Platform Support</h4>
                <p className="text-blue-700 mb-3">
                  For urgent mental health support through our platform:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FiMail className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800">emergency@timamu.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800">1-800-TIMAMU-1</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => window.open('tel:988')}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FiPhone className="h-4 w-4" />
                  Call 988
                </button>
                <button
                  onClick={() => setShowEmergencyModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;