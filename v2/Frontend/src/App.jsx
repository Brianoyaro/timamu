import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

// Stores
import useAuthStore from './stores/authStore';
import useSocketStore from './stores/socketStore';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import AuthCallbackPage from './pages/Auth/AuthCallbackPage';
import TermsPage from './pages/Legal/TermsPage';
import PrivacyPage from './pages/Legal/PrivacyPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import SessionsPage from './pages/Sessions/SessionsPage';
import SessionRoomPage from './pages/Sessions/SessionRoomPage';
import ProfilePage from './pages/Profile/ProfilePage';
import TherapistsPage from './pages/Therapists/TherapistsPage';
import AdminPage from './pages/Admin/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Helper component for auth redirects
function AuthRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

// Helper component for protected routes with layout
function ProtectedLayoutRoute({ children, requiredRole }) {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function App() {
  const { isAuthenticated, token } = useAuthStore();
  const { connect, disconnect } = useSocketStore();

  // Connect socket when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      connect(token);
    } else {
      disconnect();
    }
    return () => disconnect();
  }, [isAuthenticated, token, connect, disconnect]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<AuthRoute><LandingPage /></AuthRoute>} />
            <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
            <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Protected routes with layout */}
            <Route path="/dashboard" element={<ProtectedLayoutRoute><DashboardPage /></ProtectedLayoutRoute>} />
            <Route path="/sessions" element={<ProtectedLayoutRoute><SessionsPage /></ProtectedLayoutRoute>} />
            <Route path="/profile" element={<ProtectedLayoutRoute><ProfilePage /></ProtectedLayoutRoute>} />
            <Route path="/therapists" element={<ProtectedLayoutRoute requiredRole="PATIENT"><TherapistsPage /></ProtectedLayoutRoute>} />
            <Route path="/admin" element={<ProtectedLayoutRoute requiredRole="ADMIN"><AdminPage /></ProtectedLayoutRoute>} />

            {/* Protected route without layout */}
            <Route path="/session/:sessionId" element={<ProtectedRoute><SessionRoomPage /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: '#363636', color: '#fff' },
              success: { duration: 3000, iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { duration: 5000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
