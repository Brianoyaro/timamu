import { useState, useRef, useCallback } from 'react';
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

  const connectToMediaSoup = useCallback(async (roomId) => {
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

  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      console.log('=== INITIALIZING MEDIASOUP ===');
      
      // Connect to MediaSoup server
      await connectToMediaSoup(roomId);
      
      // Get user media
      const stream = await getUserMedia();
      
      // Store stream for later video element setup
      console.log('Media stream stored, will connect to video element when available');
      
      setLoading(false);
      console.log('=== MEDIASOUP INITIALIZATION COMPLETE ===');
    } catch (err) {
      console.error('=== MEDIASOUP INITIALIZATION ERROR ===', err);
      setError(err.message);
      setLoading(false);
    }
  }, [roomId, connectToMediaSoup, getUserMedia]);

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
      }
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
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
        
        // Listen for screen share end
        videoTrack.addEventListener('ended', () => {
          setIsScreenSharing(false);
          // Restore camera
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
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

    // For now, just add to local messages - socket implementation would go here
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

    setMessages(prev => [...prev, messageData]);
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