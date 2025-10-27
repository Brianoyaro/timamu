import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import api from '../../utils/api';
import axios from 'axios';
import {
  LiveKitRoom,
  VideoConference,
  ControlBar,
  RoomAudioRenderer,
  useTracks,
  PreJoin,
} from "@livekit/components-react";
import { Track } from 'livekit-client';
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
  const [preJoinComplete, setPreJoinComplete] = useState(false);
  const [devicePermissionsGranted, setDevicePermissionsGranted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  useEffect(() => {
    initializeSession();
  }, [roomId]);
  
  // Request device permissions before joining
  const requestDevicePermissions = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      });
      // Stop the stream after getting permissions
      stream.getTracks().forEach(track => track.stop());
      setDevicePermissionsGranted(true);
      return true;
    } catch (err) {
      console.error('Failed to get device permissions:', err);
      setError('Please grant camera and microphone permissions to join the session.');
      return false;
    }
  }, []);

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

      // Get LiveKit token from MediaSoup server
      const liveKitUrl = import.meta.env.VITE_LIVE_KIT_URL;
          
      console.log('[VideoCall] Requesting LiveKit token from:', liveKitUrl);

      // Create axios instance for LiveKit
      const liveKitApi = axios.create({
        baseURL: liveKitUrl,
        headers: { 'Content-Type': 'application/json' }
      });

      // Get LiveKit token
      let data;
      let { data: liveKitData } = await liveKitApi.post('/token', {
        participantName: `${currentUser.first_name} ${currentUser.last_name}`,
        roomName: roomId
      });
	    console.log(liveKitData);

      if (!liveKitData?.token || !liveKitData?.url) {
        throw new Error('Invalid LiveKit token response');
      }

      setTokenData(liveKitData);
      setJoined(true);

      if (liveKitData?.token && liveKitData?.url) {
        setTokenData(liveKitData);
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

  // Handle pre-join completion
  const handlePreJoinComplete = async ({ audioEnabled, videoEnabled }) => {
    setAudioEnabled(audioEnabled);
    setVideoEnabled(videoEnabled);
    setPreJoinComplete(true);
  };

  // Render simple pre-join screen (custom) to avoid incompatibilities with upstream PreJoin props
  if (tokenData && !preJoinComplete) {
    const handleJoinClick = async () => {
      // Ensure device permissions before joining
      const ok = await requestDevicePermissions();
      if (!ok) return;
      // Apply audio/video defaults and complete pre-join
      setAudioEnabled(!!audioEnabled);
      setVideoEnabled(!!videoEnabled);
      setPreJoinComplete(true);
    };

    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-white/5 p-6 rounded-lg text-white w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Pre-join: {user?.first_name} {user?.last_name}</h2>
          <p className="text-sm mb-4">Check your camera and microphone before joining.</p>

          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={audioEnabled}
                onChange={(e) => setAudioEnabled(e.target.checked)}
              />
              <span className="text-sm">Microphone</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={videoEnabled}
                onChange={(e) => setVideoEnabled(e.target.checked)}
              />
              <span className="text-sm">Camera</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleJoinClick}
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
            >
              Join Session
            </button>

            <button
              onClick={requestDevicePermissions}
              className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
            >
              Test Devices
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900">
      {!devicePermissionsGranted ? (
        <div className="flex flex-col items-center justify-center h-full text-white">
          <h2 className="text-2xl mb-4">Device Permissions Required</h2>
          <p className="mb-4">Please allow access to your camera and microphone to join the session.</p>
          <button
            onClick={requestDevicePermissions}
            className="bg-blue-600 px-5 py-2 rounded hover:bg-blue-700"
          >
            Grant Permissions
          </button>
        </div>
      ) : (
        <LiveKitRoom
          token={tokenData.token}
          serverUrl={tokenData.url}
          connect={true}
          onConnected={() => console.log("✅ Connected to room")}
          onDisconnected={handleDisconnect}
          onError={(err) => setError(err.message)}
          // Audio/video settings
          audio={audioEnabled}
          video={videoEnabled}
          data-lk-theme="default"
          style={{ height: "100vh" }}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      )}
    </div>
  );
};

export default VideoCallPage;
