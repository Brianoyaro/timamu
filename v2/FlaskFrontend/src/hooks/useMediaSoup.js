import { useState, useRef, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import { useAuthStore } from '../stores/authStore';

export const useMediaSoup = (roomId, session, setMessages, setParticipants) => {
  // Refs for MediaSoup
  const mediaSoupSocketRef = useRef(null);
  const deviceRef = useRef(null);
  const producerTransportRef = useRef(null);
  const consumerTransportRef = useRef(null);
  const producersRef = useRef(new Map());
  const consumersRef = useRef(new Map());
  const dataProducerRef = useRef(null);
  const dataConsumersRef = useRef(new Map());
  
  // Media refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenShareRef = useRef(null);
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [roomParticipants, setRoomParticipants] = useState([]);
  
  // Auth store
  const user = useAuthStore((state) => state.user);

  const  connectToMediaSoup = useCallback(async (roomId) => {
    try {
      const mediaSoupUrl = import.meta.env.VITE_MEDIASOUP_URL || 'http://localhost:3001';
      console.log('Connecting to MediaSoup server at:', mediaSoupUrl);
      
      const mediaSoupSocket = io(mediaSoupUrl, {
        transports: ['websocket', 'polling']
      });
      
      mediaSoupSocketRef.current = mediaSoupSocket;
      
      // Wait for connection
      await new Promise((resolve, reject) => {
        mediaSoupSocket.on('connect', () => {
          console.log('Connected to MediaSoup server');
          setConnectionStatus('connected');
          resolve();
        });
        
        mediaSoupSocket.on('connect_error', (error) => {
          console.error('MediaSoup connection error:', error);
          reject(new Error(`Failed to connect to video server: ${error.message}`));
        });
        
        setTimeout(() => {
          reject(new Error('Connection timeout - please check your internet connection'));
        }, 10000);
      });
      
      return mediaSoupSocket;
    } catch (error) {
      setConnectionStatus('disconnected');
      throw error;
    }
  }, []);

  const getUserMedia = useCallback(async () => {
    try {
      console.log('=== REQUESTING MEDIA PERMISSIONS ===');
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 }, 
          audio: true 
        });
      } catch (err) {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
      }
      
      console.log('Media stream obtained');
      localStreamRef.current = stream;
      return stream;
      
    } catch (err) {
      console.error('=== MEDIA ACCESS ERROR ===', err);
      
      let errorMessage = 'Could not access camera and microphone. ';
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera and microphone permissions and refresh the page.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera or microphone found. Please connect your devices and try again.';
      } else {
        errorMessage += 'Please check your device settings and try again.';
      }
      
      throw new Error(errorMessage);
    }
  }, []);

  const loadDevice = useCallback(async (routerRtpCapabilities) => {
    try {
      console.log('=== LOADING MEDIASOUP DEVICE ===');
      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities });
      deviceRef.current = device;
      console.log('MediaSoup device loaded successfully');
      return device;
    } catch (error) {
      console.error('Error loading MediaSoup device:', error);
      throw error;
    }
  }, []);

  const createSendTransport = useCallback(async () => {
    try {
      console.log('=== CREATING SEND TRANSPORT ===');
      const mediaSoupSocket = mediaSoupSocketRef.current;
      
      // Request server to create a transport
      const transportData = await new Promise((resolve, reject) => {
        mediaSoupSocket.emit('create-transport', { direction: 'send' }, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
        
        setTimeout(() => reject(new Error('Transport creation timeout')), 10000);
      });
      
      // Create the client-side transport
      const {
        transportId,
        iceParameters,
        iceCandidates,
        dtlsParameters,
        sctpParameters
      } = transportData;
      
      const transport = deviceRef.current.createSendTransport({
        id: transportId,
        iceParameters,
        iceCandidates,
        dtlsParameters,
        sctpParameters
      });
      
      // Set up transport event handlers
      transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        console.log('Send transport connect event');
        try {
          await new Promise((resolve, reject) => {
            mediaSoupSocket.emit('connect-transport', {
              transportId,
              dtlsParameters
            }, (response) => {
              if (response?.error) reject(new Error(response.error));
              else resolve();
            });
            
            setTimeout(() => reject(new Error('Transport connection timeout')), 10000);
          });
          
          callback();
        } catch (error) {
          console.error('Error connecting send transport:', error);
          errback(error);
        }
      });
      
      transport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
        console.log(`Produce event, kind: ${kind}`);
        try {
          const { producerId } = await new Promise((resolve, reject) => {
            mediaSoupSocket.emit('produce', {
              transportId,
              kind,
              rtpParameters,
              appData
            }, (response) => {
              if (response?.error) reject(new Error(response.error));
              else resolve(response);
            });
            
            setTimeout(() => reject(new Error('Produce timeout')), 10000);
          });
          
          callback({ id: producerId });
        } catch (error) {
          console.error('Error producing:', error);
          errback(error);
        }
      });
      
      // Store the transport
      producerTransportRef.current = transport;
      console.log('Send transport created');
      return transport;
    } catch (error) {
      console.error('Error creating send transport:', error);
      throw error;
    }
  }, []);

  const createRecvTransport = useCallback(async () => {
    try {
      console.log('=== CREATING RECEIVE TRANSPORT ===');
      const mediaSoupSocket = mediaSoupSocketRef.current;
      
      // Request server to create a transport
      const transportData = await new Promise((resolve, reject) => {
        mediaSoupSocket.emit('create-transport', { direction: 'recv' }, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
        
        setTimeout(() => reject(new Error('Transport creation timeout')), 10000);
      });
      
      // Create the client-side transport
      const {
        transportId,
        iceParameters,
        iceCandidates,
        dtlsParameters,
        sctpParameters
      } = transportData;
      
      const transport = deviceRef.current.createRecvTransport({
        id: transportId,
        iceParameters,
        iceCandidates,
        dtlsParameters,
        sctpParameters
      });
      
      // Set up transport connect handler
      transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        console.log('Receive transport connect event');
        try {
          await new Promise((resolve, reject) => {
            mediaSoupSocket.emit('connect-transport', {
              transportId,
              dtlsParameters
            }, (response) => {
              if (response?.error) reject(new Error(response.error));
              else resolve();
            });
            
            setTimeout(() => reject(new Error('Transport connection timeout')), 10000);
          });
          
          callback();
        } catch (error) {
          console.error('Error connecting receive transport:', error);
          errback(error);
        }
      });
      
      // Store the transport
      consumerTransportRef.current = transport;
      console.log('Receive transport created');
      return transport;
    } catch (error) {
      console.error('Error creating receive transport:', error);
      throw error;
    }
  }, []);

  const produceLocalMedia = useCallback(async () => {
    try {
      console.log('=== PRODUCING LOCAL MEDIA ===');
      if (!producerTransportRef.current || !localStreamRef.current) {
        throw new Error('Transport or media stream not ready');
      }
      
      // Produce video
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const videoProducer = await producerTransportRef.current.produce({
          track: videoTrack,
          encodings: [
            { maxBitrate: 100000 },
            { maxBitrate: 300000 },
            { maxBitrate: 900000 }
          ],
          codecOptions: {
            videoGoogleStartBitrate: 1000
          }
        });
        
        producersRef.current.set('video', videoProducer);
        console.log('Video producer created:', videoProducer.id);
      }
      
      // Produce audio
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const audioProducer = await producerTransportRef.current.produce({
          track: audioTrack,
          codecOptions: {
            opusStereo: true,
            opusDtx: true
          }
        });
        
        producersRef.current.set('audio', audioProducer);
        console.log('Audio producer created:', audioProducer.id);
      }
      
    } catch (error) {
      console.error('Error producing local media:', error);
      throw error;
    }
  }, []);

  const createDataProducer = useCallback(async () => {
    try {
      if (!producerTransportRef.current) {
        console.warn('Cannot create data producer - transport not ready');
        return;
      }
      
      // Create a data producer for chat
      const dataProducer = await producerTransportRef.current.produceData({
        ordered: true,
        maxRetransmits: 1,
        label: 'chat',
        protocol: 'json'
      });
      
      dataProducerRef.current = dataProducer;
      console.log('Data producer created:', dataProducer.id);
      
      // Handle data producer events
      dataProducer.on('transportclose', () => {
        console.log('Data producer transport closed');
      });
      
      dataProducer.on('open', () => {
        console.log('Data producer opened');
      });
      
      dataProducer.on('error', (error) => {
        console.error('Data producer error:', error);
      });
      
      dataProducer.on('close', () => {
        console.log('Data producer closed');
      });
      
      return dataProducer;
    } catch (error) {
      console.error('Error creating data producer:', error);
    }
  }, []);

  const consumeRemoteProducer = useCallback(async (producerId, kind, socketId) => {
    try {
      console.log(`=== CONSUMING REMOTE PRODUCER: ${kind} from ${socketId} ===`);
      
      // Skip if this is our own socket ID
      if (mediaSoupSocketRef.current && mediaSoupSocketRef.current.id === socketId) {
        console.log(`Skipping our own producer: ${producerId}`);
        return;
      }
      
      if (!consumerTransportRef.current || !deviceRef.current) {
        console.error('Cannot consume - transport or device not ready');
        return;
      }
      
      // Make sure we can consume this producer
      if (!deviceRef.current.canConsume({
        producerId,
        rtpCapabilities: deviceRef.current.rtpCapabilities
      })) {
        console.error('Cannot consume producer', producerId);
        return;
      }
      
      // Request to consume the producer
      const mediaSoupSocket = mediaSoupSocketRef.current;
      const { rtpParameters } = await new Promise((resolve, reject) => {
        mediaSoupSocket.emit('consume', {
          transportId: consumerTransportRef.current.id,
          producerId,
          rtpCapabilities: deviceRef.current.rtpCapabilities
        }, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
        
        setTimeout(() => reject(new Error('Consume timeout')), 10000);
      });
      
      // Create the consumer
      const consumer = await consumerTransportRef.current.consume({
        id: `consumer-${producerId}`,
        producerId,
        kind,
        rtpParameters
      });
      
      consumersRef.current.set(consumer.id, consumer);
      
      // Resume the consumer
      await new Promise((resolve, reject) => {
        mediaSoupSocket.emit('resume-consumer', {
          consumerId: consumer.id
        }, (response) => {
          if (response?.error) reject(new Error(response.error));
          else resolve();
        });
      });
      
      console.log(`Consumer created for ${kind} producer ${producerId}`);
      
      // Get participant info
      let participantInfo = null;
      try {
        participantInfo = await new Promise((resolve) => {
          mediaSoupSocket.emit('get-participant-info', { socketId }, (response) => {
            resolve(response.participant || null);
          });
          
          // Set a timeout in case the server doesn't respond
          setTimeout(() => resolve(null), 3000);
        });
      } catch (error) {
        console.error('Error getting participant info:', error);
      }
      
      // Update participants list with new stream
      if (kind === 'video' || kind === 'audio') {
        setRoomParticipants((prevParticipants) => {
          const participantIndex = prevParticipants.findIndex(p => p.socketId === socketId);
          
          if (participantIndex === -1) {
            // Add new participant
            const newParticipant = {
              socketId,
              userId: participantInfo?.userId,
              name: participantInfo?.displayName || 'Unknown Participant',
              stream: new MediaStream(),
              videoEnabled: kind === 'video',
              audioEnabled: kind === 'audio'
            };
            
            // Add track to stream
            newParticipant.stream.addTrack(consumer.track);
            
            return [...prevParticipants, newParticipant];
          } else {
            // Update existing participant
            const updatedParticipants = [...prevParticipants];
            const participant = {...updatedParticipants[participantIndex]};
            
            // Add track to existing stream
            participant.stream.addTrack(consumer.track);
            
            if (kind === 'video') participant.videoEnabled = true;
            if (kind === 'audio') participant.audioEnabled = true;
            
            updatedParticipants[participantIndex] = participant;
            return updatedParticipants;
          }
        });
      }
      
      return consumer;
    } catch (error) {
      console.error('Error consuming producer:', error);
    }
  }, []);

  const joinRoom = useCallback(async () => {
    try {
      console.log('=== JOINING ROOM ===');
      const mediaSoupSocket = mediaSoupSocketRef.current;
      if (!mediaSoupSocket || !roomId || !user?.id) {
        throw new Error('Cannot join room - missing socket, roomId, or userId');
      }
      
      // Join the room
      const { rtpCapabilities } = await new Promise((resolve, reject) => {
        mediaSoupSocket.emit('join-room', {
          roomId,
          userId: user.id,
          displayName: user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}`
            : user.name || user.email?.split('@')[0] || 'Anonymous User'
        }, (response) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
        
        setTimeout(() => reject(new Error('Join room timeout')), 10000);
      });
      
      console.log('Joined room successfully, loading device with RTP capabilities');
      
      // Load device with router RTP capabilities
      await loadDevice(rtpCapabilities);
      
      // Create send and receive transports
      await createSendTransport();
      await createRecvTransport();
      
      // Produce local media
      await produceLocalMedia();
      
      // Create data producer for chat
      await createDataProducer();
      
      // Get existing producers in the room
      await getProducers();
      
      console.log('=== ROOM SETUP COMPLETE ===');
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  }, [roomId, user, loadDevice, createSendTransport, createRecvTransport, produceLocalMedia, createDataProducer]);

  const getProducers = useCallback(async () => {
    try {
      console.log('=== GETTING EXISTING PRODUCERS ===');
      const mediaSoupSocket = mediaSoupSocketRef.current;
      
      await new Promise((resolve) => {
        mediaSoupSocket.emit('get-producers', {}, (response) => {
          if (response?.producers?.length) {
            console.log(`Found ${response.producers.length} existing producers`);
            
            // Get information about socket IDs and user IDs
            mediaSoupSocket.emit('get-participants', {}, (participantsResponse) => {
              const participants = participantsResponse?.participants || [];
              
              // Consume each producer from other participants (not our own)
              response.producers.forEach(({ producerId, kind, socketId, userId }) => {
                // Skip consuming our own producers
                const participantInfo = participants.find(p => p.socketId === socketId);
                if (participantInfo && participantInfo.userId === user?.id) {
                  console.log(`Skipping our own producer: ${producerId}`);
                  return;
                }
                
                consumeRemoteProducer(producerId, kind, socketId);
              });
            });
          } else {
            console.log('No existing producers found');
          }
          resolve();
        });
      });
      
      // Also get data producers for chat
      await new Promise((resolve) => {
        mediaSoupSocket.emit('get-data-producers', {}, (response) => {
          if (response?.dataProducers?.length) {
            console.log(`Found ${response.dataProducers.length} existing data producers`);
            
            // TODO: Consume data producers
          } else {
            console.log('No existing data producers found');
          }
          resolve();
        });
      });
    } catch (error) {
      console.error('Error getting producers:', error);
    }
  }, [consumeRemoteProducer]);

  // Set up socket event listeners
  const setupSocketListeners = useCallback(() => {
    console.log('=== SETTING UP SOCKET LISTENERS ===');
    const mediaSoupSocket = mediaSoupSocketRef.current;
    if (!mediaSoupSocket) return;
    
    // New participant joined
    mediaSoupSocket.on('participant-joined', ({ socketId, userId, displayName }) => {
      console.log('New participant joined:', socketId, userId, displayName);
      
      // Skip if this is our own join event
      if (userId === user?.id) {
        console.log('Ignoring our own join event');
        return;
      }
      
      // Add to participants list
      setRoomParticipants(prevParticipants => {
        if (!prevParticipants.some(p => p.socketId === socketId)) {
          return [
            ...prevParticipants,
            {
              socketId,
              userId,
              name: displayName,
              stream: new MediaStream(),
              videoEnabled: false,
              audioEnabled: false
            }
          ];
        }
        return prevParticipants;
      });
    });
    
    // Participant left
    mediaSoupSocket.on('participant-left', ({ socketId }) => {
      console.log('Participant left:', socketId);
      
      // Remove from participants list
      setRoomParticipants(prevParticipants =>
        prevParticipants.filter(p => p.socketId !== socketId)
      );
    });
    
    // New producer
    mediaSoupSocket.on('new-producer', ({ producerId, socketId, kind }) => {
      console.log(`New ${kind} producer from ${socketId}:`, producerId);
      consumeRemoteProducer(producerId, kind, socketId);
    });
    
    // New data producer
    mediaSoupSocket.on('new-data-producer', ({ dataProducerId, socketId }) => {
      console.log(`New data producer from ${socketId}:`, dataProducerId);
      // TODO: Consume data producer
    });
    
    // Consumer closed
    mediaSoupSocket.on('consumer-closed', ({ consumerId }) => {
      console.log('Consumer closed:', consumerId);
      
      const consumer = consumersRef.current.get(consumerId);
      if (consumer) {
        consumer.close();
        consumersRef.current.delete(consumerId);
      }
    });
    
    // Chat message
    mediaSoupSocket.on('chat-message', (messageData) => {
      console.log('Received chat message:', messageData);
      
      // Check if this is our own message bouncing back in any way
      // There are two ways to identify our own messages:
      // 1. By the sender.id field (user ID)
      // 2. By the fromSocketId field (socket ID)
      const isOwnMessageByUserId = messageData.sender?.id === user?.id;
      const isOwnMessageBySocketId = messageData.fromSocketId === mediaSoupSocket.id;
      
      if (!isOwnMessageByUserId && !isOwnMessageBySocketId) {
        // Only add messages from other participants
        setMessages(prev => [...prev, messageData]);
      } else {
        console.log('Skipping our own message:', messageData);
      }
    });
    
    // Error handling
    mediaSoupSocket.on('error', ({ message }) => {
      console.error('MediaSoup error:', message);
      setError(`MediaSoup error: ${message}`);
    });
  }, [consumeRemoteProducer, setMessages]);

  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      console.log('=== INITIALIZING MEDIASOUP ===');
      
      // Connect to MediaSoup server
      await connectToMediaSoup(roomId);
      
      // Get user media
      await getUserMedia();
      
      // Set up socket listeners
      setupSocketListeners();
      
      // Join the room
      await joinRoom();
      
      setLoading(false);
      console.log('=== MEDIASOUP INITIALIZATION COMPLETE ===');
    } catch (err) {
      console.error('=== MEDIASOUP INITIALIZATION ERROR ===', err);
      setError(err.message);
      setLoading(false);
    }
  }, [roomId, connectToMediaSoup, getUserMedia, setupSocketListeners, joinRoom]);

  // Update participants when roomParticipants changes
  useEffect(() => {
    if (setParticipants) {
      setParticipants(roomParticipants);
    }
  }, [roomParticipants, setParticipants]);

  // Separate effect to connect video when ref becomes available
  const connectVideoRef = useCallback(() => {
    console.log('connectVideoRef called:', {
      hasVideoRef: !!localVideoRef.current,
      hasStream: !!localStreamRef.current,
      streamTracks: localStreamRef.current?.getTracks()?.length || 0
    });
    
    if (localVideoRef.current && localStreamRef.current) {
      console.log('Connecting video stream to video element');
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
      });
      console.log('Video element setup complete');
    } else {
      console.log('Cannot connect video - missing ref or stream');
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        
        // Notify server about video state change
        const videoProducer = producersRef.current.get('video');
        if (videoProducer) {
          if (videoTrack.enabled) {
            videoProducer.resume();
          } else {
            videoProducer.pause();
          }
          
          mediaSoupSocketRef.current.emit('producer-state-changed', {
            producerId: videoProducer.id,
            enabled: videoTrack.enabled
          });
        }
      }
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        
        // Notify server about audio state change
        const audioProducer = producersRef.current.get('audio');
        if (audioProducer) {
          if (audioTrack.enabled) {
            audioProducer.resume();
          } else {
            audioProducer.pause();
          }
          
          mediaSoupSocketRef.current.emit('producer-state-changed', {
            producerId: audioProducer.id,
            enabled: audioTrack.enabled
          });
        }
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = screenStream.getVideoTracks()[0];
        
        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        // Replace video producer track if it exists
        const videoProducer = producersRef.current.get('video');
        if (videoProducer) {
          await videoProducer.replaceTrack({ track: videoTrack });
        } else {
          // Create new producer if none exists
          const screenProducer = await producerTransportRef.current.produce({
            track: videoTrack,
            encodings: [{ maxBitrate: 1000000 }],
            appData: { source: 'screen' }
          });
          
          producersRef.current.set('video', screenProducer);
        }
        
        // Listen for screen share end
        videoTrack.addEventListener('ended', () => {
          setIsScreenSharing(false);
          // Restore camera
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
          
          // Replace producer track back to camera
          const videoProducer = producersRef.current.get('video');
          const cameraTrack = localStreamRef.current.getVideoTracks()[0];
          if (videoProducer && cameraTrack) {
            videoProducer.replaceTrack({ track: cameraTrack });
          }
        });
        
        setIsScreenSharing(true);
        screenShareRef.current = screenStream;
      } else {
        // Stop screen sharing
        if (screenShareRef.current) {
          screenShareRef.current.getTracks().forEach(track => track.stop());
          screenShareRef.current = null;
        }
        
        // Restore camera
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        
        // Replace producer track back to camera
        const videoProducer = producersRef.current.get('video');
        const cameraTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoProducer && cameraTrack) {
          await videoProducer.replaceTrack({ track: cameraTrack });
        }
        
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  }, [isScreenSharing]);

  const sendMessage = useCallback((messageText, session, user) => {
    if (!messageText.trim() || !session || !user) {
      return;
    }
    
    // Create message data
    const messageData = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      room: roomId,
      sessionId: session.id,
      message: messageText.trim(),
      sender: {
        id: user.id,
        name: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}`
          : user.name || user.email?.split('@')[0] || 'Anonymous User',
        role: user.role
      },
      timestamp: new Date().toISOString(),
      isOwn: true
    };

    // First add message to local state - this is the only copy for the sender
    setMessages(prev => [...prev, messageData]);
    
    // For other participants, send without isOwn flag
    const messageDataForOthers = {
      ...messageData,
      isOwn: false // Other participants will receive this as not their own message
    };
    
    // Try to send via data channel first
    const dataProducer = dataProducerRef.current;
    let sentViaDataChannel = false;
    
    if (dataProducer && dataProducer.readyState === 'open') {
      try {
        dataProducer.send(JSON.stringify(messageDataForOthers));
        sentViaDataChannel = true;
      } catch (error) {
        console.error('Error sending message via data channel:', error);
      }
    }
    
    // Fallback to socket.io if data channel fails
    if (!sentViaDataChannel && mediaSoupSocketRef.current) {
      mediaSoupSocketRef.current.emit('chat-message', messageDataForOthers);
    }
    
    console.log('Message sent:', messageData);
  }, [roomId, setMessages]);

  const cleanup = useCallback(() => {
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
    
    setConnectionStatus('disconnected');
  }, []);

  return {
    // Refs
    localVideoRef,
    localStream: localStreamRef.current,
    
    // State
    loading,
    error,
    connectionStatus,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    
    // Methods
    initialize,
    connectVideoRef,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    sendMessage,
    cleanup
  };
};