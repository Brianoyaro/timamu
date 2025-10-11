import { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaUser, FaEdit } from 'react-icons/fa';
import api from '../../utils/api';
import ProfileSetupModal from './ProfileSetupModal';

const ProfileCompletionBanner = ({ user }) => {
  const [profileStatus, setProfileStatus] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileStatus = async () => {
      try {
        const response = await api.get('/auth/profile-status');
        setProfileStatus(response.data);
      } catch (error) {
        console.error('Failed to fetch profile status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfileStatus();
    }
  }, [user]);

  const handleProfileComplete = () => {
    setShowModal(false);
    // Refresh profile status
    window.location.reload();
  };

  if (loading || !profileStatus || profileStatus.profile_complete) {
    return null;
  }

  const { profile_data, user_role } = profileStatus;
  const completionPercentage = profile_data?.completion_percentage || 0;

  return (
    <>
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                Complete Your Profile
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                {user_role === 'PATIENT' 
                  ? 'Complete your health profile to help us provide better care and connect you with the right therapists.'
                  : 'Complete your professional profile to start accepting patients and showcase your expertise.'
                }
              </p>
              
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-yellow-700 mb-1">
                  <span>Profile completion</span>
                  <span>{completionPercentage}%</span>
                </div>
                <div className="w-full bg-yellow-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Missing Info Summary */}
              {user_role === 'PATIENT' && profile_data && (
                <div className="text-xs text-yellow-700">
                  Missing: {!profile_data.has_basic_info && 'Basic info, '}
                  {!profile_data.has_emergency_contact && 'Emergency contact'}
                </div>
              )}
              
              {user_role === 'THERAPIST' && profile_data && (
                <div className="text-xs text-yellow-700">
                  Missing: {!profile_data.has_license && 'License number, '}
                  {!profile_data.has_specializations && 'Specializations, '}
                  {!profile_data.has_bio && 'Professional bio'}
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <FaEdit className="w-4 h-4" />
            Complete Profile
          </button>
        </div>
      </div>

      <ProfileSetupModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        user={user}
        onProfileComplete={handleProfileComplete}
      />
    </>
  );
};

export default ProfileCompletionBanner;