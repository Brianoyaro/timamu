import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import api from '../../utils/api';
import {
  LiveKitRoom,
  VideoConference,
  useToken
} from "@livekit/components-react";
import "@livekit/components-styles";

const VideoCallPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loadUser = useAuthStore((state) => state.loadUser);

  const [session, setSession] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeSession();
  }, [roomId]);

  const initializeSession = async () => {
    try {
      setLoading(true);
      console.log('=== INITIALIZING SESSION ===');
      
      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }

      // Ensure we have complete user data
      let currentUser = user;
      if (!currentUser || !currentUser.first_name) {
        currentUser = await loadUser();
        if (!currentUser) {
          throw new Error('Failed to load user data');
        }
      }

      // Get session details
      const response = await api.get('/sessions/');
      const sessions = response.data.sessions || response.data;
      const currentSession = sessions.find(s => s.room_id === roomId);
      
      if (!currentSession) {
        throw new Error(`Session not found for room: ${roomId}`);
      }

      // Check permissions
      if (currentUser.id !== currentSession.patient_id && currentUser.id !== currentSession.therapist_id) {
        throw new Error('You do not have permission to join this session');
      }

      setSession(currentSession);

      // Get LiveKit token
      const tokenResponse = await fetch("http://localhost:8000/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantName: `${currentUser.first_name} ${currentUser.last_name}`,
          roomName: roomId
        }),
      });

      const data = await tokenResponse.json();

      if (data?.token && data?.url) {
        setTokenData(data);
        setJoined(true);
      } else {
        throw new Error('Failed to get LiveKit token');
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to initialize session:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setJoined(false);
    setTokenData(null);
    navigate('/sessions');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <h2 className="text-2xl mb-4">Loading session...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <h2 className="text-2xl mb-4">Error</h2>
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => navigate('/sessions')}
          className="bg-blue-600 px-5 py-2 rounded hover:bg-blue-700"
        >
          Back to Sessions
        </button>
      </div>
    );
  }

  if (!tokenData || !joined) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <h2 className="text-2xl mb-4">Failed to join session</h2>
        <button
          onClick={() => navigate('/sessions')}
          className="bg-blue-600 px-5 py-2 rounded hover:bg-blue-700"
        >
          Back to Sessions
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900">
      <LiveKitRoom
        token={tokenData.token}
        serverUrl={tokenData.url}
        connect={true}
        onConnected={() => console.log("✅ Connected to room")}
        onDisconnected={handleDisconnect}
        data-lk-theme="default"
        style={{ height: "100vh" }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
};

export default VideoCallPage;
