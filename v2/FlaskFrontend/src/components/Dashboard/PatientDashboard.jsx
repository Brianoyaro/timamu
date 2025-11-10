import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTokenValidator } from '../../hooks/useTokenValidator';
import { useSessionStore } from '../../stores/sessionStore';
import useMessageStore from '../../stores/messageStore';
import api from '../../utils/api';
import { format } from 'date-fns';

// Components
import SessionCard from '../../components/Sessions/SessionCard';
import WellnessTip from './WellnessTip';

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
  FiX,
  FiHeart,
  FiClipboard,
  FiAward,
  FiBell
} from 'react-icons/fi';

const PatientDashboard = ({ stats, user }) => {
  const navigate = useNavigate();
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nextSession, setNextSession] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    upcomingCount: 0,
    thisWeekCount: 0,
    completionRate: 0,
    streakCount: 0,
    lastSessionDate: null
  });
  
  // Use global stores
  const { 
    sessions, 
    todaySessions, 
    upcomingSessions, 
    fetchSessions, 
    loading: sessionsLoading 
  } = useSessionStore();

  const { 
    unreadCount: messageCount,
    fetchUnreadCount 
  } = useMessageStore();

  // Validate token
  useTokenValidator(300000);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Calculate streak count
  const calculateStreak = (sessions) => {
    const completedSessions = sessions
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (completedSessions.length === 0) return 0;

    let streak = 1;
    let lastDate = new Date(completedSessions[0].date);

    for (let i = 1; i < completedSessions.length; i++) {
      const currentDate = new Date(completedSessions[i].date);
      const diffTime = Math.abs(lastDate - currentDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 7) { // Consider weekly sessions for streak
        streak++;
        lastDate = currentDate;
      } else {
        break;
      }
    }
    return streak;
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch sessions and message count
      await Promise.all([
        fetchSessions({ 
          status: 'all',
          include_old: true
        }),
        fetchUnreadCount()
      ]);
      
      // Find next session
      const upcoming = [...todaySessions, ...upcomingSessions]
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setNextSession(upcoming[0] || null);

      // Calculate completion rate
      const completedCount = sessions.filter(s => s.status === 'completed').length;
      const totalScheduled = sessions.filter(s => s.status !== 'cancelled').length;
      const completionRate = totalScheduled > 0 
        ? Math.round((completedCount / totalScheduled) * 100) 
        : 0;

      // Get last session date
      const lastSession = sessions
        .filter(s => s.status === 'completed')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      
      // Calculate dashboard stats
      setDashboardStats({
        totalSessions: sessions.length,
        completedSessions: completedCount,
        upcomingCount: upcomingSessions.length,
        thisWeekCount: todaySessions.length + upcomingSessions.length,
        completionRate,
        streakCount: calculateStreak(sessions),
        lastSessionDate: lastSession?.date || null
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
      action: () => navigate('/sessions/schedule'),
      badge: null
    },
    {
      icon: FiMessageSquare,
      label: 'Messages',
      description: 'Chat with your therapist',
      color: 'green',
      action: () => navigate('/messages'),
      badge: messageCount > 0 ? messageCount : null
    },
    {
      icon: FiVideo,
      label: 'Join Session',
      description: todaySessions.length > 0 ? 'You have a session today' : 'No sessions today',
      color: 'purple',
      action: () => todaySessions.length > 0 ? navigate(`/sessions/${todaySessions[0].id}/call`) : navigate('/sessions/schedule'),
      badge: todaySessions.length > 0 ? 'Today' : null,
      disabled: todaySessions.length === 0
    },
    {
      icon: FiBook,
      label: 'My Sessions',
      description: `${dashboardStats.completedSessions} sessions completed`,
      color: 'indigo',
      action: () => navigate('/sessions'),
      badge: null
    },
    {
      icon: FiClipboard,
      label: 'Session Notes',
      description: 'View your therapy notes',
      color: 'yellow',
      action: () => navigate('/sessions/notes'),
      badge: null
    },
    {
      icon: FiUser,
      label: 'Profile',
      description: 'Manage your profile',
      color: 'gray',
      action: () => navigate('/profile'),
      badge: null
    }
  ];

  const getColorClasses = (color, disabled = false) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50 hover:bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: 'bg-blue-100'
      },
      green: {
        bg: 'bg-green-50 hover:bg-green-100',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: 'bg-green-100'
      },
      purple: {
        bg: 'bg-purple-50 hover:bg-purple-100',
        text: 'text-purple-700',
        border: 'border-purple-200',
        icon: 'bg-purple-100'
      },
      indigo: {
        bg: 'bg-indigo-50 hover:bg-indigo-100',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        icon: 'bg-indigo-100'
      },
      yellow: {
        bg: 'bg-yellow-50 hover:bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        icon: 'bg-yellow-100'
      },
      gray: {
        bg: 'bg-gray-50 hover:bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-200',
        icon: 'bg-gray-100'
      }
    };
    
    const colorSet = colors[color] || colors.gray;
    return {
      button: `${colorSet.bg} ${colorSet.text} border ${colorSet.border} transition-all duration-200 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-md'
      }`,
      icon: colorSet.icon
    };
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
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-pattern opacity-10"></div>
            
            <div className="relative">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    Welcome back, {user.first_name}! 👋
                  </h1>
                  <p className="text-indigo-100 text-lg max-w-xl">
                    Your mental health journey continues. We're here to support you every step of the way.
                  </p>
                </div>
                <button
                  onClick={() => setShowEmergencyModal(true)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 backdrop-blur-sm border border-white border-opacity-20"
                >
                  <FiAlertCircle className="h-5 w-5" />
                  Emergency Help
                </button>
              </div>

              {nextSession && (
                <div className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm border border-white border-opacity-20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                        <FiCalendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-indigo-100">Next Session</h3>
                        <p className="text-lg font-semibold">
                          {format(new Date(nextSession.date), "EEEE, MMMM d 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {new Date(nextSession.date) <= new Date() && (
                        <Link
                          to={`/sessions/${nextSession.id}/call`}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <FiVideo className="h-5 w-5" />
                          Join Now
                        </Link>
                      )}
                      <Link
                        to={`/sessions/${nextSession.id}`}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <FiArrowRight className="h-5 w-5" />
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiActivity className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Session Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardStats.completedSessions}/{dashboardStats.totalSessions}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-green-600">{dashboardStats.completionRate}%</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${dashboardStats.completionRate}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiClock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.upcomingCount}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Sessions scheduled</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FiBell className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.thisWeekCount}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Sessions this week</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiAward className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Streak</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.streakCount}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Consecutive weeks</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <FiMessageSquare className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Messages</p>
                <p className="text-2xl font-bold text-gray-900">{messageCount}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Unread messages</p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {quickActions.map((action, index) => {
            const colors = getColorClasses(action.color, action.disabled);
            return (
              <button
                key={index}
                onClick={action.action}
                disabled={action.disabled}
                className={`p-4 rounded-xl ${colors.button}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${colors.icon}`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{action.label}</h3>
                      {action.badge && (
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-white bg-opacity-50">
                          {action.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm opacity-75">{action.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
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
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Today's Sessions</h2>
                      <p className="text-sm text-gray-500">
                        {todaySessions.length === 0 
                          ? 'No sessions scheduled for today' 
                          : `${todaySessions.length} session${todaySessions.length > 1 ? 's' : ''} today`}
                      </p>
                    </div>
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

          {/* Right Column - Wellness & Emergency */}
          <div className="space-y-8">
            {/* Wellness Tips */}
            <WellnessTip />

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