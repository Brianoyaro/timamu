import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useSocketStore } from '../../stores/socketStore';
import * as mediasoupClient from 'mediasoup-client';
import io from 'socket.io-client';
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
  const remoteVideoRef = useRef(null); // Single remote video element for main display
  const remoteVideosRef = useRef(new Map()); // Map of participantId -> video element (multi-user)
  const localStreamRef = useRef(null);
  const screenShareRef = useRef(null);
  
  // MediaSoup refs
  const mediaSoupSocketRef = useRef(null);
  const deviceRef = useRef(null);
  const producerTransportRef = useRef(null);
  const consumerTransportRef = useRef(null);
  const producersRef = useRef(new Map()); // kind -> Producer
  const consumersRef = useRef(new Map()); // consumerId -> Consumer
  
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

      // Initialize MediaSoup after session validation
      await initializeMediaSoup();
      
    } catch (err) {
      console.error('Failed to initialize session:', err);
      setError(`Failed to load session: ${err.message}`);
      setLoading(false);
    }
  };

  const initializeMediaSoup = async () => {
    try {
      console.log('=== INITIALIZING MEDIASOUP ===');
      
      // Connect to MediaSoup server
      const mediaSoupSocket = io('http://localhost:3001', {
        transports: ['websocket', 'polling']
      });
      
      mediaSoupSocketRef.current = mediaSoupSocket;
      
      // Wait for connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('MediaSoup connection timeout')), 10000);
        
        mediaSoupSocket.on('connect', () => {
          clearTimeout(timeout);
          console.log('Connected to MediaSoup server');
          resolve();
        });
        
        mediaSoupSocket.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('MediaSoup connection error:', error);
          reject(error);
        });
      });
      
      // Set up MediaSoup socket listeners
      setupMediaSoupListeners();
      
      // Join room
      mediaSoupSocket.emit('join-room', { roomId });
      
      // Get user media
      await getUserMedia();
      
      setConnectionStatus('connected');
      setLoading(false);
      console.log('=== MEDIASOUP INITIALIZATION COMPLETE ===');
    } catch (err) {
      console.error('=== MEDIASOUP INITIALIZATION ERROR ===', err);
      setError(`Failed to initialize video service: ${err.message}`);
      setLoading(false);
    }
  };

  const getUserMedia = async () => {
    try {
      console.log('=== REQUESTING MEDIA PERMISSIONS ===');
      
      // Get user media with fallback options
      let stream;
      try {
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
      } catch (err) {
        console.warn('High quality video failed, trying standard quality:', err);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      }
      
      console.log('Media stream obtained');
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.onloadedmetadata = () => {
          localVideoRef.current.play().catch(err => {
            console.error('Error playing local video:', err);
          });
        };
      }
      
    } catch (err) {
      console.error('=== MEDIA ACCESS ERROR ===', err);
      
      let errorMessage = 'Could not access camera and microphone. ';
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera and microphone permissions and refresh the page.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera or microphone found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera or microphone is already in use by another application.';
      } else {
        errorMessage += `Error: ${err.message}. Please check your device settings and try again.`;
      }
      
      throw new Error(errorMessage);
    }
  };

  const setupMediaSoupListeners = () => {
    const mediaSoupSocket = mediaSoupSocketRef.current;
    
    mediaSoupSocket.on('room-joined', async (data) => {
      console.log('MediaSoup room joined:', data);
      
      try {
        // Load device with router RTP capabilities
        deviceRef.current = new mediasoupClient.Device();
        await deviceRef.current.load({ routerRtpCapabilities: data.rtpCapabilities });
        
        // Create producer transport
        await createProducerTransport();
        
        // Create consumer transport
        await createConsumerTransport();
        
        // Start producing media
        await startProducing();
        
        // Get existing producers
        mediaSoupSocket.emit('get-producers');
        
      } catch (error) {
        console.error('Error handling room-joined:', error);
        setError('Failed to setup video connection');
      }
    });
    
    mediaSoupSocket.on('transport-created', (data) => {
      console.log('Transport created:', data.transportId);
    });
    
    mediaSoupSocket.on('transport-connected', () => {
      console.log('Transport connected');
    });
    
    mediaSoupSocket.on('produced', (data) => {
      console.log('Media produced:', data.producerId);
    });
    
    mediaSoupSocket.on('consumed', async (data) => {
      console.log('Consuming media:', data);
      await handleConsumer(data);
    });
    
    mediaSoupSocket.on('new-producer', async (data) => {
      console.log('New producer available:', data);
      await consumeMedia(data.producerId);
    });
    
    mediaSoupSocket.on('producers-list', (data) => {
      console.log('Available producers:', data.producers);
      data.producers.forEach(producer => {
        consumeMedia(producer.producerId);
      });
    });
    
    mediaSoupSocket.on('participant-joined', (data) => {
      console.log('Participant joined:', data);
      setParticipants(prev => [...prev.filter(p => p.socketId !== data.socketId), data]);
    });
    
    mediaSoupSocket.on('participant-left', (data) => {
      console.log('Participant left:', data);
      setParticipants(prev => prev.filter(p => p.socketId !== data.socketId));
      // Remove their video element
      const videoElement = remoteVideosRef.current.get(data.socketId);
      if (videoElement && videoElement.parentNode) {
        videoElement.parentNode.removeChild(videoElement);
      }
      remoteVideosRef.current.delete(data.socketId);
    });
    
    mediaSoupSocket.on('consumer-closed', (data) => {
      console.log('Consumer closed:', data);
      const consumer = consumersRef.current.get(data.consumerId);
      if (consumer) {
        consumer.close();
        consumersRef.current.delete(data.consumerId);
      }
    });
    
    mediaSoupSocket.on('error', (error) => {
      console.error('MediaSoup error:', error);
      setError(`Video connection error: ${error.message}`);
    });
  };
  
  const createProducerTransport = async () => {
    const mediaSoupSocket = mediaSoupSocketRef.current;
    
    return new Promise((resolve, reject) => {
      mediaSoupSocket.emit('create-transport', { direction: 'send' });
      
      mediaSoupSocket.once('transport-created', async (data) => {
        try {
          const transport = deviceRef.current.createSendTransport({
            id: data.transportId,
            iceParameters: data.iceParameters,
            iceCandidates: data.iceCandidates,
            dtlsParameters: data.dtlsParameters,
          });
          
          transport.on('connect', ({ dtlsParameters }, callback, errback) => {
            mediaSoupSocket.emit('connect-transport', {
              transportId: transport.id,
              dtlsParameters
            });
            
            mediaSoupSocket.once('transport-connected', callback);
            mediaSoupSocket.once('error', errback);
          });
          
          transport.on('produce', ({ kind, rtpParameters }, callback, errback) => {
            mediaSoupSocket.emit('produce', {
              transportId: transport.id,
              kind,
              rtpParameters
            });
            
            mediaSoupSocket.once('produced', (data) => {
              callback({ id: data.producerId });
            });
            mediaSoupSocket.once('error', errback);
          });
          
          producerTransportRef.current = transport;
          resolve(transport);
        } catch (error) {
          reject(error);
        }
      });
    });
  };
  
  const createConsumerTransport = async () => {
    const mediaSoupSocket = mediaSoupSocketRef.current;
    
    return new Promise((resolve, reject) => {
      mediaSoupSocket.emit('create-transport', { direction: 'recv' });
      
      mediaSoupSocket.once('transport-created', async (data) => {
        try {
          const transport = deviceRef.current.createRecvTransport({
            id: data.transportId,
            iceParameters: data.iceParameters,
            iceCandidates: data.iceCandidates,
            dtlsParameters: data.dtlsParameters,
          });
          
          transport.on('connect', ({ dtlsParameters }, callback, errback) => {
            mediaSoupSocket.emit('connect-transport', {
              transportId: transport.id,
              dtlsParameters
            });
            
            mediaSoupSocket.once('transport-connected', callback);
            mediaSoupSocket.once('error', errback);
          });
          
          consumerTransportRef.current = transport;
          resolve(transport);
        } catch (error) {
          reject(error);
        }
      });
    });
  };
  
  const startProducing = async () => {
    const stream = localStreamRef.current;
    const transport = producerTransportRef.current;
    
    if (!stream || !transport) return;
    
    try {
      // Produce video
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const videoProducer = await transport.produce({ track: videoTrack });
        producersRef.current.set('video', videoProducer);
        console.log('Video producer created');
      }
      
      // Produce audio
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const audioProducer = await transport.produce({ track: audioTrack });
        producersRef.current.set('audio', audioProducer);
        console.log('Audio producer created');
      }
    } catch (error) {
      console.error('Error starting production:', error);
    }
  };
  
  const consumeMedia = async (producerId) => {
    const mediaSoupSocket = mediaSoupSocketRef.current;
    const device = deviceRef.current;
    
    if (!device.canConsume({ producerId, rtpCapabilities: device.rtpCapabilities })) {
      console.warn('Cannot consume producer:', producerId);
      return;
    }
    
    mediaSoupSocket.emit('consume', {
      transportId: consumerTransportRef.current.id,
      producerId,
      rtpCapabilities: device.rtpCapabilities
    });
  };
  
  const handleConsumer = async (data) => {
    try {
      const consumer = await consumerTransportRef.current.consume({
        id: data.consumerId,
        producerId: data.producerId,
        kind: data.kind,
        rtpParameters: data.rtpParameters
      });
      
      consumersRef.current.set(consumer.id, consumer);
      
      // Resume consumer
      mediaSoupSocketRef.current.emit('resume-consumer', { consumerId: consumer.id });
      
      // Handle the media track
      handleRemoteTrack(consumer.track, data.producerId);
      
      console.log('Consumer created and resumed');
    } catch (error) {
      console.error('Error handling consumer:', error);
    }
  };
  
  const handleRemoteTrack = (track, producerId) => {
    console.log('Handling remote track:', track.kind);
    
    // Create or get video element for this producer
    let videoElement = document.getElementById(`remote-video-${producerId}`);
    
    if (!videoElement) {
      videoElement = document.createElement('video');
      videoElement.id = `remote-video-${producerId}`;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.className = 'w-full h-64 object-cover bg-gray-800 rounded-lg';
      
      // Add to remote videos container
      const remoteContainer = document.getElementById('remote-videos-container');
      if (remoteContainer) {
        const participantContainer = document.createElement('div');
        participantContainer.className = 'relative bg-gray-800 rounded-lg overflow-hidden';
        participantContainer.appendChild(videoElement);
        
        // Add participant label
        const label = document.createElement('div');
        label.className = 'absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded';
        label.textContent = `Participant`;
        participantContainer.appendChild(label);
        
        remoteContainer.appendChild(participantContainer);
      }
    }
    
    // Set up media stream
    if (!videoElement.srcObject) {
      videoElement.srcObject = new MediaStream();
    }
    
    // Add track to stream
    if (track.kind === 'video') {
      // Remove existing video tracks
      const existingTracks = videoElement.srcObject.getVideoTracks();
      existingTracks.forEach(t => videoElement.srcObject.removeTrack(t));
      videoElement.srcObject.addTrack(track);
    } else if (track.kind === 'audio') {
      // Remove existing audio tracks
      const existingTracks = videoElement.srcObject.getAudioTracks();
      existingTracks.forEach(t => videoElement.srcObject.removeTrack(t));
      videoElement.srcObject.addTrack(track);
    }
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

    // Join the MediaSoup room
    console.log('Emitting join-room event...');
    socket.emit('join-room', {
      roomId,
      sessionId: session.id,
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role
      }
    });
    console.log('join-room event emitted');

    // Socket event listeners
    socket.on('user-joined', (data) => {
      console.log('=== USER JOINED ===', data);
      setParticipants(prev => {
        const filtered = prev.filter(p => p.id !== data.user.id);
        return [...filtered, data.user];
      });
    });

    socket.on('user-left', (data) => {
      console.log('=== USER LEFT ===', data);
      setParticipants(prev => prev.filter(p => p.id !== data.userId));
      
      // Close consumer for the user who left
      const userConsumers = Array.from(consumersRef.current.values()).filter(
        consumer => consumer.appData?.userId === data.userId
      );
      
      userConsumers.forEach(consumer => {
        consumer.close();
        consumersRef.current.delete(consumer.id);
      });
    });



    socket.on('session-message', (data) => {
      console.log('=== RECEIVED MESSAGE ===', data);
      setMessages(prev => [...prev, {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
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



  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        
        // Pause/resume MediaSoup producer
        const videoProducer = producersRef.current.get('video');
        if (videoProducer) {
          if (videoTrack.enabled) {
            videoProducer.resume();
          } else {
            videoProducer.pause();
          }
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
        
        // Pause/resume MediaSoup producer
        const audioProducer = producersRef.current.get('audio');
        if (audioProducer) {
          if (audioTrack.enabled) {
            audioProducer.resume();
          } else {
            audioProducer.pause();
          }
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
        
        // Replace video track in MediaSoup producer
        const videoProducer = producersRef.current.get('video');
        if (videoProducer) {
          await videoProducer.replaceTrack({ track: videoTrack });
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
        screenShareRef.current = screenStream;
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const stopScreenShare = async () => {
    try {
      // Stop screen share tracks
      if (screenShareRef.current) {
        screenShareRef.current.getTracks().forEach(track => track.stop());
        screenShareRef.current = null;
      }
      
      // Get camera stream back
      await getUserMedia();
      
      // Replace screen share track with camera track
      const videoProducer = producersRef.current.get('video');
      if (videoProducer && localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          await videoProducer.replaceTrack({ track: videoTrack });
        }
      }
      
      // Update local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      
      setIsScreenSharing(false);
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
    
    if (screenShareRef.current) {
      screenShareRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Close MediaSoup producers
    producersRef.current.forEach(producer => {
      producer.close();
    });
    producersRef.current.clear();
    
    // Close MediaSoup consumers
    consumersRef.current.forEach(consumer => {
      consumer.close();
    });
    consumersRef.current.clear();
    
    // Close MediaSoup transports
    if (producerTransportRef.current) {
      producerTransportRef.current.close();
    }
    
    if (consumerTransportRef.current) {
      consumerTransportRef.current.close();
    }
    
    // Leave socket room
    if (socket && roomId) {
      socket.emit('leave-room', { roomId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4">
          <h1 className="text-white text-lg font-semibold">
            {session?.title || 'Loading Session...'}
          </h1>
          <p className="text-gray-400 text-sm">
            Setting up your connection...
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Show local video prominently if available */}
          {localStreamRef.current ? (
            <div className="w-full h-full relative bg-gray-800">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Overlay with status */}
              <div className="absolute top-6 left-6 bg-black bg-opacity-60 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <div>
                    <p className="text-white font-semibold">Ready to join</p>
                    <p className="text-gray-300 text-sm">Waiting for other participants...</p>
                  </div>
                </div>
              </div>

              {/* Join status overlay */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-black bg-opacity-60 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm">
                        You can see and hear yourself. Others will join soon.
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Check your audio and video before others arrive
                      </p>
                    </div>
                    <div className="text-green-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Traditional loading screen if no video yet
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
          )}
        </div>

        {/* Basic controls at bottom if media is ready */}
        {localStreamRef.current && (
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
          </div>
        )}
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
          {/* Logout Button */}
          <button
            onClick={() => {
              const logout = useAuthStore.getState().logout;
              cleanup();
              logout();
              navigate('/login');
            }}
            className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 text-sm"
            title="Logout"
          >
            <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Logout
          </button>
          
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
                <p className="text-white text-lg mb-2">You're the first one here!</p>
                <p className="text-gray-400 text-sm mb-4">
                  Others will see you when they join. You can test your camera and audio in the preview below.
                </p>
                <div className="bg-green-500 bg-opacity-20 border border-green-500 rounded-lg p-3 mb-4">
                  <p className="text-green-300 text-sm">
                    ✓ Your camera and microphone are working
                  </p>
                </div>
                <p className="text-gray-500 text-xs">
                  Share the session link or wait for them to join
                </p>
              </div>
            </div>
          )}
          
          {/* Local Video (Responsive size - larger when alone, smaller when others present) */}
          <div className={`absolute ${
            participants.length === 0 
              ? 'bottom-6 right-6 w-80 h-60' // Larger when alone
              : 'top-4 right-4 w-48 h-36'   // Smaller when others present
          } bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-600 shadow-lg`}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* User name overlay */}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 rounded px-2 py-1">
              <p className="text-white text-xs font-semibold">
                You {!isVideoEnabled && '(Video Off)'}
              </p>
            </div>
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