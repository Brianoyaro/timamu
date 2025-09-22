/**
 * Socket utilities for handling socket.io connections and events
 */

// Get the socket URL from environment variables or use default
export const getSocketUrl = () => {
  return import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
};

// Format date for messages
export const formatMessageDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Check if a user is online based on the online users set
export const isUserOnline = (userId, onlineUsers) => {
  return onlineUsers.has(userId);
};

// Helper to add socket event listeners
export const addSocketListeners = (socket, events) => {
  if (!socket) return;
  
  Object.entries(events).forEach(([event, handler]) => {
    socket.on(event, handler);
  });
  
  return () => {
    Object.keys(events).forEach((event) => {
      socket.off(event);
    });
  };
};

// Generate a unique room ID for private chats between two users
export const getPrivateRoomId = (userId1, userId2) => {
  // Sort the IDs to ensure the same room ID regardless of order
  const sortedIds = [userId1, userId2].sort();
  return `private_${sortedIds.join('_')}`;
};

// Helper to emit socket events with proper error handling
export const emitSocketEvent = (socket, event, data) => {
  if (!socket) {
    console.error(`Socket not connected, can't emit ${event}`);
    return Promise.reject(new Error('Socket not connected'));
  }
  
  return new Promise((resolve, reject) => {
    socket.emit(event, data, (response) => {
      if (response?.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
};

export default {
  getSocketUrl,
  formatMessageDate,
  isUserOnline,
  addSocketListeners,
  getPrivateRoomId,
  emitSocketEvent
};