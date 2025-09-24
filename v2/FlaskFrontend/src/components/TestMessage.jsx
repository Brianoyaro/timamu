import { useState, useEffect } from 'react';
import { useSocketStore } from '../stores/socketStore';
import { useAuthStore } from '../stores/authStore';

const TestMessage = () => {
  const [message, setMessage] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [receivedMessages, setReceivedMessages] = useState([]); // How will I set the receiverId????///
  const { socket, sendMessage } = useSocketStore();
  const { user } = useAuthStore();

  // Add listener for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      setReceivedMessages((prev) => [...prev, data]);
    };

    socket.on('new_message', handleNewMessage);
    
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket]);

  const handleSendMessage = () => {
    if (!message.trim() || !receiverId.trim()) return;
    
    sendMessage(receiverId, message);
    setMessage('');
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-md my-4">
      <h2 className="text-xl font-semibold mb-4">Test Socket Messages</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Receiver ID
        </label>
        <input
          type="text"
          value={receiverId}
          onChange={(e) => setReceiverId(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          placeholder="Enter receiver user ID"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          placeholder="Type your message here"
          rows="3"
        ></textarea>
      </div>
      
      <button
        onClick={handleSendMessage}
        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
      >
        Send Message
      </button>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">Received Messages</h3>
        {receivedMessages.length === 0 ? (
          <p className="text-gray-500">No messages yet</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {receivedMessages.map((msg, index) => (
              <li key={index} className="py-3">
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs text-gray-500">
                  From: {msg.senderId}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TestMessage;