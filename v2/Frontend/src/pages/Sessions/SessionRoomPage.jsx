import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  VideoCameraIcon, 
  VideoCameraSlashIcon,
  MicrophoneIcon,
  NoSymbolIcon,
  ChatBubbleLeftRightIcon,
  PhoneXMarkIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../../stores/authStore';
import useSocketStore from '../../stores/socketStore';
import useSessionStore from '../../stores/sessionStore';
import toast from 'react-hot-toast';

export default function SessionRoomPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const { socket, joinSession, leaveSession, sendMessage, messages } = useSocketStore();
  const { currentSession, joinSession: joinSessionAPI } = useSessionStore();

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);

  useEffect(() => {
    // Join the session when component mounts
    const initializeSession = async () => {
      try {
        await joinSessionAPI(sessionId, token);
        joinSession(sessionId);
        
        // Initialize media devices
        await initializeMedia();
      } catch (error) {
        console.error('Failed to join session:', error);
        toast.error('Failed to join session');
        navigate('/sessions');
      }
    };

    initializeSession();

    return () => {
      // Cleanup when component unmounts
      leaveSession(sessionId);
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, [sessionId, token, joinSessionAPI, joinSession, leaveSession, navigate]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      
      // Set up WebRTC peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };
      
      setPeerConnection(pc);
    } catch (error) {
      console.error('Failed to access media devices:', error);
      toast.error('Failed to access camera/microphone');
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const endSession = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }
    leaveSession(sessionId);
    navigate('/sessions');
    toast.success('Session ended');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(sessionId, message);
      setMessage('');
    }
  };

  const sessionMessages = messages[sessionId] || [];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-white text-xl font-semibold">
              Therapy Session
            </h1>
            {currentSession && (
              <span className="text-gray-300 text-sm">
                with {user?.role === 'PATIENT' 
                  ? `Dr. ${currentSession.therapist?.firstName} ${currentSession.therapist?.lastName}`
                  : `${currentSession.patient?.firstName} ${currentSession.patient?.lastName}`
                }
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-400 text-sm">● Live</span>
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isChatOpen ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className={`flex-1 relative ${isChatOpen ? 'lg:mr-80' : ''}`}>
          <div className="h-full flex items-center justify-center p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl">
              {/* Local Video */}
              <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                <video
                  autoPlay
                  muted
                  playsInline
                  ref={(video) => {
                    if (video && localStream) {
                      video.srcObject = localStream;
                    }
                  }}
                  className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
                />
                {!isVideoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center">
                      <VideoCameraSlashIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400">Camera off</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  You
                </div>
              </div>

              {/* Remote Video */}
              <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                {remoteStream ? (
                  <video
                    autoPlay
                    playsInline
                    ref={(video) => {
                      if (video && remoteStream) {
                        video.srcObject = remoteStream;
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center">
                      <div className="h-16 w-16 rounded-full bg-gray-600 flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-xl font-semibold">
                          {currentSession && (
                            user?.role === 'PATIENT' 
                              ? currentSession.therapist?.firstName?.[0]
                              : currentSession.patient?.firstName?.[0]
                          )}
                        </span>
                      </div>
                      <p className="text-gray-400">Waiting for participant...</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {currentSession && (
                    user?.role === 'PATIENT' 
                      ? `Dr. ${currentSession.therapist?.firstName}`
                      : currentSession.patient?.firstName
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-4 bg-gray-800 rounded-full px-6 py-3">
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full transition-colors ${
                  isAudioEnabled 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isAudioEnabled ? (
                  <MicrophoneIcon className="h-5 w-5" />
                ) : (
                  <NoSymbolIcon className="h-5 w-5" />
                )}
              </button>
              
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-colors ${
                  isVideoEnabled 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isVideoEnabled ? (
                  <VideoCameraIcon className="h-5 w-5" />
                ) : (
                  <VideoCameraSlashIcon className="h-5 w-5" />
                )}
              </button>

              <button
                onClick={endSession}
                className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <PhoneXMarkIcon className="h-5 w-5" />
              </button>

              <button className="p-3 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors">
                <CogIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        {isChatOpen && (
          <div className="w-80 bg-white flex flex-col border-l border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Session Chat</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {sessionMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.senderId === user?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.senderId === user?.id ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
