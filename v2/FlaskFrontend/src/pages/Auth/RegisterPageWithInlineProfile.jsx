import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import PasswordInput from '../../components/common/PasswordInput';
import { 
  FaCalendarAlt, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaUser,
  FaChevronDown,
  FaChevronUp,
  FaCertificate,
  FaGraduationCap
} from 'react-icons/fa';
import api from '../../utils/api';

const RegisterPageWithInlineProfile = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'PATIENT',
  });
  
  const [showProfileSection, setShowProfileSection] = useState(false);
  const [profileData, setProfileData] = useState({
    // Patient fields
    dateOfBirth: '',
    phone: '',
    address: '',
    emergencyContact: '',
    medicalHistory: '',
    preferredLanguage: 'English',
    timezone: 'UTC',
    // Therapist fields
    licenseNumber: '',
    education: '',
    experience: '',
    bio: '',
    acceptsEmergency: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    if (useAuthStore.getState().isAuthenticated) {
      navigate('/dashboard');
    }
  }, [navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      addToast({
        message: 'Passwords do not match. Please ensure both password fields are identical.',
        type: 'error',
        duration: 10000
      });
      return;
    }
    
    if (formData.password.length < 6) {
      addToast({
        message: 'Password must be at least 6 characters long.',
        type: 'error',
        duration: 10000
      });
      return;
    }

    setIsLoading(true);

    try {
      addToast({
        message: 'Creating your account...',
        type: 'info',
        duration: 2000,
        dismissible: true
      });
      
      const response = await register(formData);
      
      // If profile section is shown and has data, save it
      if (showProfileSection && hasProfileData()) {
        try {
          const profilePayload = formData.role === 'PATIENT' ? {
            date_of_birth: profileData.dateOfBirth,
            phone: profileData.phone,
            address: profileData.address,
            emergency_contact: profileData.emergencyContact,
            medical_history: profileData.medicalHistory,
            preferred_language: profileData.preferredLanguage,
            timezone: profileData.timezone
          } : {
            license_number: profileData.licenseNumber,
            education: profileData.education,
            experience: parseInt(profileData.experience) || 0,
            bio: profileData.bio,
            timezone: profileData.timezone,
            accepts_emergency: profileData.acceptsEmergency
          };

          await api.put('/auth/profile', profilePayload);
          
          addToast({
            message: 'Account and profile created successfully! Welcome to Timamu.',
            type: 'success',
            duration: 5000
          });
        } catch (profileError) {
          console.error('Profile save error:', profileError);
          addToast({
            message: 'Account created successfully! You can complete your profile from the dashboard.',
            type: 'success',
            duration: 5000
          });
        }
      } else {
        addToast({
          message: 'Account created successfully! Welcome to Timamu.',
          type: 'success',
          duration: 3000
        });
      }
      
      // Navigate to dashboard
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error('Registration error:', err);
      
      let errorMessage;
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 409) {
        errorMessage = 'An account with this email already exists. Please use a different email or try to login.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Please check your registration information and try again.';
        if (err.response?.data?.errors) {
          const validationErrors = err.response.data.errors;
          errorMessage = Object.keys(validationErrors)
            .map(field => `${field}: ${validationErrors[field]}`)
            .join(', ');
        }
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = 'Registration failed. Please check your information and try again.';
      }
      
      addToast({
        message: errorMessage,
        type: 'error',
        duration: 10000,
        dismissible: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasProfileData = () => {
    if (formData.role === 'PATIENT') {
      return profileData.dateOfBirth || profileData.phone || profileData.address;
    } else {
      return profileData.licenseNumber || profileData.education || profileData.bio;
    }
  };

  const languageOptions = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Chinese (Mandarin)', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Hindi'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-teal-50 to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-blue-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">Create Your Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our community and start your journey to better mental health
          </p>
        </div>
        
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {/* Basic Registration Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="John"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Doe"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="you@example.com"
            />
          </div>
          
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleChange}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="••••••••"
            label="Password"
          />
          
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="••••••••"
            label="Confirm Password"
          />
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              I am a
            </label>
            <select
              id="role"
              name="role"
              required
              value={formData.role}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all duration-200"
            >
              <option value="PATIENT">Patient - Seeking Mental Health Support</option>
              <option value="THERAPIST">Therapist - Mental Health Professional</option>
            </select>
          </div>

          {/* Optional Profile Section */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowProfileSection(!showProfileSection)}
              className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                Complete profile now (optional)
              </span>
              {showProfileSection ? <FaChevronUp /> : <FaChevronDown />}
            </button>

            {showProfileSection && (
              <div className="mt-4 space-y-4 p-4 border rounded-lg bg-gray-50">
                {formData.role === 'PATIENT' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          <FaCalendarAlt className="inline w-3 h-3 mr-1" />
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={profileData.dateOfBirth}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          <FaPhone className="inline w-3 h-3 mr-1" />
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        <FaMapMarkerAlt className="inline w-3 h-3 mr-1" />
                        Address
                      </label>
                      <textarea
                        name="address"
                        value={profileData.address}
                        onChange={handleProfileChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your address (optional)"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        <FaUser className="inline w-3 h-3 mr-1" />
                        Emergency Contact
                      </label>
                      <input
                        type="text"
                        name="emergencyContact"
                        value={profileData.emergencyContact}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Name and phone number"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        <FaCertificate className="inline w-3 h-3 mr-1" />
                        License Number
                      </label>
                      <input
                        type="text"
                        name="licenseNumber"
                        value={profileData.licenseNumber}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your professional license number"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        <FaGraduationCap className="inline w-3 h-3 mr-1" />
                        Education
                      </label>
                      <textarea
                        name="education"
                        value={profileData.education}
                        onChange={handleProfileChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your educational background..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Years Experience
                        </label>
                        <input
                          type="number"
                          name="experience"
                          value={profileData.experience}
                          onChange={handleProfileChange}
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center text-xs text-gray-600">
                          <input
                            type="checkbox"
                            name="acceptsEmergency"
                            checked={profileData.acceptsEmergency}
                            onChange={handleProfileChange}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                          />
                          Accept emergency sessions
                        </label>
                      </div>
                    </div>
                  </>
                )}
                
                <p className="text-xs text-gray-500 italic">
                  You can always complete or update your profile later from the dashboard.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative transition-all duration-200 transform hover:scale-[1.02]"
            >
              {isLoading && (
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="animate-spin h-5 w-5 text-white/60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              )}
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPageWithInlineProfile;