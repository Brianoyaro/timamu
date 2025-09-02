import SimplePeer from 'simple-peer'
import { sessionService } from './sessionService'

export class WebRTCService {
  constructor(sessionId) {
    this.sessionId = sessionId
    this.peer = null
    this.localStream = null
    this.remoteStream = null
    this.isInitiator = false
    this.signalPollingInterval = null
    this.eventHandlers = {}
  }

  on(event, handler) {
    this.eventHandlers[event] = handler
  }

  emit(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event](data)
    }
  }

  async initializeMedia(constraints = { video: true, audio: true }) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
      this.emit('localStream', this.localStream)
      return this.localStream
    } catch (error) {
      this.emit('error', { type: 'media', error })
      throw error
    }
  }

  async createPeer(isInitiator = false) {
    this.isInitiator = isInitiator
    
    const iceServers = [
      { urls: import.meta.env.VITE_WEBRTC_ICE_SERVERS || 'stun:stun.l.google.com:19302' }
    ]

    this.peer = new SimplePeer({
      initiator: isInitiator,
      trickle: false,
      stream: this.localStream,
      config: { iceServers }
    })

    this.peer.on('signal', async (signal) => {
      try {
        await sessionService.sendSignal(this.sessionId, {
          type: 'webrtc-signal',
          signal,
          from: isInitiator ? 'therapist' : 'patient'
        })
      } catch (error) {
        this.emit('error', { type: 'signaling', error })
      }
    })

    this.peer.on('stream', (stream) => {
      this.remoteStream = stream
      this.emit('remoteStream', stream)
    })

    this.peer.on('connect', () => {
      this.emit('connected')
    })

    this.peer.on('close', () => {
      this.emit('disconnected')
    })

    this.peer.on('error', (error) => {
      this.emit('error', { type: 'peer', error })
    })

    // Start polling for signals
    this.startSignalPolling()
  }

  async startSignalPolling() {
    this.signalPollingInterval = setInterval(async () => {
      try {
        const signals = await sessionService.getSignals(this.sessionId)
        
        signals.forEach(signal => {
          if (signal.type === 'webrtc-signal' && this.peer) {
            const shouldProcess = this.isInitiator ? 
              signal.from === 'patient' : 
              signal.from === 'therapist'
            
            if (shouldProcess) {
              this.peer.signal(signal.signal)
            }
          }
        })
      } catch (error) {
        console.error('Signal polling error:', error)
      }
    }, 1000)
  }

  stopSignalPolling() {
    if (this.signalPollingInterval) {
      clearInterval(this.signalPollingInterval)
      this.signalPollingInterval = null
    }
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        this.emit('audioToggled', audioTrack.enabled)
        return audioTrack.enabled
      }
    }
    return false
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        this.emit('videoToggled', videoTrack.enabled)
        return videoTrack.enabled
      }
    }
    return false
  }

  async shareScreen() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })
      
      if (this.peer && this.localStream) {
        const videoTrack = screenStream.getVideoTracks()[0]
        const sender = this.peer._pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        )
        
        if (sender) {
          await sender.replaceTrack(videoTrack)
        }
        
        videoTrack.addEventListener('ended', () => {
          this.stopScreenShare()
        })
        
        this.emit('screenShareStarted')
      }
      
      return screenStream
    } catch (error) {
      this.emit('error', { type: 'screenShare', error })
      throw error
    }
  }

  async stopScreenShare() {
    if (this.peer && this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      const sender = this.peer._pc.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      )
      
      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack)
      }
      
      this.emit('screenShareEnded')
    }
  }

  async getConnectionStats() {
    if (this.peer && this.peer._pc) {
      const stats = await this.peer._pc.getStats()
      return stats
    }
    return null
  }

  destroy() {
    this.stopSignalPolling()
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
    }
    
    if (this.peer) {
      this.peer.destroy()
    }
    
    this.localStream = null
    this.remoteStream = null
    this.peer = null
    this.eventHandlers = {}
  }
}

export const createWebRTCService = (sessionId) => {
  return new WebRTCService(sessionId)
}
