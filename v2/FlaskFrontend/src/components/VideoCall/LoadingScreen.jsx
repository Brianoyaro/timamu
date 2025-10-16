import { MdVideocam, MdSignalWifi4Bar } from 'react-icons/md';
import { HiOutlineExclamationTriangle } from 'react-icons/hi';
import ConnectionStatus from './ConnectionStatus';
import VideoControls from './VideoControls';

const LoadingScreen = ({ 
  session,
  user,
  roomId,
  localVideoRef,
  localStreamRef,
  mediaSoupSocketRef,
  isVideoEnabled,
  isAudioEnabled,
  onToggleVideo,
  onToggleAudio,
  onGoBack 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex flex-col">
      {/* Header */}
      <ConnectionStatus 
        session={session}
        connectionStatus="connecting"
        onGoBack={onGoBack}
      />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Show local video prominently if available */}
        {localStreamRef?.current ? (
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
                  <span className="text-gray-500">MediaSoup:</span> {mediaSoupSocketRef?.current?.connected ? '🟢 Connected' : '🔴 Disconnected'}
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
      {localStreamRef?.current && (
        <VideoControls 
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          isScreenSharing={false}
          isChatOpen={false}
          onToggleVideo={onToggleVideo}
          onToggleAudio={onToggleAudio}
          onToggleScreenShare={() => {}}
          onToggleChat={() => {}}
          onEndSession={() => {}}
        />
      )}
    </div>
  );
};

export default LoadingScreen;