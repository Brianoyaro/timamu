import { MdArrowBack, MdRefresh, MdVideocamOff, MdError } from 'react-icons/md';

const ErrorScreen = ({ 
  error, 
  user,
  roomId,
  session,
  mediaSoupSocketRef,
  onRetry,
  onGoBack 
}) => {
  const isMediaError = error.includes('camera') || error.includes('microphone');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MdError className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-red-400 text-xl sm:text-2xl font-bold mb-2">Connection Error</h2>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{error}</p>
          </div>
          
          {isMediaError ? (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                <div className="flex items-start space-x-3">
                  <MdVideocamOff className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-amber-400 font-medium text-sm mb-1">Media Access Required</h3>
                    <p className="text-amber-200 text-xs leading-relaxed">
                      Please allow camera and microphone permissions in your browser settings, then try again.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onRetry}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                >
                  <MdRefresh className="w-5 h-5" />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={onGoBack}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <MdArrowBack className="w-5 h-5" />
                  <span>Go Back</span>
                </button>
              </div>
              
              <details className="mt-4">
                <summary className="text-gray-400 text-xs cursor-pointer hover:text-gray-300 transition-colors">
                  Show debug information
                </summary>
                <div className="mt-2 p-3 bg-slate-900/50 border border-slate-700/30 rounded-xl text-xs">
                  <div className="space-y-1">
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
                      <span className="text-gray-500">Session:</span> {session?.title || 'Not loaded'}
                    </p>
                  </div>
                </div>
              </details>
            </div>
          ) : (
            <button
              onClick={onGoBack}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
            >
              <MdArrowBack className="w-5 h-5" />
              <span>Back to Sessions</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorScreen;