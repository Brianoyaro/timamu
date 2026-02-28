import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  Chat,
  useTracks,
  useParticipants,
  useLocalParticipant,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { sessionsAPI } from '../services/api';

export default function VideoSession() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Start session and get token
        console.log('🚀 Starting session for booking:', bookingId);
        await sessionsAPI.start(bookingId);
        
        console.log('🎫 Getting LiveKit token...');
        const tokenResponse = await sessionsAPI.getToken(bookingId);

        console.log('📦 Token response:', tokenResponse.data);
        const { token, serverUrl } = tokenResponse.data.data;

        console.log('🔑 Extracted token:', {
          tokenType: typeof token,
          tokenValue: token,
          serverUrl: serverUrl
        });

        setToken(token);
        setServerUrl(serverUrl);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize session:', error);
        setError(
          error.response?.data?.message || 'Failed to start video session'
        );
        setIsLoading(false);
      }
    };

    initSession();
  }, [bookingId]);

  const handleDisconnect = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Connecting to session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="card max-w-md">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Connection Error
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return null;
  }

  return (
    <div className="video-room-container">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        connect={true}
        onDisconnected={handleDisconnect}
        className="lk-room"
      >
        <MeetingLayout onLeave={handleDisconnect} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

// Custom Zoom/Google Meet-like Layout
function MeetingLayout({ onLeave }) {
  const [showChat, setShowChat] = useState(false);
  const participants = useParticipants();
  const {
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
    localParticipant,
  } = useLocalParticipant();

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const toggleMicrophone = async () => {
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  const toggleCamera = async () => {
    await localParticipant.setCameraEnabled(!isCameraEnabled);
  };

  const toggleScreenShare = async () => {
    await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
  };

  return (
    <div className="meeting-layout">
      {/* Top Bar */}
      <div className="meeting-top-bar">
        <div className="meeting-time">{currentTime}</div>
        <div className="meeting-info">
          <svg className="info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Therapy Session</span>
        </div>
      </div>

      {/* Main Video Grid */}
      <div className="meeting-video-container">
        <div className="meeting-grid-wrapper">
          <GridLayout tracks={tracks} className="custom-grid">
            <ParticipantTile />
          </GridLayout>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="meeting-controls-bar">
        <div className="meeting-controls-left">
          <div className="meeting-participant-count">
            <svg className="participant-icon" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span>{participants.length}</span>
          </div>
        </div>

        <div className="meeting-controls-center">
          {/* Microphone */}
          <button
            onClick={toggleMicrophone}
            className={`control-button ${!isMicrophoneEnabled ? 'disabled' : ''}`}
            title={isMicrophoneEnabled ? 'Mute' : 'Unmute'}
          >
            {isMicrophoneEnabled ? (
              <svg className="control-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg className="control-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
            <span className="control-label">
              {isMicrophoneEnabled ? 'Mute' : 'Unmute'}
            </span>
          </button>

          {/* Camera */}
          <button
            onClick={toggleCamera}
            className={`control-button ${!isCameraEnabled ? 'disabled' : ''}`}
            title={isCameraEnabled ? 'Stop Video' : 'Start Video'}
          >
            {isCameraEnabled ? (
              <svg className="control-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="control-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            )}
            <span className="control-label">
              {isCameraEnabled ? 'Stop Video' : 'Start Video'}
            </span>
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`control-button ${isScreenShareEnabled ? 'active' : ''}`}
            title="Share Screen"
          >
            <svg className="control-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
            <span className="control-label">Share</span>
          </button>

          {/* Leave */}
          <button
            onClick={onLeave}
            className="control-button leave-button"
            title="Leave Session"
          >
            <svg className="control-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="control-label">Leave</span>
          </button>
        </div>

        <div className="meeting-controls-right">
          {/* Chat */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`control-button icon-only ${showChat ? 'active' : ''}`}
            title="Toggle Chat"
          >
            <svg className="control-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>

          {/* More Options */}
          <button
            className="control-button icon-only"
            title="More Options"
          >
            <svg className="control-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <>
          <div className="meeting-overlay" onClick={() => setShowChat(false)} />
          <div className="meeting-chat-panel">
            <div className="meeting-chat-header">
              <h3>In-call messages</h3>
              <button
                onClick={() => setShowChat(false)}
                className="meeting-chat-close"
                title="Close chat"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="meeting-chat-body">
              <Chat />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
