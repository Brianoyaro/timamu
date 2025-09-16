import { create } from 'zustand';
import { io } from 'socket.io-client';
import { getSocketUrl } from '../utils/api';

const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,
  messages: {},
  notifications: [],
  onlineUsers: new Set(),

  // Actions
  connect: (token) => {
    const socketUrl = getSocketUrl();
    console.log('Socket environment:', { socketUrl });
    
    const socket = io(socketUrl, {
      auth: {
        token: token,
      },
      transports: ['polling', 'websocket'], // Add fallback transports
      timeout: 20000,
      forceNew: true,
      upgrade: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('Socket connected to:', socketUrl);
      set({ isConnected: true });
    });

    socket.on('connected', (data) => {
      console.log('Socket authenticated:', data);
      set({ isConnected: true });
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      set({ isConnected: false });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      set({ isConnected: false });
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      set({ isConnected: true });
    });

    socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection failed:', error.message);
    });

    socket.on('new_message', (data) => {
      const { messages } = get();
      const message = data.message;
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

    socket.on('user_online', ({ userId }) => {
      set((state) => {
        const newOnlineUsers = new Set(state.onlineUsers);
        newOnlineUsers.add(userId);
        return { onlineUsers: newOnlineUsers };
      });
    });

    socket.on('user_offline', ({ userId }) => {
      set((state) => {
        const newOnlineUsers = new Set(state.onlineUsers);
        newOnlineUsers.delete(userId);
        return { onlineUsers: newOnlineUsers };
      });
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
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
      socket.emit('join_session', { sessionId });
    }
  },

  leaveSession: (sessionId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('leave_session', { sessionId });
    }
  },

  sendMessage: (receiverId, content, messageType = 'TEXT', sessionId = null) => {
    const { socket } = get();
    if (socket) {
      socket.emit('send_message', {
        receiverId,
        content,
        messageType,
        sessionId
      });
    }
  },

  // WebRTC signaling
  sendOffer: (sessionId, targetUserId, offer) => {
    const { socket } = get();
    if (socket) {
      socket.emit('webrtc_offer', { sessionId, targetUserId, offer });
    }
  },

  sendAnswer: (sessionId, targetUserId, answer) => {
    const { socket } = get();
    if (socket) {
      socket.emit('webrtc_answer', { sessionId, targetUserId, answer });
    }
  },

  sendIceCandidate: (sessionId, targetUserId, candidate) => {
    const { socket } = get();
    if (socket) {
      socket.emit('webrtc_ice_candidate', { sessionId, targetUserId, candidate });
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
