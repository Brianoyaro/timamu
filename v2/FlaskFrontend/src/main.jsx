import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Auth Store and Utilities
import { useAuthStore } from './stores/authStore.js';
import { initializeAuth, cleanupAuth } from './utils/authUtils.js';

// Layout
import Layout from './components/Layout/Layout.jsx';

// Pages
import LandingPage from './pages/LandingPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import LoginPage from './pages/Auth/LoginPage.jsx';
import RegisterPage from './pages/Auth/RegisterPage.jsx';
import MessagesPage from './pages/Messages/MessagesPage.jsx';

// Dashboard Pages
import DashboardPage from './pages/Dashboard/DashboardPage.jsx';

// Session Pages  
import SessionsPage from './pages/Sessions/SessionsPage.jsx';
import SessionDetailPage from './pages/Sessions/SessionDetailPage.jsx';
import ScheduleSessionPage from './pages/Sessions/ScheduleSessionPage.jsx';
import TherapistAvailabilityPage from './pages/Sessions/TherapistAvailabilityPage.jsx';
import VideoCallPage from './pages/Sessions/VideoCallPage.jsx';

// Therapist Pages
import TherapistDetailPage from './pages/Therapists/TherapistDetailPage.jsx';

// Patient Pages
import PatientListPage from './pages/Patients/PatientListPage.jsx';
import PatientDetailPage from './pages/Patients/PatientDetailPage.jsx';

// Admin Components
import AdminLayout from './components/Admin/AdminLayout.jsx';
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';
import TherapistVerification from './pages/Admin/TherapistVerification.jsx';
import UserManagement from './pages/Admin/UserManagement.jsx';
import SessionMonitoring from './pages/Admin/SessionMonitoring.jsx';
import Reports from './pages/Admin/Reports.jsx';
import Support from './pages/Admin/Support.jsx';
import Settings from './pages/Admin/Settings.jsx';

// Protected Route
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';

// Main App Component
import ProfilePage from './pages/Profile/ProfilePage';

const App = () => {
  const { isInitialized } = useAuthStore();

  useEffect(() => {
    // Initialize enhanced authentication system
    console.log('[App] Initializing application with enhanced authentication...');
    
    let isInitializing = false;
    
    const initApp = async () => {
      if (isInitializing) {
        console.log('[App] Initialization already in progress, skipping...');
        return;
      }
      
      isInitializing = true;
      
      try {
        await initializeAuth();
        console.log('[App] Application initialization completed');
      } catch (error) {
        console.error('[App] Application initialization failed:', error);
      } finally {
        isInitializing = false;
      }
    };

    initApp();

    // Setup cleanup for when app unmounts
    const handleBeforeUnload = () => {
      console.log('[App] Cleaning up application...');
      cleanupAuth();
    };

    // Cleanup on page unload
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []); // Empty dependency array to run only once

  // Show loading screen during initialization
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          <h2 className="text-xl font-semibold text-gray-700">Starting Timamu</h2>
          <p className="text-gray-500">Please wait...</p>
        </div>
      </div>
    );
  }

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
            <Route path="sessions/:sessionId" element={<SessionDetailPage />} />
            <Route path="sessions/schedule" element={<ScheduleSessionPage />} />
            <Route path="sessions/availability" element={<TherapistAvailabilityPage />} />
            <Route path="therapists/:therapistId" element={<TherapistDetailPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="video-call/:roomId" element={<VideoCallPage />} />

            {/* Patient management routes - only accessible by therapists */}
            <Route element={<ProtectedRoute requiredRole="THERAPIST" />}>
              <Route path="patients" element={<PatientListPage />} />
              <Route path="patients/:patientId" element={<PatientDetailPage />} />
            </Route>
          </Route>

          {/* Admin routes - only accessible by admin users */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="therapists" element={<TherapistVerification />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="sessions" element={<SessionMonitoring />} />
              <Route path="reports" element={<Reports />} />
              <Route path="support" element={<Support />} />
              <Route path="settings" element={<Settings />} />
            </Route>
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
