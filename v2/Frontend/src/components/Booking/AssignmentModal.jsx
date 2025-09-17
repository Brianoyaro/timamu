import { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../../stores/authStore';
import useSessionStore from '../../stores/sessionStore';
import toast from 'react-hot-toast';

export default function AssignmentModal({ isOpen, onClose, therapist, onSuccess }) {
  const { token } = useAuthStore();
  const { assignTherapist, fetchSpecializations, fetchAssignmentTypes } = useSessionStore();
  
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedAssignmentType, setSelectedAssignmentType] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [specializations, setSpecializations] = useState([]);
  const [assignmentTypes, setAssignmentTypes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Load specializations and assignment types when modal opens
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      setSelectedSpecialization('GEN001'); // Default to general therapy
      setSelectedAssignmentType('primary'); // Default to primary care
      setReason(`Requesting assignment with Dr. ${therapist?.firstName || ''} ${therapist?.lastName || ''}`);
    }
  }, [isOpen, therapist]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const [specsData, typesData] = await Promise.all([
        fetchSpecializations(token),
        fetchAssignmentTypes(token)
      ]);
      
      setSpecializations(specsData.all || []);
      setAssignmentTypes(typesData.assignmentTypes || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load assignment options');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSpecialization || !selectedAssignmentType) {
      toast.error('Please select both specialization and assignment type');
      return;
    }

    setIsLoading(true);

    try {
      const result = await assignTherapist(
        therapist.id,
        selectedSpecialization,
        selectedAssignmentType,
        reason.trim(),
        token
      );
      
      if (result?.success) {
        const assignmentData = result.data?.assignment;
        const requiresApproval = assignmentData?.status === 'PENDING_APPROVAL';
        
        if (requiresApproval) {
          toast.success('Assignment request submitted for approval! You will be notified when approved.');
        } else {
          toast.success('Therapist assigned successfully! You can now book sessions.');
        }
        
        onSuccess?.(assignmentData);
        onClose();
      } else {
        const errorMessage = result?.message || 'Failed to assign therapist';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Assignment error:', error);
      const errorMessage = error?.message || 'An unexpected error occurred';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAssignmentTypeData = assignmentTypes.find(t => t.code === selectedAssignmentType);
  const selectedSpecializationData = specializations.find(s => s.code === selectedSpecialization);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <UserPlusIcon className="h-6 w-6 mr-2 text-indigo-600" />
            Request Therapist Assignment
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Therapist Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Selected Therapist</h3>
            <p className="text-lg font-semibold text-indigo-600">
              Dr. {therapist?.firstName} {therapist?.lastName}
            </p>
            {therapist?.therapistProfile?.specializations && (
              <p className="text-sm text-gray-600 mt-1">
                Specializations: {therapist.therapistProfile.specializations.join(', ')}
              </p>
            )}
          </div>

          {loadingData ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Specialization Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Therapy Specialization *
                </label>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select a specialization</option>
                  {specializations.map((spec) => (
                    <option key={spec.id} value={spec.code}>
                      {spec.name} {spec.category === 'emergency' && '⚡'}
                      {spec.requiresSpecialCert && '🎓'}
                    </option>
                  ))}
                </select>
                {selectedSpecializationData && (
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedSpecializationData.description}
                  </p>
                )}
              </div>

              {/* Assignment Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Type *
                </label>
                <select
                  value={selectedAssignmentType}
                  onChange={(e) => setSelectedAssignmentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select assignment type</option>
                  {assignmentTypes.map((type) => (
                    <option key={type.id} value={type.code}>
                      {type.name}
                      {type.requiresApproval && ' (Requires Approval)'}
                    </option>
                  ))}
                </select>
                {selectedAssignmentTypeData && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800 mb-2">
                      {selectedAssignmentTypeData.description}
                    </p>
                    <div className="text-xs text-blue-600 space-y-1">
                      {selectedAssignmentTypeData.defaultMaxSessions && (
                        <p>Max Sessions: {selectedAssignmentTypeData.defaultMaxSessions}</p>
                      )}
                      {selectedAssignmentTypeData.defaultDurationDays && (
                        <p>Duration: {selectedAssignmentTypeData.defaultDurationDays} days</p>
                      )}
                      {selectedAssignmentTypeData.requiresApproval && (
                        <p className="flex items-center text-amber-600">
                          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                          Requires admin approval
                        </p>
                      )}
                      {selectedAssignmentTypeData.allowsConcurrent && (
                        <p className="flex items-center text-green-600">
                          <InformationCircleIcon className="h-4 w-4 mr-1" />
                          Can have multiple concurrent assignments
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Assignment
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Brief explanation of why you're requesting this assignment..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !selectedSpecialization || !selectedAssignmentType}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Submitting...' : 'Request Assignment'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
