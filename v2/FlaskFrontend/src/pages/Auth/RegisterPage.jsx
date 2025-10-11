import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import PasswordInput from '../../components/common/PasswordInput';
import ProfileSetupModal from '../../components/common/ProfileSetupModal';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'PATIENT', // Default role
  });
  const [isLoading, setIsLoading] = useState(false);
  const [redirectScheduled, setRedirectScheduled] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const register = useAuthStore((state) => state.register);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    // check if user is already authenticated
    if (useAuthStore.getState().isAuthenticated && !redirectScheduled) {
      setRedirectScheduled(true);
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
    
    // Check if there's any message passed through location state
    console.log('RegisterPage location state:', location.state);
    
    if (location.state?.message) {
      console.log('Setting toast message from location state:', location.state.message);
      addToast({
        message: location.state.message,
        type: location.state.type || 'info',
        duration: location.state.type === 'error' ? 10000 : 5000,
        dismissible: true
      });
      
      // Clear the location state
      window.history.replaceState({}, document.title);
    }
  }, [navigate, location, addToast, redirectScheduled]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
    
    // Additional validations
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
      // Show registering toast
      addToast({
        message: 'Creating your account...',
        type: 'info',
        duration: 2000,
        dismissible: true
      });
      
      const response = await register(formData);
      
      // Extract user information from response
      const { user } = response;
      setRegisteredUser(user);
      
      // Show success message and open profile setup modal
      addToast({
        message: 'Account created successfully! Complete your profile to get started.',
        type: 'success',
        duration: 5000,
        dismissible: true
      });
      
      // Show profile setup modal instead of redirecting immediately
      setShowProfileModal(true);
    } catch (err) {
      console.error('Registration error:', err);
      
      // Extract the most specific error message available
      let errorMessage;
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 409) {
        // Common registration error - email already exists
        errorMessage = 'An account with this email already exists. Please use a different email or try to login.';
      } else if (err.response?.status === 400) {
        // Bad request - likely validation error
        errorMessage = 'Please check your registration information and try again.';
        
        // Check for specific validation errors
        if (err.response?.data?.errors) {
          const validationErrors = err.response.data.errors;
          errorMessage = Object.keys(validationErrors)
            .map(field => `${field}: ${validationErrors[field]}`)
            .join(', ');
        }
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        // Generic fallback
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

  const handleProfileComplete = () => {
    // Redirect to dashboard after profile completion
    setRedirectScheduled(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
  };

  const handleProfileModalClose = () => {
    // User chose to skip profile setup
    setShowProfileModal(false);
    setRedirectScheduled(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
  };

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

      {/* Profile Setup Modal */}
      <ProfileSetupModal
        isOpen={showProfileModal}
        onClose={handleProfileModalClose}
        user={registeredUser}
        onProfileComplete={handleProfileComplete}
      />
    </div>
  );
};

export default RegisterPage;
