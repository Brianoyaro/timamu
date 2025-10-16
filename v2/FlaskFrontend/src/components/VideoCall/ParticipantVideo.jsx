import { useState, useRef, useEffect } from 'react';
import { MdMicOff, MdVideocamOff } from 'react-icons/md';

const ParticipantVideo = ({ 
  participant, 
  isLocal = false, 
  stream,
  isVideoEnabled = true,
  isAudioEnabled = true,
  className = ""
}) => {
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleVideoError = () => {
    setVideoError(true);
  };

  const getParticipantName = () => {
    if (isLocal) return 'You';
    return participant?.name || 'Participant';
  };

  const getInitials = () => {
    const name = getParticipantName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className={`relative bg-gray-800 rounded-lg overflow-hidden ${className}`}>
      {/* Video Element */}
      {isVideoEnabled && !videoError ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Always mute local video to prevent echo
          className="w-full h-full object-cover"
          onError={handleVideoError}
        />
      ) : (
        // Video disabled or error - show avatar
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white text-lg sm:text-xl font-bold">
                {getInitials()}
              </span>
            </div>
            <p className="text-gray-300 text-sm font-medium">
              {getParticipantName()}
            </p>
            {!isVideoEnabled && (
              <p className="text-gray-500 text-xs mt-1">Camera off</p>
            )}
          </div>
        </div>
      )}

      {/* Participant Info Overlay */}
      <div className="absolute bottom-2 left-2 right-2">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium truncate">
              {getParticipantName()}
            </span>
            <div className="flex items-center space-x-1 ml-2">
              {!isAudioEnabled && (
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <MdMicOff className="w-3 h-3 text-white" />
                </div>
              )}
              {!isVideoEnabled && (
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <MdVideocamOff className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Local video indicator */}
      {isLocal && (
        <div className="absolute top-2 left-2">
          <div className="bg-emerald-500/90 backdrop-blur-sm rounded-lg px-2 py-1">
            <span className="text-white text-xs font-medium">You</span>
          </div>
        </div>
      )}

      {/* Connection quality indicator */}
      <div className="absolute top-2 right-2">
        <div className="flex items-center space-x-1">
          <div className="w-1 h-3 bg-emerald-400 rounded-full"></div>
          <div className="w-1 h-4 bg-emerald-400 rounded-full"></div>
          <div className="w-1 h-2 bg-gray-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantVideo;