import { MdSignalWifi4Bar, MdVideocam, MdArrowBack } from 'react-icons/md';

const ConnectionStatus = ({ 
  session, 
  connectionStatus, 
  participantCount = 0,
  onGoBack,
  className = ""
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-emerald-400';
      case 'connecting': return 'text-amber-400';
      case 'disconnected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'connected') {
      return <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>;
    }
    return <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>;
  };

  return (
    <div className={`bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 px-4 sm:px-6 py-3 sm:py-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <button
            onClick={onGoBack}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors md:hidden"
          >
            <MdArrowBack className="w-5 h-5 text-gray-300" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-white text-sm sm:text-lg font-semibold truncate max-w-[200px] sm:max-w-none">
              {session?.title || 'Therapy Session'}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex items-center space-x-1">
                {getStatusIcon(connectionStatus)}
                <p className={`text-xs sm:text-sm ${getStatusColor(connectionStatus)}`}>
                  {getStatusText(connectionStatus)}
                </p>
              </div>
              {participantCount > 0 && (
                <>
                  <span className="text-gray-500">•</span>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    {participantCount} participant{participantCount !== 1 ? 's' : ''}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-400">
            <MdSignalWifi4Bar className="w-4 h-4 text-gray-400" />
            <span className={getStatusColor(connectionStatus)}>
              {getStatusText(connectionStatus)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;