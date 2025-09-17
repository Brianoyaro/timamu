import { useState, useEffect } from 'react';
import { 
  UserGroupIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../../stores/authStore';
import useSessionStore from '../../stores/sessionStore';
import Layout from '../../components/Layout/Layout';
import toast from 'react-hot-toast';

export default function AssignmentsPage() {
  const { token, user } = useAuthStore();
  const { fetchMyAssignments } = useSessionStore();
  
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'PATIENT') {
      loadAssignments();
    }
  }, [user, token]);

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const data = await fetchMyAssignments(token);
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'PENDING_APPROVAL':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'REJECTED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'EXPIRED':
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'PENDING_APPROVAL':
        return 'Pending Approval';
      case 'REJECTED':
        return 'Rejected';
      case 'EXPIRED':
        return 'Expired';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (user?.role !== 'PATIENT') {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">This page is only available to patients.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <UserGroupIcon className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">My Therapist Assignments</h1>
            </div>
            <p className="text-gray-600">
              Manage your current and pending therapist assignments. Each assignment allows you to book sessions with a specific therapist for particular types of care.
            </p>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : assignments.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments Yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't requested any therapist assignments yet. Browse our therapists to get started.
              </p>
              <a
                href="/therapists"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Browse Therapists
              </a>
            </div>
          ) : (
            /* Assignments List */
            <div className="space-y-6">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 mr-3">
                            Dr. {assignment.therapist.user.firstName} {assignment.therapist.user.lastName}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                            {getStatusIcon(assignment.status)}
                            <span className="ml-1">{getStatusText(assignment.status)}</span>
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Specialization:</strong> {assignment.specialization.name}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Assignment Type:</strong> {assignment.assignmentType.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Category:</strong> {assignment.specialization.category}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Requested:</strong> {new Date(assignment.requestedAt).toLocaleDateString()}
                            </p>
                            {assignment.approvedAt && (
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>Approved:</strong> {new Date(assignment.approvedAt).toLocaleDateString()}
                              </p>
                            )}
                            {assignment.expiresAt && (
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>Expires:</strong> {new Date(assignment.expiresAt).toLocaleDateString()}
                              </p>
                            )}
                            {assignment.maxSessions && (
                              <p className="text-sm text-gray-600">
                                <strong>Max Sessions:</strong> {assignment.maxSessions}
                              </p>
                            )}
                          </div>
                        </div>

                        {assignment.reason && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">
                              <strong>Reason:</strong> {assignment.reason}
                            </p>
                          </div>
                        )}

                        {assignment.rejectionReason && (
                          <div className="mt-4 p-3 bg-red-50 rounded-md">
                            <p className="text-sm text-red-700">
                              <strong>Rejection Reason:</strong> {assignment.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>

                      {assignment.status === 'ACTIVE' && (
                        <div className="ml-4">
                          <a
                            href={`/sessions?therapist=${assignment.therapist.user.id}`}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                          >
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Book Session
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary Stats */}
          {assignments.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {assignments.filter(a => a.status === 'ACTIVE').length}
                  </div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {assignments.filter(a => a.status === 'PENDING_APPROVAL').length}
                  </div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {assignments.filter(a => a.status === 'REJECTED').length}
                  </div>
                  <div className="text-sm text-gray-600">Rejected</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {assignments.length}
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
