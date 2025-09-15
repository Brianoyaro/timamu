import { create } from 'zustand';
import { io } from 'socket.io-client';

const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,
  messages: {},
  notifications: [],
  onlineUsers: new Set(),

  // Actions
  connect: (token) => {
    const socket = io(process.env.VITE_API_URL || 'http://localhost:5000', {
      auth: {
        token: token,
      },
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      set({ isConnected: false });
    });

    socket.on('message-received', (message) => {
      const { messages } = get();
      const sessionId = message.sessionId;
      
      set({
        messages: {
          ...messages,
          [sessionId]: [...(messages[sessionId] || []), message],
        },
      });
    });

    socket.on('notification', (notification) => {
      set((state) => ({
        notifications: [notification, ...state.notifications],
      }));
    });

    socket.on('user-status-changed', ({ userId, status }) => {
      set((state) => {
        const newOnlineUsers = new Set(state.onlineUsers);
        if (status === 'online') {
          newOnlineUsers.add(userId);
        } else {
          newOnlineUsers.delete(userId);
        }
        return { onlineUsers: newOnlineUsers };
      });
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  joinSession: (sessionId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('join-session', sessionId);
    }
  },

  leaveSession: (sessionId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('leave-session', sessionId);
    }
  },

  sendMessage: (sessionId, content, type = 'text') => {
    const { socket } = get();
    if (socket) {
      const message = {
        sessionId,
        content,
        type,
        timestamp: new Date().toISOString(),
      };
      socket.emit('send-message', message);
    }
  },

  // WebRTC signaling
  sendOffer: (sessionId, offer) => {
    const { socket } = get();
    if (socket) {
      socket.emit('offer', { sessionId, offer });
    }
  },

  sendAnswer: (sessionId, answer) => {
    const { socket } = get();
    if (socket) {
      socket.emit('answer', { sessionId, answer });
    }
  },

  sendIceCandidate: (sessionId, candidate) => {
    const { socket } = get();
    if (socket) {
      socket.emit('ice-candidate', { sessionId, candidate });
    }
  },

  // Message management
  setMessages: (sessionId, messages) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: messages,
      },
    }));
  },

  clearMessages: (sessionId) => {
    set((state) => {
      const newMessages = { ...state.messages };
      delete newMessages[sessionId];
      return { messages: newMessages };
    });
  },

  // Notifications
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
    }));
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },
}));

export default useSocketStore;
