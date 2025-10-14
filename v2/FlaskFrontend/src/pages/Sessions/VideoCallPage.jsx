import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import * as mediasoupClient from 'mediasoup-client';
import io from 'socket.io-client';
import api from '../../utils/api';
import {
  MdVideocam,
  MdVideocamOff,
  MdMic,
  MdMicOff,
  MdScreenShare,
  MdStopScreenShare,
  MdChat,
  MdCallEnd,
  MdMoreVert,
  MdPerson,
  MdSignalWifi4Bar,
  MdSignalWifiOff,
  MdSend,
  MdClose,
  MdRefresh,
  MdArrowBack
} from 'react-icons/md';
import { 
  HiOutlineChatBubbleBottomCenter,
  HiOutlineUserGroup,
  HiOutlineSignal,
  HiOutlineExclamationTriangle
} from 'react-icons/hi2';

const VideoCallPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const loadUser = useAuthStore((state) => state.loadUser);
  
  // Video/Audio refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null); // Single remote video element for main display
  const remoteVideosRef = useRef(new Map()); // Map of participantId -> video element (multi-user)
  const localStreamRef = useRef(null);
  const screenShareRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  // MediaSoup refs
  const mediaSoupSocketRef = useRef(null);
  const deviceRef = useRef(null);
  const producerTransportRef = useRef(null);
  const consumerTransportRef = useRef(null);
  const producersRef = useRef(new Map()); // kind -> Producer
  const consumersRef = useRef(new Map()); // consumerId -> Consumer
  const dataProducerRef = useRef(null); // For chat messages
  const dataConsumersRef = useRef(new Map()); // dataConsumerId -> DataConsumer
  
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    console.log('Session effect triggered:', { 
      sessionLoaded: !!session
    });
    // MediaSoup handles all communication now - no need for Flask socket
  }, [session]);

  const initializeSession = async () => {
    try {
      console.log('=== INITIALIZING SESSION ===');
      console.log('Room ID from params:', roomId);
      console.log('User object:', user);
      console.log('User object keys:', Object.keys(user || {}));
      console.log('Is authenticated:', isAuthenticated);
      
      if (!isAuthenticated) {
        setError('You must be logged in to join a video call');
        setLoading(false);
        return;
      }

      // Ensure we have complete user data
      let currentUser = user;
      if (!currentUser || !currentUser.first_name) {
        console.log('Loading full user data...');
        try {
          currentUser = await loadUser();
          console.log('Full user data loaded:', currentUser);
        } catch (error) {
          console.error('Failed to load user data:', error);
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
        setError('Session not found');
        setLoading(false);
        return;
      }

      setSession(currentSession);

      // Check if user has permission to join
      console.log('=== PERMISSION CHECK ===');
      console.log('User ID:', currentUser.id);
      console.log('Session patient_id:', currentSession.patient_id);
      console.log('Session therapist_id:', currentSession.therapist_id);
      console.log('Session object keys:', Object.keys(currentSession));
      
      if (currentUser.id !== currentSession.patient_id && currentUser.id !== currentSession.therapist_id) {
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
        
        // Set up data producer for chat
        await createDataProducer();
        
        // Get existing data producers
        mediaSoupSocket.emit('get-data-producers');
        
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
      console.log('Current participants before update:', participants);
      setParticipants(prev => {
        const filtered = prev.filter(p => p.socketId !== data.socketId);
        const updated = [...filtered, data];
        console.log('Updated participants list:', updated);
        return updated;
      });
    });
    
    mediaSoupSocket.on('participant-left', (data) => {
      console.log('Participant left:', data);
      console.log('Current participants before removal:', participants);
      setParticipants(prev => {
        const updated = prev.filter(p => p.socketId !== data.socketId);
        console.log('Updated participants list after removal:', updated);
        return updated;
      });
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
    
    // Data channel listeners for chat
    mediaSoupSocket.on('data-produced', (data) => {
      console.log('Data producer created:', data.dataProducerId);
    });
    
    mediaSoupSocket.on('new-data-producer', async (data) => {
      console.log('New data producer available:', data);
      await consumeData(data.dataProducerId);
    });
    
    mediaSoupSocket.on('data-producers-list', (data) => {
      console.log('Available data producers:', data.dataProducers);
      data.dataProducers.forEach(dataProducer => {
        consumeData(dataProducer.dataProducerId);
      });
    });
    
    mediaSoupSocket.on('data-consumed', async (data) => {
      console.log('Data consumer created:', data);
      await handleDataConsumer(data);
    });
    
    mediaSoupSocket.on('data-consumer-closed', (data) => {
      console.log('Data consumer closed:', data);
      const dataConsumer = dataConsumersRef.current.get(data.dataConsumerId);
      if (dataConsumer) {
        dataConsumersRef.current.delete(data.dataConsumerId);
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
          console.log('Producer transport data:', { 
            transportId: data.transportId,
            hasSctpParameters: !!data.sctpParameters,
            sctpParameters: data.sctpParameters 
          });
          const transport = deviceRef.current.createSendTransport({
            id: data.transportId,
            iceParameters: data.iceParameters,
            iceCandidates: data.iceCandidates,
            dtlsParameters: data.dtlsParameters,
            sctpParameters: data.sctpParameters,
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
          
          transport.on('producedata', ({ sctpStreamParameters, label, protocol }, callback, errback) => {
            console.log('=== TRANSPORT PRODUCEDATA EVENT ===', {
              sctpStreamParameters,
              label,
              protocol,
              transportId: transport.id
            });
            
            mediaSoupSocket.emit('produce-data', {
              transportId: transport.id,
              sctpStreamParameters,
              label,
              protocol
            });
            
            mediaSoupSocket.once('data-produced', (data) => {
              console.log('=== DATA-PRODUCED RESPONSE RECEIVED ===', data);
              callback({ id: data.dataProducerId });
            });
            mediaSoupSocket.once('error', (error) => {
              console.error('=== PRODUCE-DATA ERROR ===', error);
              errback(error);
            });
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
          console.log('Consumer transport data:', { 
            transportId: data.transportId,
            hasSctpParameters: !!data.sctpParameters,
            sctpParameters: data.sctpParameters 
          });
          const transport = deviceRef.current.createRecvTransport({
            id: data.transportId,
            iceParameters: data.iceParameters,
            iceCandidates: data.iceCandidates,
            dtlsParameters: data.dtlsParameters,
            sctpParameters: data.sctpParameters,
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

  // Data producer for chat messages
  const createDataProducer = async () => {
    const transport = producerTransportRef.current;
    if (!transport) {
      console.error('No producer transport available for data producer');
      return;
    }
    
    console.log('=== CREATING DATA PRODUCER ===');
    console.log('Transport:', transport.id);
    console.log('Transport SCTP capabilities:', transport.sctpParameters);
    
    try {
      // This will trigger the 'producedata' event on the transport
      const dataProducer = await transport.produceData({
        ordered: true,
        maxPacketLifeTime: 3000,
        label: 'chat',
        protocol: 'json'
      });
      
      dataProducerRef.current = dataProducer;
      console.log('=== DATA PRODUCER CREATED SUCCESSFULLY ===', {
        id: dataProducer.id,
        label: dataProducer.label,
        protocol: dataProducer.protocol,
        readyState: dataProducer.readyState
      });
      
      // No need to manually emit 'produce-data' - the transport event handler does this
    } catch (error) {
      console.error('=== ERROR CREATING DATA PRODUCER ===', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
  };
  
  const consumeData = async (dataProducerId) => {
    const mediaSoupSocket = mediaSoupSocketRef.current;
    const transport = consumerTransportRef.current;
    
    if (!transport) {
      console.warn('No consumer transport available for data consumption');
      return;
    }
    
    mediaSoupSocket.emit('consume-data', {
      transportId: transport.id,
      dataProducerId
    });
  };
  
  const handleDataConsumer = async (data) => {
    try {
      const dataConsumer = await consumerTransportRef.current.consumeData({
        id: data.dataConsumerId,
        dataProducerId: data.dataProducerId,
        sctpStreamParameters: data.sctpStreamParameters,
        label: data.label,
        protocol: data.protocol
      });
      
      dataConsumersRef.current.set(dataConsumer.id, dataConsumer);
      
      // Listen for messages
      dataConsumer.on('message', (message) => {
        try {
          const messageData = JSON.parse(message);
          console.log('Received message via data channel:', messageData);
          
          // Don't add your own messages - they're already added when sending
          const currentUser = useAuthStore.getState().user;
          if (messageData.sender.id !== currentUser.id) {
            setMessages(prev => [...prev, {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              sender: messageData.sender,
              message: messageData.message,
              timestamp: new Date(messageData.timestamp),
              isOwn: false
            }]);
          } else {
            console.log('Ignoring own message received via data channel');
          }
        } catch (error) {
          console.error('Error parsing data channel message:', error);
        }
      });
      
      console.log('Data consumer created and listening for messages');
    } catch (error) {
      console.error('Error handling data consumer:', error);
    }
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
    if (newMessage.trim() && dataProducerRef.current) {
      // Get current user from store (should have full data now)
      const currentUser = useAuthStore.getState().user;
      
      // Extract name from email if first_name/last_name are not available
      const displayName = currentUser.first_name && currentUser.last_name 
        ? `${currentUser.first_name} ${currentUser.last_name}`
        : currentUser.name || currentUser.email?.split('@')[0] || 'Anonymous User';
      
      const messageData = {
        room: roomId,
        sessionId: session.id,
        message: newMessage.trim(),
        sender: {
          id: currentUser.id,
          name: displayName,
          role: currentUser.role
        },
        timestamp: new Date().toISOString()
      };
      
      console.log('=== SENDING MESSAGE VIA DATA CHANNEL ===', {
        messageData,
        dataProducerReady: !!dataProducerRef.current,
        messagesCount: messages.length
      });
      
      try {
        // Send via MediaSoup data channel
        dataProducerRef.current.send(JSON.stringify(messageData));
        
        // Immediately add to local messages for instant feedback
        const newMsg = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sender: messageData.sender,
          message: messageData.message,
          timestamp: new Date(),
          isOwn: true // Mark as own message
        };
        
        console.log('=== ADDING LOCAL MESSAGE ===', newMsg);
        setMessages(prev => {
          const updated = [...prev, newMsg];
          console.log('=== MESSAGES UPDATED ===', { previousCount: prev.length, newCount: updated.length });
          return updated;
        });
        
        setNewMessage('');
      } catch (error) {
        console.error('Error sending message via data channel:', error);
      }
    } else {
      console.warn('=== CANNOT SEND MESSAGE ===', {
        hasMessage: !!newMessage.trim(),
        hasDataProducer: !!dataProducerRef.current
      });
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
    
    // Close data producer and consumers
    if (dataProducerRef.current) {
      dataProducerRef.current.close();
      dataProducerRef.current = null;
    }
    
    dataConsumersRef.current.forEach(dataConsumer => {
      dataConsumer.close();
    });
    dataConsumersRef.current.clear();
    
    // Close MediaSoup transports
    if (producerTransportRef.current) {
      producerTransportRef.current.close();
    }
    
    if (consumerTransportRef.current) {
      consumerTransportRef.current.close();
    }
    
    // Disconnect MediaSoup socket
    if (mediaSoupSocketRef.current) {
      mediaSoupSocketRef.current.disconnect();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex flex-col">
        {/* Modern Header */}
        <div className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/sessions')}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors md:hidden"
              >
                <MdArrowBack className="w-5 h-5 text-gray-300" />
              </button>
              <div>
                <h1 className="text-white text-sm sm:text-lg font-semibold truncate max-w-[200px] sm:max-w-none">
                  {session?.title || 'Loading Session...'}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Setting up connection...
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-400">
                <HiOutlineSignal className="w-4 h-4" />
                <span>Connecting...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {/* Show local video prominently if available */}
          {localStreamRef.current ? (
            <div className="w-full h-full relative bg-gradient-to-br from-slate-800 to-gray-900">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Modern Status Overlay */}
              <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-auto sm:max-w-sm">
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 shadow-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
                        <MdVideocam className="w-5 h-5 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm sm:text-base">Ready to Connect</p>
                      <p className="text-emerald-300 text-xs sm:text-sm truncate">
                        Waiting for participants...
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connection Status Card */}
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 shadow-2xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <p className="text-white font-medium text-sm">
                          Camera & Audio Ready
                        </p>
                      </div>
                      <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                        You can see and hear yourself. Others will join soon.
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Test your setup before others arrive
                      </p>
                    </div>
                    <div className="ml-3">
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <MdSignalWifi4Bar className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Modern loading screen
            <div className="text-center max-w-md mx-auto px-4">
              <div className="relative mb-8">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto">
                  <div className="w-full h-full border-4 border-slate-600 border-t-emerald-400 rounded-full animate-spin"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <MdVideocam className="w-8 h-8 text-emerald-400" />
                </div>
              </div>
              
              <h2 className="text-white text-xl sm:text-2xl font-bold mb-2">
                Connecting to Session
              </h2>
              <p className="text-gray-400 text-sm sm:text-base mb-6">
                Setting up your video and audio connection...
              </p>
              
              {/* Connection Steps */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-300 text-sm">Authentication verified</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-6 h-6 border-2 border-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-gray-300 text-sm">Connecting to media server...</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-6 h-6 border-2 border-gray-500 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-500 text-sm">Requesting camera & microphone</span>
                </div>
              </div>
              
              {/* Debug Info Card */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 text-left">
                <div className="flex items-center space-x-2 mb-2">
                  <HiOutlineExclamationTriangle className="w-4 h-4 text-amber-400" />
                  <p className="text-amber-400 text-xs font-medium">Debug Information</p>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="text-gray-300">
                    <span className="text-gray-500">MediaSoup:</span> {mediaSoupSocketRef.current?.connected ? '🟢 Connected' : '🔴 Disconnected'}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-500">User:</span> {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-500">Room:</span> {roomId}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-500">Session:</span> {session ? '✅ Loaded' : '⏳ Loading...'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modern Control Bar */}
        {localStreamRef.current && (
          <div className="bg-slate-800/95 backdrop-blur-sm border-t border-slate-700/50 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex justify-center items-center space-x-3 sm:space-x-4">
              <button
                onClick={toggleVideo}
                className={`relative p-3 sm:p-4 rounded-full transition-all duration-200 transform hover:scale-105 ${
                  isVideoEnabled 
                    ? 'bg-slate-700 hover:bg-slate-600 text-white shadow-lg' 
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                }`}
                title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {isVideoEnabled ? (
                  <MdVideocam className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <MdVideocamOff className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
                {!isVideoEnabled && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                )}
              </button>

              <button
                onClick={toggleAudio}
                className={`relative p-3 sm:p-4 rounded-full transition-all duration-200 transform hover:scale-105 ${
                  isAudioEnabled 
                    ? 'bg-slate-700 hover:bg-slate-600 text-white shadow-lg' 
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                }`}
                title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
              >
                {isAudioEnabled ? (
                  <MdMic className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <MdMicOff className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
                {!isAudioEnabled && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {/* Error Icon */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <HiOutlineExclamationTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-red-400 text-xl sm:text-2xl font-bold mb-2">Connection Error</h2>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{error}</p>
            </div>
            
            {error.includes('camera') || error.includes('microphone') ? (
              <div className="space-y-4">
                {/* Permission Help */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                  <div className="flex items-start space-x-3">
                    <MdVideocamOff className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-amber-400 font-medium text-sm mb-1">Media Access Required</h3>
                      <p className="text-amber-200 text-xs leading-relaxed">
                        Please allow camera and microphone permissions in your browser settings, then try again.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setError('');
                      setLoading(true);
                      initializeSession();
                    }}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                  >
                    <MdRefresh className="w-5 h-5" />
                    <span>Try Again</span>
                  </button>
                  <button
                    onClick={() => navigate('/sessions')}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <MdArrowBack className="w-5 h-5" />
                    <span>Go Back</span>
                  </button>
                </div>
                
                {/* Debug info */}
                <details className="mt-4">
                  <summary className="text-gray-400 text-xs cursor-pointer hover:text-gray-300 transition-colors">
                    Show debug information
                  </summary>
                  <div className="mt-2 p-3 bg-slate-900/50 border border-slate-700/30 rounded-xl text-xs">
                    <div className="space-y-1">
                      <p className="text-gray-300">
                        <span className="text-gray-500">MediaSoup:</span> {mediaSoupSocketRef.current?.connected ? '🟢 Connected' : '🔴 Disconnected'}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-gray-500">User:</span> {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-gray-500">Room:</span> {roomId}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-gray-500">Session:</span> {session?.title || 'Not loaded'}
                      </p>
                    </div>
                  </div>
                </details>
              </div>
            ) : (
              <button
                onClick={() => navigate('/sessions')}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
              >
                <MdArrowBack className="w-5 h-5" />
                <span>Back to Sessions</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex flex-col overflow-hidden">
      {/* Modern Header */}
      <div className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <button
              onClick={() => navigate('/sessions')}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors md:hidden"
            >
              <MdArrowBack className="w-5 h-5 text-gray-300" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-white text-sm sm:text-lg font-semibold truncate">
                {session?.title}
              </h1>
              <div className="flex items-center space-x-3 mt-1">
                <div className="flex items-center space-x-2">
                  <HiOutlineUserGroup className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-xs sm:text-sm">
                    {participants.length} participant{participants.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-emerald-400' : 
                    connectionStatus === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-red-400'
                  }`}></div>
                  <span className="text-gray-400 text-xs capitalize">
                    {connectionStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* More Options (Mobile) */}
            <div className="sm:hidden">
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                title="Toggle chat"
              >
                <MdMoreVert className="w-5 h-5 text-gray-300" />
              </button>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center space-x-2">
              {/* Debug Button */}
              {session && (
                <button
                  onClick={() => {
                    console.log('Debug: Reconnect to MediaSoup');
                    // Could add reconnection logic here if needed
                  }}
                  className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs rounded-lg transition-colors border border-blue-500/30"
                >
                  Debug MediaSoup
                </button>
              )}
              
              <button
                onClick={endSession}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] flex items-center space-x-2"
              >
                <MdCallEnd className="w-4 h-4" />
                <span>End Call</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Container */}
        <div className="flex-1 relative bg-slate-900">
          {/* Remote Video (Main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Remote Videos Container for Multiple Participants */}
          <div id="remote-videos-container" className="absolute inset-0">
            {/* Dynamic remote videos will be added here */}
          </div>
          
          {/* No Remote Participant Placeholder */}
          {participants.length === 0 && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 flex items-center justify-center">
              <div className="text-center max-w-sm mx-auto px-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-slate-700 to-slate-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <MdPerson className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300" />
                </div>
                <h3 className="text-white text-lg sm:text-xl font-bold mb-2">
                  Waiting for others to join
                </h3>
                <p className="text-gray-400 text-sm sm:text-base mb-4 leading-relaxed">
                  You're ready to start! Others will appear here when they join the session.
                </p>
                
                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4 mb-4">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <p className="text-emerald-300 text-sm font-medium">
                      Your camera and microphone are ready
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-500 text-xs">
                  Share your session link or wait for participants to connect
                </p>
              </div>
            </div>
          )}
          
          {/* Local Video Preview */}
          <div className={`absolute transition-all duration-300 ${
            participants.length === 0 
              ? 'bottom-4 right-4 w-48 h-32 sm:bottom-6 sm:right-6 sm:w-64 sm:h-40' // Larger when alone
              : 'top-4 right-4 w-32 h-24 sm:w-40 sm:h-28'   // Smaller when others present
          } bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-600/50 shadow-2xl backdrop-blur-sm`}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Local Video Overlay */}
            <div className="absolute inset-0">
              {/* User Label */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-slate-900/90 backdrop-blur-sm rounded-lg px-2 py-1">
                  <p className="text-white text-xs font-medium truncate">
                    You {!isVideoEnabled && '(Camera Off)'}
                  </p>
                </div>
              </div>
              
              {/* Video Off Overlay */}
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                  <div className="text-center">
                    <MdVideocamOff className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 mx-auto mb-1" />
                    <span className="text-slate-400 text-xs">Camera Off</span>
                  </div>
                </div>
              )}
              
              {/* Audio Muted Indicator */}
              {!isAudioEnabled && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <MdMicOff className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modern Chat Sidebar */}
        {isChatOpen && (
          <div className="w-full sm:w-80 bg-slate-800/95 backdrop-blur-sm border-l border-slate-700/50 flex flex-col absolute sm:relative inset-y-0 right-0 z-20 max-h-screen">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HiOutlineChatBubbleBottomCenter className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-white font-semibold">Chat</h3>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors sm:hidden"
                >
                  <MdClose className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* Messages Area */}
            <div 
              ref={messagesContainerRef} 
              className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
              style={{ maxHeight: 'calc(100vh - 160px)' }}
            >
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <HiOutlineChatBubbleBottomCenter className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No messages yet</p>
                  <p className="text-gray-500 text-xs mt-1">Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="group">
                    {msg.isOwn ? (
                      // Your own messages - aligned to the right
                      <div className="flex items-end justify-end space-x-2">
                        <div className="max-w-xs lg:max-w-md">
                          <div className="flex items-center space-x-2 mb-1 justify-end">
                            <span className="text-gray-500 text-xs">
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-gray-300 text-sm font-medium">
                              You
                            </span>
                          </div>
                          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl rounded-br-md px-3 py-2 shadow-lg">
                            <p className="text-white text-sm leading-relaxed break-words">
                              {msg.message}
                            </p>
                          </div>
                        </div>
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-semibold">
                            {msg.sender.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Others' messages - aligned to the left
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-semibold">
                            {msg.sender.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 max-w-xs lg:max-w-md">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-gray-300 text-sm font-medium truncate">
                              {msg.sender.name}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="bg-slate-700/50 rounded-2xl rounded-tl-md px-3 py-2">
                            <p className="text-white text-sm leading-relaxed break-words">
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {/* Message Input */}
            <div className="p-4 border-t border-slate-700/50">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 bg-slate-700/50 text-white placeholder-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-slate-600/50 resize-none"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-2xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                >
                  <MdSend className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modern Control Bar */}
      <div className="bg-slate-800/95 backdrop-blur-sm border-t border-slate-700/50 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Main Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Video Toggle */}
            <button
              onClick={toggleVideo}
              className={`relative p-3 sm:p-4 rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                isVideoEnabled 
                  ? 'bg-slate-700 hover:bg-slate-600 text-white shadow-lg' 
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
              }`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? (
                <MdVideocam className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <MdVideocamOff className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
              {!isVideoEnabled && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
              )}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className={`relative p-3 sm:p-4 rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                isAudioEnabled 
                  ? 'bg-slate-700 hover:bg-slate-600 text-white shadow-lg' 
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
              }`}
              title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isAudioEnabled ? (
                <MdMic className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <MdMicOff className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
              {!isAudioEnabled && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
              )}
            </button>

            {/* Screen Share - Hidden on mobile, shown on larger screens */}
            <button
              onClick={toggleScreenShare}
              className={`hidden sm:flex relative p-3 sm:p-4 rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                isScreenSharing 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25' 
                  : 'bg-slate-700 hover:bg-slate-600 text-white shadow-lg'
              }`}
              title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
            >
              {isScreenSharing ? (
                <MdStopScreenShare className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <MdScreenShare className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Chat Toggle */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`relative p-3 sm:p-4 rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                isChatOpen 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25' 
                  : 'bg-slate-700 hover:bg-slate-600 text-white shadow-lg'
              }`}
              title={isChatOpen ? 'Close chat' : 'Open chat'}
            >
              <MdChat className="w-5 h-5 sm:w-6 sm:h-6" />
              {messages.length > 0 && !isChatOpen && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 text-slate-900 text-xs rounded-full flex items-center justify-center font-bold">
                  {messages.length > 9 ? '9+' : messages.length}
                </div>
              )}
            </button>

            {/* End Call */}
            <button
              onClick={endSession}
              className="p-3 sm:p-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg shadow-red-500/25"
              title="End session"
            >
              <MdCallEnd className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Screen Share - Only shown on mobile */}
        <div className="sm:hidden mt-3 pt-3 border-t border-slate-700/50">
          <button
            onClick={toggleScreenShare}
            className={`w-full p-3 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 ${
              isScreenSharing 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25' 
                : 'bg-slate-700 hover:bg-slate-600 text-white shadow-lg'
            }`}
          >
            {isScreenSharing ? (
              <>
                <MdStopScreenShare className="w-5 h-5" />
                <span className="font-medium">Stop Screen Share</span>
              </>
            ) : (
              <>
                <MdScreenShare className="w-5 h-5" />
                <span className="font-medium">Share Screen</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallPage;