import { Link } from 'react-router-dom';
import { 
  UsersIcon, 
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard({ sessions = [], analytics, isLoading }) {
  // Ensure sessions is always an array
  const sessionsArray = Array.isArray(sessions) ? sessions : [];
  
  const defaultAnalytics = {
    totalUsers: 0,
    totalPatients: 0,
    totalTherapists: 0,
    totalSessions: 0,
    completedSessions: 0,
    cancelledSessions: 0,
    pendingApprovals: 0,
    systemAlerts: 0,
    monthlyGrowth: 0,
    revenueGrowth: 0,
  };

  const data = analytics || defaultAnalytics;

  const stats = [
    {
      name: 'Total Users',
      value: data.totalUsers || 0,
      change: data.monthlyGrowth || 0,
      changeType: data.monthlyGrowth >= 0 ? 'increase' : 'decrease',
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Active Therapists',
      value: data.totalTherapists || 0,
      change: 12,
      changeType: 'increase',
      icon: ShieldCheckIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Total Sessions',
      value: sessionsArray.length,
      change: 8,
      changeType: 'increase',
      icon: ChartBarIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Pending Approvals',
      value: data.pendingApprovals || 0,
      change: -2,
      changeType: 'decrease',
      icon: ClockIcon,
      color: 'bg-red-500',
    },
  ];

  const recentSessions = sessions
    ?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    ?.slice(0, 5) || [];

  const systemHealth = [
    {
      name: 'Server Status',
      status: 'healthy',
      value: '99.9% uptime',
      icon: CheckCircleIcon,
    },
    {
      name: 'Database',
      status: 'healthy',
      value: 'All systems operational',
      icon: CheckCircleIcon,
    },
    {
      name: 'Video Service',
      status: 'warning',
      value: 'Minor delays detected',
      icon: ExclamationTriangleIcon,
    },
    {
      name: 'Payment System',
      status: 'healthy',
      value: 'Processing normally',
      icon: CheckCircleIcon,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.changeType === 'increase' ? '+' : ''}{stat.change}%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">System Health</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {systemHealth.map((system) => (
              <div key={system.name} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <system.icon className={`h-5 w-5 mr-3 ${
                      system.status === 'healthy' ? 'text-green-500' :
                      system.status === 'warning' ? 'text-yellow-500' :
                      'text-red-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{system.name}</p>
                      <p className="text-sm text-gray-500">{system.value}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    system.status === 'healthy' ? 'bg-green-100 text-green-800' :
                    system.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {system.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Sessions</h3>
              <Link
                to="/admin"
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentSessions.length === 0 ? (
              <div className="p-6 text-center">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            ) : (
              recentSessions.map((session) => (
                <div key={session.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Session: {session.patient?.firstName} {session.patient?.lastName} 
                        ↔ Dr. {session.therapist?.firstName} {session.therapist?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(session.scheduledAt).toLocaleDateString()} at{' '}
                        {new Date(session.scheduledAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        session.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        session.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                        session.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {session.status.replace('_', ' ').toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/users"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UsersIcon className="h-6 w-6 text-blue-600 mr-3" />
            <span className="text-sm font-medium text-gray-900">Manage Users</span>
          </Link>
          <Link
            to="/admin/analytics"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChartBarIcon className="h-6 w-6 text-blue-600 mr-3" />
            <span className="text-sm font-medium text-gray-900">View Analytics</span>
          </Link>
          <Link
            to="/admin/approvals"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ClockIcon className="h-6 w-6 text-blue-600 mr-3" />
            <div className="text-left">
              <span className="text-sm font-medium text-gray-900 block">Therapist Approvals</span>
              {data.pendingApprovals > 0 && (
                <span className="text-xs text-red-600">{data.pendingApprovals} pending</span>
              )}
            </div>
          </Link>
          <Link
            to="/admin/audit"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <EyeIcon className="h-6 w-6 text-blue-600 mr-3" />
            <span className="text-sm font-medium text-gray-900">Audit Logs</span>
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {data.systemAlerts > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">System Alerts</h4>
              <p className="text-sm text-yellow-700 mt-1">
                There are {data.systemAlerts} system alerts that require attention.
              </p>
              <Link
                to="/admin/alerts"
                className="text-sm text-yellow-600 hover:text-yellow-500 font-medium mt-2 inline-block"
              >
                View alerts →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
