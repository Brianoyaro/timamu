import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TherapistDashboard from './pages/TherapistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import VideoSession from './pages/VideoSession';
import BookingDetails from './pages/BookingDetails';

// Components
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { initialize, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  const getDefaultRoute = () => {
    if (!isAuthenticated) return '/login';
    
    if (user?.role === 'ADMIN') return '/admin/dashboard';
    if (user?.role === 'THERAPIST') return '/therapist/dashboard';
    return '/dashboard';
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes - Patient */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['PATIENT']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Therapist */}
          <Route
            path="/therapist/dashboard"
            element={
              <ProtectedRoute allowedRoles={['THERAPIST']}>
                <TherapistDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Admin */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Video Session - All authenticated users */}
          <Route
            path="/session/:bookingId"
            element={
              <ProtectedRoute>
                <VideoSession />
              </ProtectedRoute>
            }
          />

          {/* Booking Details - All authenticated users */}
          <Route
            path="/bookings/:id"
            element={
              <ProtectedRoute>
                <BookingDetails />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />

          {/* Catch all - redirect to default */}
          <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
