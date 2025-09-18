import { useState, useEffect } from 'react';
import { 
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../../stores/authStore';
import { getApiUrl } from '../../utils/api';
import toast from 'react-hot-toast';

export default function LeanAdminPage() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPatients: 0,
    totalTherapists: 0,
    pendingTherapists: 0,
    totalSessions: 0,
    emergencySessions: 0
  });
  const [pendingTherapists, setPendingTherapists] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsResponse, therapistsResponse, sessionsResponse] = await Promise.all([
        fetch(`${getApiUrl()}/api/lean/admin/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${getApiUrl()}/api/lean/admin/therapists/pending`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${getApiUrl()}/api/lean/admin/sessions/recent`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data || {});
      }

      if (therapistsResponse.ok) {
        const therapistsData = await therapistsResponse.json();
        setPendingTherapists(therapistsData.data?.therapists || []);
      }

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setRecentSessions(sessionsData.data?.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveTherapist = async (therapistId) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/lean/admin/therapists/${therapistId}/approve`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Therapist approved successfully');
        fetchAdminData(); // Refresh data
      } else {
        throw new Error('Failed to approve therapist');
      }
    } catch (error) {
      console.error('Error approving therapist:', error);
      toast.error('Failed to approve therapist');
    }
  };

  const handleRejectTherapist = async (therapistId) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/lean/admin/therapists/${therapistId}/reject`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Therapist application rejected');
        fetchAdminData(); // Refresh data
      } else {
        throw new Error('Failed to reject therapist');
      }
    } catch (error) {
      console.error('Error rejecting therapist:', error);
      toast.error('Failed to reject therapist');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg">
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-8 w-8 ${color}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-2xl font-bold text-gray-900">{value}</dd>
              {description && (
                <dd className="text-xs text-gray-400 mt-1">{description}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const TabButton = ({ id, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">NGO Admin Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Manage your telepsychology platform users and sessions
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={UserGroupIcon}
          color="text-blue-600"
          description="All registered users"
        />
        <StatCard
          title="Active Patients"
          value={stats.totalPatients}
          icon={UserGroupIcon}
          color="text-green-600"
          description="Registered patients"
        />
        <StatCard
          title="Approved Therapists"
          value={stats.totalTherapists}
          icon={AcademicCapIcon}
          color="text-purple-600"
          description="Licensed professionals"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingTherapists}
          icon={ClipboardDocumentListIcon}
          color="text-yellow-600"
          description="Awaiting review"
        />
        <StatCard
          title="Total Sessions"
          value={stats.totalSessions}
          icon={ChartBarIcon}
          color="text-indigo-600"
          description="All time sessions"
        />
        <StatCard
          title="Emergency Sessions"
          value={stats.emergencySessions}
          icon={ExclamationTriangleIcon}
          color="text-red-600"
          description="Urgent sessions"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex space-x-4">
            <TabButton
              id="overview"
              label="Overview"
              isActive={activeTab === 'overview'}
              onClick={setActiveTab}
            />
            <TabButton
              id="therapists"
              label="Pending Therapists"
              isActive={activeTab === 'therapists'}
              onClick={setActiveTab}
            />
            <TabButton
              id="sessions"
              label="Recent Sessions"
              isActive={activeTab === 'sessions'}
              onClick={setActiveTab}
            />
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Platform Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Quick Actions</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => setActiveTab('therapists')}
                          className="block w-full text-left text-sm text-blue-700 hover:text-blue-900"
                        >
                          → Review pending therapist applications ({stats.pendingTherapists})
                        </button>
                        <button
                          onClick={() => setActiveTab('sessions')}
                          className="block w-full text-left text-sm text-blue-700 hover:text-blue-900"
                        >
                          → View recent platform activity
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">Platform Health</h4>
                      <div className="space-y-2 text-sm text-green-700">
                        <p>✅ All systems operational</p>
                        <p>✅ Database connections healthy</p>
                        <p>✅ Session booking available</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'therapists' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Pending Therapist Applications ({pendingTherapists.length})
                  </h3>
                  
                  {pendingTherapists.length === 0 ? (
                    <div className="text-center py-8">
                      <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No pending therapist applications</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingTherapists.map((therapist) => (
                        <div key={therapist.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-600">
                                    {therapist.firstName[0]}{therapist.lastName[0]}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="text-lg font-medium text-gray-900">
                                    Dr. {therapist.firstName} {therapist.lastName}
                                  </h4>
                                  <p className="text-sm text-gray-600">{therapist.email}</p>
                                </div>
                              </div>
                              
                              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p><strong>License:</strong> {therapist.therapistProfile?.licenseNumber}</p>
                                  <p><strong>Experience:</strong> {therapist.therapistProfile?.experience} years</p>
                                  <p><strong>Education:</strong> {therapist.therapistProfile?.education}</p>
                                </div>
                                <div>
                                  <p><strong>Specializations:</strong></p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {therapist.therapistProfile?.specializations?.map((spec, index) => (
                                      <span key={index} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                        {spec}
                                      </span>
                                    ))}
                                  </div>
                                  <p className="mt-2"><strong>Languages:</strong> {therapist.therapistProfile?.languages?.join(', ')}</p>
                                  <p><strong>Emergency Available:</strong> {therapist.therapistProfile?.acceptsEmergency ? 'Yes' : 'No'}</p>
                                </div>
                              </div>
                              
                              {therapist.therapistProfile?.biography && (
                                <div className="mt-4">
                                  <p className="text-sm"><strong>Biography:</strong></p>
                                  <p className="text-sm text-gray-600 mt-1">{therapist.therapistProfile.biography}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={() => handleApproveTherapist(therapist.id)}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectTherapist(therapist.id)}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <XCircleIcon className="h-4 w-4 mr-1" />
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sessions' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Recent Sessions</h3>
                  
                  {recentSessions.length === 0 ? (
                    <div className="text-center py-8">
                      <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No recent sessions</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentSessions.map((session) => (
                        <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div className={`h-3 w-3 rounded-full ${
                                  session.status === 'COMPLETED' ? 'bg-green-500' :
                                  session.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                                  session.status === 'SCHEDULED' ? 'bg-yellow-500' :
                                  'bg-gray-500'
                                }`}></div>
                                
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {session.patient?.firstName} {session.patient?.lastName} ↔ 
                                    Dr. {session.therapist?.firstName} {session.therapist?.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(session.scheduledAt).toLocaleString()} • {session.sessionType}
                                    {session.isEmergency && <span className="ml-2 text-red-600">🚨 Emergency</span>}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                session.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                session.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                session.status === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {session.status.replace('_', ' ')}
                              </span>
                              
                              <button className="text-gray-400 hover:text-gray-600">
                                <EyeIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          {session.title && (
                            <p className="text-sm text-gray-600 mt-2">{session.title}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
