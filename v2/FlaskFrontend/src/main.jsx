import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

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
import VideoCallPage from './pages/Sessions/VideoCallPage.jsx';

// Protected Route
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';
import TestMessage from './components/TestMessage.jsx'; // Temporary for testing purposes

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
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
            <Route path="profile" element={<div>Profile Page (Coming Soon)</div>} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="sessions/schedule" element={<ScheduleSessionPage />} />
            <Route path="video-call/:roomId" element={<VideoCallPage />} />
            <Route path="test-socket" element={<TestMessage />} />
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
  </React.StrictMode>
)
