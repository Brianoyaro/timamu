import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import api from '../../utils/api';

// Import our new components
import {
  VideoControls,
  ChatPanel,
  EndSessionModal,
  ConnectionStatus,
  LoadingScreen,
  ErrorScreen,
  ParticipantVideo
} from '../../components/VideoCall';

// Import our custom hook
import { useMediaSoup } from '../../hooks/useMediaSoup';

const VideoCallPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loadUser = useAuthStore((state) => state.loadUser);
  
  // State
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);

  // Use our custom MediaSoup hook
  const {
    localVideoRef,
    localStream,
    loading,
    error,
    connectionStatus,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    sendMessage: sendChatMessage,
    cleanup,
    initialize,
    connectVideoRef
  } = useMediaSoup(roomId, session, setMessages, setParticipants);

  useEffect(() => {
    console.log('VideoCallPage mounted for room:', roomId);
    initializeSession();
    return () => {
      console.log('VideoCallPage unmounting, cleaning up...');
      cleanup();
    };
  }, [roomId, cleanup]);

  useEffect(() => {
    console.log('Session effect triggered:', { 
      sessionLoaded: !!session
    });
    if (session) {
      initialize();
    }
  }, [session, initialize]);

  // Connect video stream when component is ready and no longer loading
  useEffect(() => {
    console.log('Video connection effect:', { loading, hasConnectVideoRef: !!connectVideoRef });
    if (!loading && connectVideoRef) {
      connectVideoRef();
    }
  }, [loading, connectVideoRef]);

  const initializeSession = async () => {
    try {
      console.log('=== INITIALIZING SESSION ===');
      console.log('Room ID from params:', roomId);
      console.log('User object:', user);
      console.log('Is authenticated:', isAuthenticated);
      
      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }

      // Ensure we have complete user data
      let currentUser = user;
      if (!currentUser || !currentUser.first_name) {
        console.log('Incomplete user data, loading fresh user data...');
        currentUser = await loadUser();
        if (!currentUser) {
          throw new Error('Failed to load user data');
        }
      }

      // Get all sessions and find the one with matching room_id
      console.log('Fetching all sessions to find by room_id...');
      const response = await api.get('/sessions/');
      const sessions = response.data.sessions || response.data;
      console.log('All sessions received:', sessions);
      
      const currentSession = sessions.find(s => s.room_id === roomId);
      console.log('Found session by room_id:', currentSession);
      
      if (!currentSession) {
        throw new Error(`Session not found for room: ${roomId}`);
      }

      // Check if user has permission to join
      console.log('=== PERMISSION CHECK ===');
      console.log('User ID:', currentUser.id);
      console.log('Session patient_id:', currentSession.patient_id);
      console.log('Session therapist_id:', currentSession.therapist_id);
      
      if (currentUser.id !== currentSession.patient_id && currentUser.id !== currentSession.therapist_id) {
        throw new Error('You do not have permission to join this session');
      }

      console.log('Permission check passed!');

      // For development: Allow joining even if can_join is false
      if (!currentSession.can_join) {
        console.warn('Session cannot be joined, but proceeding anyway for development');
      }

      setSession(currentSession);
      console.log('Session validation complete');
      
    } catch (err) {
      console.error('Failed to initialize session:', err);
      // Error handling is now managed by the custom hook
    }
  };

  // Message handling
  const sendMessage = () => {
    if (!newMessage.trim()) {
      return;
    }

    sendChatMessage(newMessage, session, user);
    setNewMessage('');
  };

  // Session management
  const endSession = () => {
    setShowEndSessionModal(true);
  };

  const handleEndSession = () => {
    setShowEndSessionModal(false);
    cleanup();
    navigate('/sessions');
  };

  const handleCancelEndSession = () => {
    setShowEndSessionModal(false);
  };

  // Loading state
  if (loading) {
    return (
      <LoadingScreen 
        session={session}
        localVideoRef={localVideoRef}
        localStream={localStream}
        connectionStatus={connectionStatus}
        navigate={navigate}
        isVideoEnabled={isVideoEnabled}
        isAudioEnabled={isAudioEnabled}
        toggleVideo={toggleVideo}
        toggleAudio={toggleAudio}
        user={user}
        roomId={roomId}
      />
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorScreen 
        error={error}
        navigate={navigate}
        onRetry={() => window.location.reload()}
        user={user}
        roomId={roomId}
        session={session}
      />
    );
  }

  // Main video call interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex flex-col">
      {/* Header with connection status */}
      <ConnectionStatus 
        session={session}
        connectionStatus={connectionStatus}
        participantCount={participants.length}
        onGoBack={() => navigate('/sessions')}
      />

      {/* Main video area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Video grid */}
        <div className="flex-1 flex flex-col">
          {/* Local video (large) */}
          <div className="flex-1 relative bg-gray-900">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Local video overlay */}
            <div className="absolute bottom-4 left-4">
              <div className="bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
                You {!isVideoEnabled && '(Camera Off)'} {!isAudioEnabled && '(Muted)'}
              </div>
            </div>
          </div>

          {/* Remote participants */}
          <div id="remote-videos-container" className="flex flex-wrap gap-2 p-2 bg-slate-800/50">
            {participants.map((participant) => (
              <ParticipantVideo
                key={participant.socketId}
                participant={participant}
                className="w-48 h-36"
              />
            ))}
          </div>
        </div>

        {/* Chat panel (slide in from right) */}
        <ChatPanel
          isOpen={isChatOpen}
          messages={messages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSendMessage={sendMessage}
          onClose={() => setIsChatOpen(false)}
        />
      </div>

      {/* Control bar */}
      <VideoControls
        isVideoEnabled={isVideoEnabled}
        isAudioEnabled={isAudioEnabled}
        isScreenSharing={isScreenSharing}
        isChatOpen={isChatOpen}
        onToggleVideo={toggleVideo}
        onToggleAudio={toggleAudio}
        onToggleScreenShare={toggleScreenShare}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onEndSession={endSession}
        messageCount={messages.length}
      />

      {/* End session modal */}
      <EndSessionModal
        isOpen={showEndSessionModal}
        onConfirm={handleEndSession}
        onCancel={handleCancelEndSession}
      />
    </div>
  );
};

export default VideoCallPage;
