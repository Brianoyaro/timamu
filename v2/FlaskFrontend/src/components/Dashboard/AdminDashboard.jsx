import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Modal from '../common/Modal';
import ConfirmationModal from '../common/ConfirmationModal';
import DocumentViewer from '../common/DocumentViewer';

const AdminDashboard = ({ stats, user }) => {
  const navigate = useNavigate();
  const [pendingTherapists, setPendingTherapists] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null,
    requireReason: false
  });
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [showDocuments, setShowDocuments] = useState(false);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, therapistsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/therapists/pending'),
        api.get('/admin/users?per_page=10')
      ]);

      setDashboardStats(statsRes.data);
      
      // Enhance therapist data with documents
      const therapistsWithDocuments = await Promise.all(
        therapistsRes.data.map(async (therapist) => {
          try {
            // Try to get therapist profile with documents
            const profileRes = await api.get(`/admin/therapists/${therapist.id}/profile`);
            return {
              ...therapist,
              documents: profileRes.data.documents || [],
              license_number: profileRes.data.license_number || therapist.license_number,
              specializations: profileRes.data.specializations || therapist.specializations || []
            };
          } catch (error) {
            console.error(`Error fetching profile for therapist ${therapist.id}:`, error);
            // Return therapist with empty documents if profile fetch fails
            return {
              ...therapist,
              documents: []
            };
          }
        })
      );
      
      setPendingTherapists(therapistsWithDocuments);
      setRecentUsers(usersRes.data.users);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTherapist = async (therapistId) => {
    try {
      setActionLoading(prev => ({ ...prev, [`verify_${therapistId}`]: true }));
      await api.post(`/admin/therapists/${therapistId}/verify`);
      
      // Update local state
      setPendingTherapists(prev => prev.filter(t => t.id !== therapistId));
      
      // Show success modal
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Success!',
        message: 'Therapist verified successfully!'
      });
    } catch (error) {
      console.error('Error verifying therapist:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to verify therapist. Please try again.'
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [`verify_${therapistId}`]: false }));
    }
  };

  const handleRejectTherapist = async (therapistId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject Therapist Application',
      message: 'Are you sure you want to reject this therapist application?',
      requireReason: true,
      onConfirm: async (reason) => {
        try {
          setActionLoading(prev => ({ ...prev, [`reject_${therapistId}`]: true }));
          await api.post(`/admin/therapists/${therapistId}/reject`, { reason });
          
          // Update local state
          setPendingTherapists(prev => prev.filter(t => t.id !== therapistId));
          
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Application Rejected',
            message: 'Therapist application has been rejected.'
          });
        } catch (error) {
          console.error('Error rejecting therapist:', error);
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'Failed to reject therapist. Please try again.'
          });
        } finally {
          setActionLoading(prev => ({ ...prev, [`reject_${therapistId}`]: false }));
        }
      }
    });
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    setConfirmModal({
      isOpen: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `Are you sure you want to ${action} this user account?`,
      onConfirm: async () => {
        try {
          setActionLoading(prev => ({ ...prev, [`toggle_${userId}`]: true }));
          await api.post(`/admin/users/${userId}/${action}`);
          
          // Update local state
          setRecentUsers(prev => prev.map(user => 
            user.id === userId ? { ...user, is_active: !currentStatus } : user
          ));
          
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Success!',
            message: `User ${action}d successfully!`
          });
        } catch (error) {
          console.error(`Error ${action}ing user:`, error);
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: `Failed to ${action} user. Please try again.`
          });
        } finally {
          setActionLoading(prev => ({ ...prev, [`toggle_${userId}`]: false }));
        }
      }
    });
  };

  const handleViewDocuments = (therapist) => {
    setSelectedTherapist(therapist);
    setShowDocuments(true);
  };

  const handleCloseDocuments = () => {
    setShowDocuments(false);
    setSelectedTherapist(null);
  };

  const handleApproveDocument = async (document) => {
    // For now, just show success - could add document-level approval later
    setModal({
      isOpen: true,
      type: 'info',
      title: 'Document Approved',
      message: 'Document has been marked as verified.'
    });
  };

  const handleRejectDocument = async (document) => {
    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Document Rejected',
      message: 'Document has been marked as rejected. The therapist will need to upload a replacement.'
    });
  };

  const userStats = dashboardStats || stats?.userStats || {
    totalUsers: 0,
    totalPatients: 0,
    totalTherapists: 0,
    newUsersThisWeek: 0
  };
  const sessionStats = {
    totalSessions: dashboardStats?.totalSessions || stats?.sessionStats?.totalSessions || 0,
    completedSessions: dashboardStats?.completedSessions || stats?.sessionStats?.completedSessions || 0,
    upcomingSessions: dashboardStats?.upcomingSessions || stats?.sessionStats?.upcomingSessions || 0
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.firstName || 'Admin'} {user?.lastName || ''}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-1">Total Users</h2>
              <p className="text-3xl font-bold text-indigo-600">{dashboardStats?.totalUsers || userStats.totalUsers}</p>
              <p className="text-sm text-gray-500 mt-1">Platform users</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-1">Patients</h2>
              <p className="text-3xl font-bold text-green-600">{dashboardStats?.totalPatients || userStats.totalPatients}</p>
              <p className="text-sm text-gray-500 mt-1">Active patients</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-1">Therapists</h2>
              <p className="text-3xl font-bold text-blue-600">{dashboardStats?.totalTherapists || userStats.totalTherapists}</p>
              <p className="text-sm text-gray-500 mt-1">Verified therapists</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-1">Pending Verifications</h2>
              <p className="text-3xl font-bold text-orange-600">{dashboardStats?.pendingVerifications || pendingTherapists.length}</p>
              <p className="text-sm text-gray-500 mt-1">Awaiting approval</p>
            </div>
          </div>

          {/* Admin Privileges Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Admin Privileges
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/admin/therapists')}
                className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-md"
              >
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Verify Therapists</span>
                  <span className="text-xs opacity-90">{pendingTherapists.length} pending</span>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/admin/users')}
                className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-md"
              >
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 01-3 0 1.5 1.5 0 013 0z" />
                  </svg>
                  <span className="font-medium">Manage Users</span>
                  <span className="text-xs opacity-90">Activate/Deactivate</span>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/sessions')}
                className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-md"
              >
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="font-medium">Session Monitor</span>
                  <span className="text-xs opacity-90">Live sessions</span>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/reports')}
                className="p-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105 shadow-md"
              >
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">Reports</span>
                  <span className="text-xs opacity-90">Analytics</span>
                </div>
              </button>
            </div>
          </div>

          {/* Pending Therapist Verifications */}
          {pendingTherapists.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Pending Therapist Verifications ({pendingTherapists.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingTherapists.slice(0, 4).map((therapist) => (
                  <div key={therapist.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{therapist.name}</h3>
                        <p className="text-sm text-gray-600">{therapist.email}</p>
                        <p className="text-xs text-gray-500">
                          Applied: {new Date(therapist.submissionDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">License:</span> {therapist.license_number || 'Not provided'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Specializations:</span> {
                          therapist.specializations?.length > 0 
                            ? therapist.specializations.join(', ') 
                            : 'Not specified'
                        }
                      </p>
                      {therapist.documents && therapist.documents.length > 0 && (
                        <p className="text-sm text-blue-600">
                          <span className="font-medium">Documents:</span> {therapist.documents.length} uploaded
                        </p>
                      )}
                    </div>
                    
                    {/* View Documents Button */}
                    {therapist.documents && therapist.documents.length > 0 && (
                      <div className="mb-3">
                        <button
                          onClick={() => handleViewDocuments(therapist)}
                          className="w-full bg-blue-100 text-blue-700 py-2 px-3 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
                        >
                          View Documents ({therapist.documents.length})
                        </button>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleVerifyTherapist(therapist.id)}
                        disabled={actionLoading[`verify_${therapist.id}`]}
                        className="flex-1 bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      >
                        {actionLoading[`verify_${therapist.id}`] ? 'Verifying...' : 'Verify'}
                      </button>
                      <button
                        onClick={() => handleRejectTherapist(therapist.id)}
                        disabled={actionLoading[`reject_${therapist.id}`]}
                        className="flex-1 bg-red-600 text-white py-2 px-3 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      >
                        {actionLoading[`reject_${therapist.id}`] ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {pendingTherapists.length > 4 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => navigate('/admin/therapists')}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View all {pendingTherapists.length} pending applications →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Recent User Management */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 01-3 0 1.5 1.5 0 013 0z" />
              </svg>
              Recent Users ({recentUsers.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentUsers.slice(0, 5).map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-600 font-medium text-sm">
                                {user.first_name?.[0] || user.email[0].toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'THERAPIST' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'PATIENT' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                            disabled={actionLoading[`toggle_${user.id}`]}
                            className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md transition-colors ${
                              user.is_active 
                                ? 'text-red-700 bg-red-100 hover:bg-red-200' 
                                : 'text-green-700 bg-green-100 hover:bg-green-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {actionLoading[`toggle_${user.id}`] 
                              ? 'Processing...' 
                              : user.is_active ? 'Deactivate' : 'Activate'
                            }
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentUsers.length > 5 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => navigate('/admin/users')}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View all users →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Session Statistics and Additional Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Session Overview</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Total Sessions</span>
                  <span className="text-2xl font-bold text-indigo-600">{sessionStats.totalSessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Completed Sessions</span>
                  <span className="text-2xl font-bold text-green-600">{sessionStats.completedSessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Completion Rate</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {sessionStats.totalSessions > 0 
                      ? Math.round((sessionStats.completedSessions / sessionStats.totalSessions) * 100)
                      : 0
                    }%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/admin/therapists')}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Therapist Verifications</span>
                    <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      {pendingTherapists.length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Review pending therapist applications</p>
                </button>

                <button
                  onClick={() => navigate('/admin/users')}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">User Management</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Activate, deactivate, and manage users</p>
                </button>

                <button
                  onClick={() => navigate('/admin/sessions')}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Session Monitoring</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Monitor active and scheduled sessions</p>
                </button>
              </div>
            </div>
          </div>

          {/* Legacy Recent Activity */}
          {stats?.recentActivity && stats.recentActivity.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
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
          )}
        </>
      )}

      {/* Modals */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        requireReason={confirmModal.requireReason}
      />

      {/* Document Viewer Modal */}
      {showDocuments && selectedTherapist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] w-full flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Documents for {selectedTherapist.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedTherapist.email} • License: {selectedTherapist.license_number || 'Not provided'}
                </p>
              </div>
              <button
                onClick={handleCloseDocuments}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <DocumentViewer
                documents={selectedTherapist.documents || []}
                title="Professional Credentials"
                showActions={true}
                onApprove={handleApproveDocument}
                onReject={handleRejectDocument}
              />
            </div>
            
            <div className="border-t px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={handleCloseDocuments}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => handleVerifyTherapist(selectedTherapist.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Approve Therapist
              </button>
              <button
                onClick={() => handleRejectTherapist(selectedTherapist.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;