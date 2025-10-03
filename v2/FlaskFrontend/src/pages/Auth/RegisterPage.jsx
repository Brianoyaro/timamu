import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import PasswordInput from '../../components/common/PasswordInput';

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
      
      await register(formData);
      
      // Show a success message before redirecting
      addToast({
        message: 'Registration successful! Redirecting to login...',
        type: 'success',
        duration: 5000,
        dismissible: true
      });
      
      // Navigate after a delay to ensure the toast message is displayed
      // Set flag so our useEffect doesn't try to navigate too
      setRedirectScheduled(true);
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Registration successful! Please login with your new account.',
            type: 'success'
          }
        });
      }, 3000); // Increased to 3 seconds to ensure visibility
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join Timamu and start your journey to better mental health
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
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="PATIENT">Patient</option>
              <option value="THERAPIST">Therapist</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 relative"
            >
              {isLoading && (
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="animate-spin h-5 w-5 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
