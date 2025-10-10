import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useEffect, useState } from 'react';

const NotFoundPage = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [autoRedirect, setAutoRedirect] = useState(true);

  // Auto-redirect authenticated users to dashboard after 5 seconds
  useEffect(() => {
    if (isAuthenticated && autoRedirect) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            navigate('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isAuthenticated, navigate, autoRedirect]);

  const cancelAutoRedirect = () => {
    setAutoRedirect(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md mx-auto">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-indigo-600 mb-4">404</div>
          <div className="w-24 h-1 bg-indigo-600 mx-auto rounded"></div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-4 leading-relaxed">
          Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
        </p>

        {/* Auto-redirect notice for authenticated users */}
        {isAuthenticated && autoRedirect && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm mb-2">
              🔄 Redirecting you to your dashboard in <strong>{countdown}</strong> seconds...
            </p>
            <button
              onClick={cancelAutoRedirect}
              className="text-xs text-blue-600 hover:text-blue-500 underline"
            >
              Cancel auto-redirect
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-indigo-600 border border-transparent rounded-lg font-medium text-white hover:bg-indigo-700 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                </svg>
                Go to Dashboard
              </Link>
              
              {user?.role?.toUpperCase() === 'PATIENT' && (
                <Link
                  to="/sessions"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-100 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10m4-10v10m4-6h-4m-4 0h-4" />
                  </svg>
                  View My Sessions
                </Link>
              )}
              
              {user?.role?.toUpperCase() === 'THERAPIST' && (
                <Link
                  to="/sessions"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-100 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Manage Sessions
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-indigo-600 border border-transparent rounded-lg font-medium text-white hover:bg-indigo-700 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </Link>
              
              <Link
                to="/"
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-100 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-200 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go to Home
              </Link>
            </>
          )}
        </div>

        {/* Additional Help */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">
            Still having trouble? Here are some helpful links:
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {isAuthenticated && (
              <>
                <Link to="/profile" className="text-indigo-600 hover:text-indigo-500">
                  Profile Settings
                </Link>
                {user?.role?.toUpperCase() === 'PATIENT' && (
                  <Link to="/sessions/schedule" className="text-indigo-600 hover:text-indigo-500">
                    Schedule Session
                  </Link>
                )}
              </>
            )}
            <button 
              onClick={() => window.history.back()} 
              className="text-indigo-600 hover:text-indigo-500"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;