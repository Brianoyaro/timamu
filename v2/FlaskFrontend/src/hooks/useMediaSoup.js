import { useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';

export const useMediaSoup = () => {
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
  const localStreamRef = useRef(null);
  const screenShareRef = useRef(null);
  
  // State
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [participants, setParticipants] = useState([]);

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
    setParticipants([]);
  }, []);

  return {
    // Refs
    mediaSoupSocketRef,
    deviceRef,
    producerTransportRef,
    consumerTransportRef,
    producersRef,
    consumersRef,
    dataProducerRef,
    dataConsumersRef,
    localStreamRef,
    screenShareRef,
    
    // State
    connectionStatus,
    participants,
    setParticipants,
    
    // Methods
    connectToMediaSoup,
    getUserMedia,
    cleanup
  };
};