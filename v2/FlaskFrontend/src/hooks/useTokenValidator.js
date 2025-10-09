import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

/**
 * Hook to periodically check token validity
 * @param {number} intervalMs - Check interval in milliseconds (default: 60000 = 1 minute)
 */
export const useTokenValidator = (intervalMs = 60000) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const validateToken = useAuthStore((state) => state.validateToken);
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  const checkToken = useCallback(async () => {
    try {
      const isValid = await validateToken();
      if (!isValid) {
        console.log('[TokenValidator] Token invalid, redirecting to login');
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error('[TokenValidator] Token validation error:', error);
      navigate('/login', { replace: true });
    }
  }, [validateToken, navigate]);

  useEffect(() => {
    // Only start validation if user is authenticated
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Check token immediately
    checkToken();

    // Set up periodic checking
    intervalRef.current = setInterval(checkToken, intervalMs);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, checkToken, intervalMs]);
};