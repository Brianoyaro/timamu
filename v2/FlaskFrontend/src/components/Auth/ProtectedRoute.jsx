import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { checkAuthForRoute } from '../../utils/authUtils';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ requiredRole = null }) => {
  const { 
    isAuthenticated, 
    user, 
    isInitialized, 
    initialize,
    isLoading
  } = useAuthStore();
  const [isValidating, setIsValidating] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const performAuthCheck = async () => {
      // Initialize store if not already done
      if (!isInitialized) {
        console.log('[ProtectedRoute] Initializing auth store...');
        initialize();
        return; // Let the effect run again after initialization
      }

      if (authChecked) return;

      console.log('[ProtectedRoute] Performing enhanced auth check...', {
        isAuthenticated,
        hasUser: !!user,
        hasRememberMe: localStorage.getItem('remember_me') === 'true'
      });

      setIsValidating(true);

      try {
        // Use enhanced route checking utility
        const isAuthorized = await checkAuthForRoute(true);
        
        if (!isAuthorized) {
          console.log('[ProtectedRoute] Authentication check failed');
        } else {
          console.log('[ProtectedRoute] Authentication check passed');
        }
      } catch (error) {
        console.warn('[ProtectedRoute] Auth check failed:', error);
        // Don't immediately redirect - let user try to continue
      } finally {
        setIsValidating(false);
        setAuthChecked(true);
      }
    };

    performAuthCheck();
  }, [isInitialized, isAuthenticated, user, authChecked, initialize]); // Include all dependencies

  // Wait for initialization and initial auth check
  if (!isInitialized || (!authChecked && localStorage.getItem('remember_me') === 'true')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">
            {!isInitialized ? 'Initializing...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }

  // Show loading during validation or auth store loading
  if (isValidating || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication status
  if (!isAuthenticated || !user) {
    console.log('[ProtectedRoute] Not authenticated or missing user data, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRole && user?.role !== requiredRole) {
    console.log(`[ProtectedRoute] Role mismatch: required='${requiredRole}', user='${user?.role}', redirecting to dashboard`);
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;