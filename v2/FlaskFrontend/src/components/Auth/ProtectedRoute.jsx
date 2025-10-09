import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ requiredRole = null }) => {
  const { isAuthenticated, user, isInitialized, loadUser } = useAuthStore();
  const [isValidating, setIsValidating] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      // Only load user data if we think we're authenticated but don't have user data
      if (isAuthenticated && !user && isInitialized && !isValidating) {
        setIsValidating(true);
        try {
          console.log('[ProtectedRoute] Loading user data...');
          await loadUser();
        } catch (error) {
          console.error('[ProtectedRoute] Failed to load user:', error);
        } finally {
          setIsValidating(false);
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, user, isInitialized, isValidating]); // Stable dependencies

  // Wait for initialization
  if (!isInitialized || isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">
            {!isInitialized ? 'Initializing...' : 'Loading user data...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to the login page if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to dashboard if the user doesn't have the required role
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;