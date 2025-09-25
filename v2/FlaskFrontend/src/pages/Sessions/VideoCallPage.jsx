import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useSocketStore } from '../../stores/socketStore';
import api from '../../utils/api';

const VideoCallPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
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
    initializeSession();
    return () => {
      cleanup();
    };
  }, [roomId]);

  useEffect(() => {
    if (socket && session) {
      setupSocketListeners();
    }
  }, [socket, session]);

  const initializeSession = async () => {
    try {
      // Find session by room_id
      const response = await api.get('/sessions/');
      const sessions = response.data;
      const currentSession = sessions.find(s => s.room_id === roomId);
      
      if (!currentSession) {
        setError('Session not found');
        return;
      }

      // Check if user has permission to join
      if (user.id !== currentSession.patient_id && user.id !== currentSession.therapist_id) {
        setError('You do not have permission to join this session');
        return;
      }

      setSession(currentSession);
      
      // Join the session
      await api.post(`/sessions/${currentSession.id}/join`);

      // Initialize media
      await initializeMedia();
      
      setLoading(false);
    } catch (err) {
      console.error('Error initializing session:', err);
      setError(err.message || 'Failed to initialize session');
      setLoading(false);
    }
  };

  const initializeMedia = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Initialize peer connection
      initializePeerConnection();
      
      setConnectionStatus('connected');
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Could not access camera and microphone. Please check permissions.');
    }
  };

  const initializePeerConnection = () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };

    peerConnectionRef.current = new RTCPeerConnection(configuration);
    
    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          room: roomId,
          candidate: event.candidate
        });
      }
    };
  };

  const setupSocketListeners = () => {
    if (!socket) return;

    // Join the video room
    socket.emit('join-video-room', {
      room: roomId,
      sessionId: session.id,
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role
      }
    });

    // Socket event listeners
    socket.on('user-joined', (data) => {
      console.log('User joined:', data);
      setParticipants(prev => [...prev.filter(p => p.id !== data.user.id), data.user]);
      
      // If this is a new user and we're already connected, create offer
      if (peerConnectionRef.current) {
        createOffer();
      }
    });

    socket.on('user-left', (data) => {
      console.log('User left:', data);
      setParticipants(prev => prev.filter(p => p.id !== data.userId));
    });

    socket.on('offer', async (data) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        
        socket.emit('answer', {
          room: roomId,
          answer: answer
        });
      }
    });

    socket.on('answer', async (data) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    socket.on('ice-candidate', async (data) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    socket.on('session-message', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: data.sender,
        message: data.message,
        timestamp: new Date()
      }]);
    });

    socket.on('participant-update', (data) => {
      setParticipants(prev => 
        prev.map(p => p.id === data.userId ? { ...p, ...data.updates } : p)
      );
    });
  };

  const createOffer = async () => {
    if (peerConnectionRef.current) {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      socket.emit('offer', {
        room: roomId,
        offer: offer
      });
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Connecting to session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-red-400 text-xl font-semibold mb-4">Session Error</h2>
          <p className="text-white mb-6">{error}</p>
          <button
            onClick={() => navigate('/sessions')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Sessions
          </button>
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
        </div>
        <button
          onClick={endSession}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          End Session
        </button>
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
                <span className="text-white text-sm">Video Off</span>
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