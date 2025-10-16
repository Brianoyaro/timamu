import { MdVideocam, MdVideocamOff, MdMic, MdMicOff, MdScreenShare, MdStopScreenShare, MdMessage, MdCall, MdCallEnd } from 'react-icons/md';

const VideoControls = ({
  isVideoEnabled,
  isAudioEnabled,
  isScreenSharing,
  isChatOpen,
  onToggleVideo,
  onToggleAudio,
  onToggleScreenShare,
  onToggleChat,
  onEndSession,
  className = ""
}) => {
  return (
    <div className={`bg-slate-800/95 backdrop-blur-sm border-t border-slate-700/50 px-4 py-3 sm:px-6 sm:py-4 ${className}`}>
      <div className="flex justify-center items-center space-x-3 sm:space-x-4">
        {/* Video Toggle */}
        <button
          onClick={onToggleVideo}
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

        {/* Audio Toggle */}
        <button
          onClick={onToggleAudio}
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

        {/* Screen Share Toggle */}
        <button
          onClick={onToggleScreenShare}
          className={`p-3 sm:p-4 rounded-full transition-all duration-200 transform hover:scale-105 ${
            isScreenSharing
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
              : 'bg-slate-700 hover:bg-slate-600 text-white shadow-lg'
          }`}
          title={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
        >
          {isScreenSharing ? (
            <MdStopScreenShare className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <MdScreenShare className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </button>

        {/* Chat Toggle */}
        <button
          onClick={onToggleChat}
          className={`relative p-3 sm:p-4 rounded-full transition-all duration-200 transform hover:scale-105 ${
            isChatOpen
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
              : 'bg-slate-700 hover:bg-slate-600 text-white shadow-lg'
          }`}
          title={isChatOpen ? 'Close chat' : 'Open chat'}
        >
          <MdMessage className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* End Session */}
        <button
          onClick={onEndSession}
          className="p-3 sm:p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 transition-all duration-200 transform hover:scale-105"
          title="End session"
        >
          <MdCallEnd className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  );
};

export default VideoControls;