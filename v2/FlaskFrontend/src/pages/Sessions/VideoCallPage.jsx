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
      if (!currentUser || (!currentUser.first_name && !currentUser.firstName && !currentUser.name)) {
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

      // LiveKit helper server URL
      const tokenServer = import.meta.env.VITE_LIVE_KIT_URL || 'http://localhost:8000';
      console.log('[VideoCall] Requesting LiveKit token from:', tokenServer);

      const liveKitApi = axios.create({
        baseURL: tokenServer,
        headers: { 'Content-Type': 'application/json' }
      });

      // Extract a display name from available sources
      let displayName = '';
      
      // Try user's name fields first
      const firstName = currentUser?.first_name ?? currentUser?.firstName ?? currentUser?.given_name ?? '';
      const lastName = currentUser?.last_name ?? currentUser?.lastName ?? currentUser?.family_name ?? '';
      if (firstName || lastName) {
        displayName = `${firstName} ${lastName}`.trim();
      }
      
      // If no name fields, try to extract from email
      if (!displayName && currentUser?.email) {
        // Extract the part before @ and convert to title case
        const emailName = currentUser.email.split('@')[0]
          .split(/[._-]/)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');
        displayName = emailName;
      }
      
      // Final fallback
      displayName = displayName || currentUser?.name || 'Anonymous';
      
      console.log('[VideoCall] Using display name:', displayName, 'for user:', currentUser);

      // Request token with display name
      const { data: liveKitData } = await liveKitApi.post('/token', {
        participantName: displayName,
        roomName: roomId,
      });

      if (!liveKitData || !liveKitData.token || !liveKitData.url) {
        console.error('[VideoCall] invalid token response:', liveKitData);
        throw new Error('Invalid LiveKit token response');
      }

      // Store token; don't mark `joined` true until the room confirms connection
      setTokenData(liveKitData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to initialize session:', err);
      setError(err.message || String(err));
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (session?.id) {
      try {
        // Notify backend that user has left the session
        await api.post(`/sessions/${session.id}/leave`);
      } catch (err) {
        console.error('Failed to update session status:', err);
      }
    }
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

  if (!tokenData) {
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

  // Monitor remote media streams
  const StreamDebug = () => {
    // Get all camera and microphone tracks
    const tracks = useTracks([
      Track.Source.Camera,
      Track.Source.Microphone,
    ]);
    
    React.useEffect(() => {
      // Log only when remote tracks change
      const remoteTrackCount = tracks.filter(track => !track.participant.isLocal).length;
      if (remoteTrackCount > 0) {
        console.log(`✅ Receiving ${remoteTrackCount} remote media tracks`);
      }
    }, [tracks]);

    return null; // No UI, just monitoring
  };

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
          onDisconnected={handleDisconnect}
          onError={(err) => setError(err?.message || String(err))}
          audio={audioEnabled}
          video={videoEnabled}
          data-lk-theme="default"
          style={{ height: "100vh" }}
        >
          <div className="h-full flex flex-col">
            <StreamDebug />
            <VideoConference
              style={{
                // Focus on grid layout optimized for video streams
                gridTemplate: 'repeat(auto-fit, minmax(40%, 1fr))',
                gap: '1rem',
                padding: '1rem',
              }}
            />
            {/* Using VideoConference's built-in controls instead
            <ControlBar
              controls={{
                microphone: true,
                camera: true,
                leave: true,
              }}
              style={{
                position: 'fixed',
                bottom: '1rem',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '2rem',
                padding: '0.5rem',
              }}
            />
            */}
          </div>
          <RoomAudioRenderer />
        </LiveKitRoom>
      )}
    </div>
  );
};

export default VideoCallPage;
