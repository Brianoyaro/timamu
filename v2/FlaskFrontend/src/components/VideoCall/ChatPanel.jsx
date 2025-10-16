import { useState, useRef, useEffect } from 'react';
import { MdSend, MdClose } from 'react-icons/md';

const ChatPanel = ({
  isOpen,
  onClose,
  messages,
  newMessage,
  setNewMessage,
  onSendMessage,
  className = ""
}) => {
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`bg-slate-800/95 backdrop-blur-sm border-l border-slate-700/50 flex flex-col ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <h3 className="text-white font-semibold text-lg">Session Chat</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <MdClose className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
      >
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdSend className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-400 text-sm">
              No messages yet. Start the conversation!
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Messages are private and secure
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={msg.id || index} className="group">
              {msg.isOwn ? (
                // Your own messages - aligned to the right
                <div className="flex items-end justify-end space-x-2">
                  <div className="max-w-xs lg:max-w-md">
                    <div className="flex items-center space-x-2 mb-1 justify-end">
                      <span className="text-gray-500 text-xs">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-gray-300 text-sm font-medium">
                        You
                      </span>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl rounded-br-md px-3 py-2 shadow-lg">
                      <p className="text-white text-sm leading-relaxed break-words">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {msg.sender?.name?.[0]?.toUpperCase() || 'Y'}
                    </span>
                  </div>
                </div>
              ) : (
                // Other participant's messages - aligned to the left
                <div className="flex items-end space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {msg.sender?.name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 max-w-xs lg:max-w-md">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-gray-300 text-sm font-medium truncate">
                        {msg.sender.name}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="bg-slate-700/50 rounded-2xl rounded-tl-md px-3 py-2">
                      <p className="text-white text-sm leading-relaxed break-words">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Message Input */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-2xl px-4 py-3 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 pr-12"
              maxLength={500}
            />
            <div className="absolute right-3 bottom-3 text-xs text-gray-500">
              {newMessage.length}/500
            </div>
          </div>
          <button
            onClick={onSendMessage}
            disabled={!newMessage.trim()}
            className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-2xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:opacity-50 flex items-center justify-center"
          >
            <MdSend className="w-5 h-5" />
          </button>
        </div>
        
        {/* Chat Tips */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>Press Enter to send</span>
          <span>End-to-end secure</span>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;