import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Auth Store
import { useAuthStore } from './stores/authStore.js';
import { useSocketStore } from './stores/socketStore.js';

// Layout
import Layout from './components/Layout/Layout.jsx';

// Pages
import LandingPage from './pages/LandingPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import LoginPage from './pages/Auth/LoginPage.jsx';
import RegisterPage from './pages/Auth/RegisterPage.jsx';

// Dashboard Pages
import DashboardPage from './pages/Dashboard/DashboardPage.jsx';

// Session Pages  
import SessionsPage from './pages/Sessions/SessionsPage.jsx';
import ScheduleSessionPage from './pages/Sessions/ScheduleSessionPage.jsx';
import TherapistAvailabilityPage from './pages/Sessions/TherapistAvailabilityPage.jsx';
import VideoCallPage from './pages/Sessions/VideoCallPage.jsx';

// Therapist Pages
import TherapistDetailPage from './pages/Therapists/TherapistDetailPage.jsx';

// Protected Route
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';

// Main App Component
import ProfilePage from './pages/Profile/ProfilePage';

const App = () => {
  const { initialize, isAuthenticated, token } = useAuthStore();
  const { connect, disconnect } = useSocketStore();

  useEffect(() => {
    // Initialize auth store on app start
    initialize();
  }, []);

  // Connect to socket when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('Connecting to socket server...');
      connect(token);
    } else {
      console.log('Disconnecting from socket server...');
      disconnect();
    }
    
    return () => {
      console.log('Cleanup: Disconnecting from socket server...');
      disconnect();
    };
  }, [isAuthenticated, token]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public routes */}
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="sessions/schedule" element={<ScheduleSessionPage />} />
            <Route path="sessions/availability" element={<TherapistAvailabilityPage />} />
            <Route path="therapists/:therapistId" element={<TherapistDetailPage />} />
            <Route path="video-call/:roomId" element={<VideoCallPage />} />
          </Route>

          {/* Admin routes */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="admin" element={<div>Admin Page (Coming Soon)</div>} />
          </Route>

          {/* 404 route */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
