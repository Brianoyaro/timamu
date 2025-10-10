import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useSocketStore } from '../../stores/socketStore';
import api from '../../utils/api';

const VideoCallPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const socket = useSocketStore((state) => state.socket);
  
  // Video/Audio refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  
  // State
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Controls state
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    console.log('VideoCallPage mounted for room:', roomId);
    initializeSession();
    return () => {
      console.log('VideoCallPage unmounting, cleaning up...');
      cleanup();
    };
  }, [roomId]);

  useEffect(() => {
    console.log('Socket/session effect triggered:', { 
      socketConnected: !!socket, 
      sessionLoaded: !!session,
      socketIsConnected: socket?.connected 
    });
    
    if (socket && session && socket.connected) {
      console.log('Setting up socket listeners...');
      setupSocketListeners();
    } else if (socket && session && !socket.connected) {
      console.log('Socket exists but not connected, waiting...');
      socket.on('connect', () => {
        console.log('Socket connected, setting up listeners...');
        setupSocketListeners();
      });
    }
  }, [socket, session, socket?.connected]);

  const initializeSession = async () => {
    try {
      console.log('=== INITIALIZING SESSION ===');
      console.log('Room ID from params:', roomId);
      console.log('User object:', user);
      console.log('Is authenticated:', isAuthenticated);
      
      if (!isAuthenticated) {
        setError('You must be logged in to join a video call');
        setLoading(false);
        return;
      }

      // Get all sessions and find the one with matching room_id
      console.log('Fetching all sessions to find by room_id...');
      const response = await api.get('/sessions/');
      const sessions = response.data.sessions || response.data;
      console.log('All sessions received:', sessions);
      
      const currentSession = sessions.find(s => s.room_id === roomId);
      console.log('Found session by room_id:', currentSession);
      
      if (!currentSession) {
        setError('Session not found');
        setLoading(false);
        return;
      }

      setSession(currentSession);

      // Check if user has permission to join
      console.log('=== PERMISSION CHECK ===');
      console.log('User ID:', user.id);
      console.log('Session patient_id:', currentSession.patient_id);
      console.log('Session therapist_id:', currentSession.therapist_id);
      console.log('Session object keys:', Object.keys(currentSession));
      
      if (user.id !== currentSession.patient_id && user.id !== currentSession.therapist_id) {
        console.error('Permission denied - user ID does not match patient or therapist ID');
        setError('You do not have permission to join this session');
        setLoading(false);
        return;
      }

      /*
      console.log('Joining session via API...');
      await api.post(`/sessions/${currentSession.id}/join`);
      console.log('Session joined successfully');
      */
      console.log('Permission check passed!');

      // For development: Allow joining even if can_join is false
      // In production, you might want to enforce this more strictly
      if (!currentSession.can_join) {
        console.warn('Backend says can_join is false, but allowing for development');
      }

      // Note: Skipping session join API call as it might not be needed for video calls
      // The socket-based video room join should be sufficient
      console.log('Session validation complete, proceeding to media initialization');

      // Initialize media after session validation
      await initializeMedia();
      
    } catch (err) {
      console.error('Failed to initialize session:', err);
      setError(`Failed to load session: ${err.message}`);
      setLoading(false);
    }
  };

  const initializeMedia = async () => {
    try {
      console.log('=== REQUESTING MEDIA PERMISSIONS ===');
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported by this browser');
      }
      
      console.log('getUserMedia is available, requesting permissions...');
      
      // Get user media with fallback options
      let stream;
      try {
        console.log('Trying high quality video...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        console.log('High quality stream obtained');
      } catch (err) {
        console.warn('High quality video failed, trying standard quality:', err);
        // Fallback to lower quality
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        console.log('Standard quality stream obtained');
      }
      
      console.log('Media stream obtained:', {
        id: stream.id,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('Local video element set');
        
        // Ensure video plays
        localVideoRef.current.onloadedmetadata = () => {
          console.log('Local video metadata loaded');
          localVideoRef.current.play().then(() => {
            console.log('Local video playing');
          }).catch(err => {
            console.error('Error playing local video:', err);
          });
        };
      }
      
      // Initialize peer connection
      initializePeerConnection();
      
      setConnectionStatus('connected');
      console.log('=== MEDIA INITIALIZATION COMPLETE ===');
    } catch (err) {
      console.error('=== MEDIA ACCESS ERROR ===', err);
      
      // Set a more specific error message
      let errorMessage = 'Could not access camera and microphone. ';
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera and microphone permissions and refresh the page.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera or microphone found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera or microphone is already in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Camera or microphone constraints could not be satisfied.';
      } else {
        errorMessage += `Error: ${err.message}. Please check your device settings and try again.`;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const initializePeerConnection = () => {
    console.log('Initializing peer connection...');
    
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    peerConnectionRef.current = new RTCPeerConnection(configuration);
    
    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log('Adding track to peer connection:', track.kind);
        peerConnectionRef.current.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        console.log('Remote video stream set');
      }
    };

    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log('Sending ICE candidate');
        socket.emit('ice-candidate', {
          room: roomId,
          candidate: event.candidate
        });
      }
    };

    // Connection state monitoring
    peerConnectionRef.current.onconnectionstatechange = () => {
      const state = peerConnectionRef.current.connectionState;
      console.log('Peer connection state:', state);
      setConnectionStatus(state);
    };

    // ICE connection state monitoring
    peerConnectionRef.current.oniceconnectionstatechange = () => {
      const state = peerConnectionRef.current.iceConnectionState;
      console.log('ICE connection state:', state);
    };
    
    console.log('Peer connection initialized');
  };

  const setupSocketListeners = () => {
    if (!socket) {
      console.error('Socket not available for video call');
      setError('Real-time connection not available. Please refresh and try again.');
      return;
    }

    if (!socket.connected) {
      console.error('Socket not connected');
      setError('Socket connection lost. Please refresh and try again.');
      return;
    }

    console.log('=== SETTING UP SOCKET LISTENERS ===');
    console.log('Room ID:', roomId);
    console.log('Session ID:', session.id);
    console.log('User:', user);

    // Join the video room
    console.log('Emitting join-video-room event...');
    socket.emit('join-video-room', {
      room: roomId,
      sessionId: session.id,
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role
      }
    });
    console.log('join-video-room event emitted');

    // Socket event listeners
    socket.on('user-joined', async (data) => {
      console.log('=== USER JOINED ===', data);
      setParticipants(prev => {
        const filtered = prev.filter(p => p.id !== data.user.id);
        return [...filtered, data.user];
      });
      
      // If this is a new user and we're already connected, create offer
      if (peerConnectionRef.current && peerConnectionRef.current.connectionState !== 'closed') {
        console.log('Creating offer for new user...');
        await createOffer();
      }
    });

    socket.on('user-left', (data) => {
      console.log('=== USER LEFT ===', data);
      setParticipants(prev => prev.filter(p => p.id !== data.userId));
      
      // Clear remote video if the user who left was connected
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
        console.log('Remote video cleared');
      }
    });

    socket.on('offer', async (data) => {
      console.log('=== RECEIVED OFFER ===');
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          
          socket.emit('answer', {
            room: roomId,
            answer: answer
          });
          console.log('Answer sent');
        }
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    socket.on('answer', async (data) => {
      console.log('=== RECEIVED ANSWER ===');
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          console.log('Answer processed');
        }
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    socket.on('ice-candidate', async (data) => {
      console.log('=== RECEIVED ICE CANDIDATE ===');
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log('ICE candidate added');
        }
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });

    socket.on('session-message', (data) => {
      console.log('=== RECEIVED MESSAGE ===', data);
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: data.sender,
        message: data.message,
        timestamp: new Date()
      }]);
    });

    // Socket connection error handling
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Connection lost. Please refresh the page.');
    });

    socket.on('disconnect', () => {
      console.warn('Socket disconnected');
      setConnectionStatus('disconnected');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    console.log('=== SOCKET LISTENERS SET UP COMPLETE ===');
  };

  const createOffer = async () => {
    try {
      if (peerConnectionRef.current) {
        console.log('Creating offer...');
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        
        socket.emit('offer', {
          room: roomId,
          offer: offer
        });
        console.log('Offer sent');
      }
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        
        // Notify other participants
        if (socket) {
          socket.emit('participant-update', {
            room: roomId,
            updates: { videoEnabled: videoTrack.enabled }
          });
        }
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        
        // Notify other participants
        if (socket) {
          socket.emit('participant-update', {
            room: roomId,
            updates: { audioEnabled: audioTrack.enabled }
          });
        }
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = screenStream.getVideoTracks()[0];
        
        // Replace video track in peer connection
        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }
        
        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        // Listen for screen share end
        videoTrack.addEventListener('ended', () => {
          stopScreenShare();
        });
        
        setIsScreenSharing(true);
        
        // Notify other participants
        if (socket) {
          socket.emit('participant-update', {
            room: roomId,
            updates: { screenSharing: true }
          });
        }
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const stopScreenShare = async () => {
    try {
      if (localStreamRef.current) {
        // Get camera stream back
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoTrack = cameraStream.getVideoTracks()[0];
        
        // Replace screen share track with camera track
        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }
        
        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = cameraStream;
        }
        
        localStreamRef.current = cameraStream;
        setIsScreenSharing(false);
        
        // Notify other participants
        if (socket) {
          socket.emit('participant-update', {
            room: roomId,
            updates: { screenSharing: false }
          });
        }
      }
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && socket) {
      socket.emit('session-message', {
        room: roomId,
        sessionId: session.id,
        message: newMessage.trim(),
        sender: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role
        }
      });
      setNewMessage('');
    }
  };

  const endSession = () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      cleanup();
      navigate('/sessions');
    }
  };

  const cleanup = () => {
    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Leave socket room
    if (socket && roomId) {
      socket.emit('leave-video-room', { room: roomId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg mb-2">Connecting to session...</p>
          <p className="text-gray-400 text-sm mb-4">Setting up video and audio</p>
          
          {/* Debug loading info */}
          <div className="bg-gray-800 rounded p-3 text-xs text-left">
            <p className="text-yellow-400 mb-1">Debug Info:</p>
            <p className="text-gray-300">Socket: {socket?.connected ? 'Connected' : 'Disconnected'}</p>
            <p className="text-gray-300">User: {user?.first_name} {user?.last_name}</p>
            <p className="text-gray-300">Room: {roomId}</p>
            <p className="text-gray-300">Session: {session ? 'Loaded' : 'Loading...'}</p>
          </div>
          
          <p className="text-gray-500 text-xs mt-4">
            Check browser console for detailed logs
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-red-400 text-xl font-semibold mb-4">Session Error</h2>
          <p className="text-white mb-6">{error}</p>
          
          {error.includes('camera') || error.includes('microphone') ? (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setError('');
                  setLoading(true);
                  initializeMedia();
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 mr-3"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/sessions')}
                className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700"
              >
                Back to Sessions
              </button>
              
              {/* Debug info */}
              <div className="mt-4 p-3 bg-gray-800 rounded text-xs text-left">
                <p className="text-yellow-400 mb-2">Debug Info:</p>
                <p className="text-gray-300">Socket connected: {socket?.connected ? 'Yes' : 'No'}</p>
                <p className="text-gray-300">User: {user?.first_name} {user?.last_name}</p>
                <p className="text-gray-300">Room: {roomId}</p>
                <p className="text-gray-300">Session: {session?.title || 'Not loaded'}</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/sessions')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
            >
              Back to Sessions
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-white text-lg font-semibold">{session?.title}</h1>
          <p className="text-gray-400 text-sm">
            Participants: {participants.length + 1} | Status: {connectionStatus}
          </p>
          <p className="text-gray-500 text-xs">
            Socket: {socket?.connected ? 'Connected' : 'Disconnected'} | 
            Room: {roomId}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Manual join button for debugging */}
          {socket && session && socket.connected && (
            <button
              onClick={() => {
                console.log('Manual join button clicked');
                setupSocketListeners();
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Manual Join
            </button>
          )}
          <button
            onClick={endSession}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex">
        {/* Video Container */}
        <div className="flex-1 relative">
          {/* Remote Video (Main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover bg-gray-800"
          />
          
          {/* No Remote Participant Placeholder */}
          {participants.length === 0 && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <p className="text-white text-lg mb-2">Waiting for other participant</p>
                <p className="text-gray-400 text-sm">Share the session link or wait for them to join</p>
              </div>
            </div>
          )}
          
          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-600">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  <span className="text-white text-xs">Video Off</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Sidebar */}
        {isChatOpen && (
          <div className="w-80 bg-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold">Session Chat</h3>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <div className="text-gray-400">{msg.sender.name}</div>
                  <div className="text-white">{msg.message}</div>
                  <div className="text-gray-500 text-xs">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Message Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-l-md focus:outline-none"
                />
                <button
                  onClick={sendMessage}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4 flex justify-center space-x-4">
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${
            isVideoEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'
          }`}
          title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            {isVideoEnabled ? (
              <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 2v-7l-4 2z" />
            ) : (
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            )}
          </svg>
        </button>

        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full ${
            isAudioEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'
          }`}
          title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            {isAudioEnabled ? (
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z M17.3 11c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z" />
            ) : (
              <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28z M14.98 11.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99z M4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
            )}
          </svg>
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full ${
            isScreenSharing ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
          }`}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.11-.9-2-2-2H4c-1.11 0-2 .89-2 2v10c0 1.1.89 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
          </svg>
        </button>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`p-3 rounded-full ${
            isChatOpen ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-600 hover:bg-gray-700'
          }`}
          title={isChatOpen ? 'Close chat' : 'Open chat'}
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default VideoCallPage;