import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import PasswordInput from '../../components/common/PasswordInput';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const addToast = useToastStore((state) => state.addToast);
  
  // Check for any state messages (e.g., from registration)
  useEffect(() => {
    console.log('LoginPage location state:', location.state);
    
    if (location.state?.message) {
      console.log('Setting toast message from location state:', location.state.message);
      addToast({
        message: location.state.message,
        type: location.state.type || 'success',
        duration: 7000,
        dismissible: true
      });
      // Clear the location state
      window.history.replaceState({}, document.title);
    }
  }, [location, addToast]);

  // We'll use a ref to track if a navigation has been scheduled
  const [redirectScheduled, setRedirectScheduled] = useState(false);
  
  useEffect(() => {
    // check if user is already authenticated
    if (isInitialized && isAuthenticated && !redirectScheduled) {
      // Delay navigation to dashboard to allow toasts to be seen
      setRedirectScheduled(true);
      // Only navigate if this effect triggered the authentication, not the login button
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isInitialized, isAuthenticated, navigate, redirectScheduled]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Before we try to login, set loading and clear any existing toasts
      const toastId = addToast({
        message: 'Logging in...',
        type: 'info',
        duration: 2000,
        dismissible: true
      });
      
      await login(formData.email, formData.password, rememberMe);
      
      // Add a success toast message
      addToast({
        message: 'Login successful! Redirecting to dashboard...',
        type: 'success',
        duration: 5000,
        dismissible: true
      });
      
      // Use a timeout to ensure the toast message is displayed before redirecting
      // This sets a flag so that our useEffect doesn't also try to navigate
      setRedirectScheduled(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      console.error('Login error:', err);
      
      // Extract the most specific error message available
      let errorMessage;
      if (err.response?.data?.error) {
        // If API returns an error object with an error property
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        // If API returns an error object with a message property
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        // Specific message for unauthorized (invalid credentials)
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (err.response?.status === 404) {
        // Specific message for not found
        errorMessage = 'User not found. Please check your email address.';
      } else if (err.message) {
        // Use error message property if available
        errorMessage = err.message;
      } else {
        // Generic fallback
        errorMessage = 'Failed to login. Please check your credentials and try again.';
      }
      
      addToast({
        message: errorMessage,
        type: 'error',
        duration: 10000, // Longer duration for error messages
        dismissible: true // Ensure it's dismissible
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your Timamu account
          </p>
        </div>
        
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
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
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="••••••••"
              label="Password"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot password?
              </a>
            </div>
          </div>

          <div>
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
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
