import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { VideoControls } from './VideoControls'
import { WaitingRoom } from './WaitingRoom'
import { DeviceCheckModal } from './DeviceCheckModal'
import { ConnectionQualityIndicator } from './ConnectionQualityIndicator'
import { createWebRTCService } from '../../services/webrtcService'
import { useAuthStore } from '../../store/authStore'
import { analyticsService } from '../../services/analyticsService'

export function VideoSessionPage() {
  const { sessionId, tenantId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, hasRole } = useAuthStore()
  
  const [sessionState, setSessionState] = useState('loading') // loading, device-check, waiting, connected, ended
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [connectionQuality, setConnectionQuality] = useState('good')
  const [sessionData, setSessionData] = useState(null)

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const webrtcServiceRef = useRef(null)

  useEffect(() => {
    // Initialize session
    loadSession()
    analyticsService.trackSessionJoined(sessionId, user?.roles?.[0])

    return () => {
      // Cleanup on unmount
      if (webrtcServiceRef.current) {
        webrtcServiceRef.current.destroy()
      }
    }
  }, [sessionId])

  const loadSession = async () => {
    try {
      // Mock session data - replace with real API call
      const session = {
        id: sessionId,
        therapist: {
          id: 'therapist-1',
          name: 'Dr. Sarah Johnson',
          avatar: 'https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg?auto=compress&cs=tinysrgb&w=150'
        },
        patient: {
          id: 'patient-1',
          name: 'John Doe',
          avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150'
        },
        status: 'waiting',
        startTime: new Date(),
        isRecording: false
      }

      setSessionData(session)
      setSessionState('device-check')
    } catch (error) {
      console.error('Failed to load session:', error)
      navigate(`/t/${tenantId}`)
    }
  }

  const initializeWebRTC = async () => {
    try {
      webrtcServiceRef.current = createWebRTCService(sessionId)
      const service = webrtcServiceRef.current

      // Set up event handlers
      service.on('localStream', (stream) => {
        setLocalStream(stream)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      })

      service.on('remoteStream', (stream) => {
        setRemoteStream(stream)
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream
        }
        setSessionState('connected')
      })

      service.on('connected', () => {
        setSessionState('connected')
      })

      service.on('disconnected', () => {
        handleEndSession()
      })

      service.on('error', (error) => {
        console.error('WebRTC error:', error)
      })

      // Initialize media and create peer
      await service.initializeMedia()
      await service.createPeer(hasRole('therapist'))

      if (hasRole('therapist')) {
        setSessionState('waiting')
      } else {
        setSessionState('waiting')
      }
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error)
    }
  }

  const handleDeviceCheckComplete = () => {
    initializeWebRTC()
  }

  const handleEndSession = async () => {
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.destroy()
    }
    
    setSessionState('ended')
    
    // Navigate back after delay
    setTimeout(() => {
      navigate(`/t/${tenantId}`)
    }, 2000)
  }

  const toggleAudio = () => {
    if (webrtcServiceRef.current) {
      const enabled = webrtcServiceRef.current.toggleAudio()
      setIsAudioEnabled(enabled)
    }
  }

  const toggleVideo = () => {
    if (webrtcServiceRef.current) {
      const enabled = webrtcServiceRef.current.toggleVideo()
      setIsVideoEnabled(enabled)
    }
  }

  const shareScreen = async () => {
    if (webrtcServiceRef.current && !isScreenSharing) {
      try {
        await webrtcServiceRef.current.shareScreen()
        setIsScreenSharing(true)
      } catch (error) {
        console.error('Screen share failed:', error)
      }
    } else if (webrtcServiceRef.current && isScreenSharing) {
      await webrtcServiceRef.current.stopScreenShare()
      setIsScreenSharing(false)
    }
  }

  const admitPatient = async () => {
    // Mock API call for therapist to admit patient
    setSessionState('connected')
  }

  if (sessionState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading session...</p>
        </div>
      </div>
    )
  }

  if (sessionState === 'device-check') {
    return (
      <DeviceCheckModal
        onComplete={handleDeviceCheckComplete}
        onCancel={() => navigate(`/t/${tenantId}`)}
      />
    )
  }

  if (sessionState === 'waiting') {
    return (
      <WaitingRoom
        session={sessionData}
        userRole={hasRole('therapist') ? 'therapist' : 'patient'}
        onAdmitPatient={admitPatient}
        onCancel={() => navigate(`/t/${tenantId}`)}
      />
    )
  }

  if (sessionState === 'ended') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-white"
        >
          <h2 className="text-2xl font-semibold mb-4">Session Ended</h2>
          <p className="text-gray-300">Redirecting you back...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Session header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-white font-medium">
            Session with {hasRole('therapist') ? sessionData?.patient?.name : sessionData?.therapist?.name}
          </h1>
          <ConnectionQualityIndicator quality={connectionQuality} />
        </div>
        
        {sessionData?.isRecording && (
          <div className="flex items-center space-x-2 text-red-400">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Recording</span>
          </div>
        )}
      </div>

      {/* Video area */}
      <div className="flex-1 relative">
        {/* Remote video (main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Local video (picture-in-picture) */}
        <div className="absolute top-4 right-4 w-32 h-24 md:w-48 md:h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <span className="text-white text-xs">Camera off</span>
            </div>
          )}
        </div>

        {/* No remote stream placeholder */}
        {!remoteStream && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">
                  {hasRole('therapist') 
                    ? sessionData?.patient?.name?.charAt(0) 
                    : sessionData?.therapist?.name?.charAt(0)
                  }
                </span>
              </div>
              <p className="text-lg">
                Waiting for {hasRole('therapist') ? 'patient' : 'therapist'} to join...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <VideoControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onShareScreen={shareScreen}
        onEndCall={handleEndSession}
      />
    </div>
  )
}
