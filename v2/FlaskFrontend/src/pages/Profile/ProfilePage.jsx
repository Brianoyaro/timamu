import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useTokenValidator } from '../../hooks/useTokenValidator';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    // Basic user info
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: '',
    // Role-specific profile data
    profile: {}
  });

  // Validate token periodically
  useTokenValidator(60000);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/auth/profile');
        setProfile(response.data.user);
      } catch (error) {
        console.error('Failed to load profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (field, value) => {
    if (field.startsWith('profile.')) {
      const profileField = field.replace('profile.', '');
      setProfile(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Prepare data for submission
      const updateData = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        gender: profile.gender,
        ...profile.profile
      };

      await api.put('/auth/profile', updateData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white">My Profile</h1>
            <p className="text-blue-100 mt-2">Manage your personal information and preferences</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profile.first_name || ''}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profile.last_name || ''}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={profile.gender || ''}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={profile.role || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 capitalize"
                  />
                </div>
              </div>
            </div>

            {/* Role-specific sections */}
            {user?.role === 'PATIENT' && (
              <PatientProfileSection profile={profile} onChange={handleInputChange} />
            )}

            {user?.role === 'THERAPIST' && (
              <TherapistProfileSection profile={profile} onChange={handleInputChange} />
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Patient-specific profile section
const PatientProfileSection = ({ profile, onChange }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
      Patient Information
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date of Birth
        </label>
        <input
          type="date"
          value={profile.profile?.date_of_birth || ''}
          onChange={(e) => onChange('profile.date_of_birth', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Language
        </label>
        <select
          value={profile.profile?.preferred_language || ''}
          onChange={(e) => onChange('profile.preferred_language', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Language</option>
          <option value="English">English</option>
          <option value="Spanish">Spanish</option>
          <option value="French">French</option>
          <option value="German">German</option>
          <option value="Chinese">Chinese</option>
          <option value="Arabic">Arabic</option>
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address
        </label>
        <textarea
          value={profile.profile?.address || ''}
          onChange={(e) => onChange('profile.address', e.target.value)}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Emergency Contact
        </label>
        <input
          type="text"
          value={profile.profile?.emergency_contact || ''}
          onChange={(e) => onChange('profile.emergency_contact', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Emergency Phone
        </label>
        <input
          type="tel"
          value={profile.profile?.emergency_phone || ''}
          onChange={(e) => onChange('profile.emergency_phone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Medical History
        </label>
        <textarea
          value={profile.profile?.medical_history || ''}
          onChange={(e) => onChange('profile.medical_history', e.target.value)}
          rows="4"
          placeholder="Please provide relevant medical history that may be important for therapy sessions..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  </div>
);

// Therapist-specific profile section
const TherapistProfileSection = ({ profile, onChange }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
      Professional Information
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          License Number
        </label>
        <input
          type="text"
          value={profile.profile?.license_number || ''}
          onChange={(e) => onChange('profile.license_number', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Years of Experience
        </label>
        <input
          type="number"
          value={profile.profile?.experience || ''}
          onChange={(e) => onChange('profile.experience', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hourly Rate ($)
        </label>
        <input
          type="number"
          step="0.01"
          value={profile.profile?.hourly_rate || ''}
          onChange={(e) => onChange('profile.hourly_rate', parseFloat(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Accepts Emergency Sessions
        </label>
        <select
          value={profile.profile?.accepts_emergency ? 'true' : 'false'}
          onChange={(e) => onChange('profile.accepts_emergency', e.target.value === 'true')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Education
        </label>
        <input
          type="text"
          value={profile.profile?.education || ''}
          onChange={(e) => onChange('profile.education', e.target.value)}
          placeholder="Your educational background..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bio
        </label>
        <textarea
          value={profile.profile?.bio || ''}
          onChange={(e) => onChange('profile.bio', e.target.value)}
          rows="4"
          placeholder="Tell us about yourself and your approach to therapy..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    {profile.profile?.is_approved === false && (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-800">
              Your therapist profile is pending approval. You'll be able to accept patients once approved by an administrator.
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default ProfilePage;