/**
 * Socket.IO handler for real-time features
 * Handles video conferencing, chat, and notifications
 */

const jwt = require('jsonwebtoken');
const { prisma } = require('../utils/database');
const { createAuditLog, AUDIT_ACTIONS } = require('../utils/audit');
const logger = require('../utils/logger');

// Store active connections
const activeConnections = new Map();
const activeRooms = new Map(); // For video sessions

/**
 * Authenticate socket connection
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        patientProfile: true,
        therapistProfile: true,
        adminProfile: true
      }
    });

    if (!user || !user.isActive) {
      return next(new Error('User not found or inactive'));
    }

    socket.userId = user.id;
    socket.user = user;
    next();
  } catch (error) {
    logger.error('Socket authentication failed:', error);
    next(new Error('Invalid authentication token'));
  }
};

/**
 * Main socket handler
 */
const socketHandler = (io) => {
  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    logger.info(`User ${socket.user.email} connected via Socket.IO`);

    // Store active connection
    activeConnections.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date()
    });

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Join role-based rooms
    socket.join(`role_${socket.user.role}`);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected successfully',
      userId: socket.userId,
      role: socket.user.role
    });

    // Notify about online status
    socket.broadcast.emit('user_online', {
      userId: socket.userId,
      name: `${socket.user.firstName} ${socket.user.lastName}`
    });

    /**
     * Video Session Handlers
     */

    // Join video session
    socket.on('join_session', async (data) => {
      try {
        const { sessionId } = data;

        // Verify session access
        const session = await prisma.session.findFirst({
          where: {
            id: sessionId,
            OR: [
              { patientId: socket.userId },
              { therapistId: socket.userId }
            ],
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
          },
          include: {
            patient: { select: { id: true, firstName: true, lastName: true } },
            therapist: { select: { id: true, firstName: true, lastName: true } }
          }
        });

        if (!session) {
          socket.emit('error', { message: 'Session not found or access denied' });
          return;
        }

        // Join session room
        const roomName = `session_${sessionId}`;
        socket.join(roomName);

        // Initialize room if not exists
        if (!activeRooms.has(sessionId)) {
          activeRooms.set(sessionId, {
            sessionId,
            participants: new Map(),
            createdAt: new Date()
          });
        }

        const room = activeRooms.get(sessionId);
        room.participants.set(socket.userId, {
          socketId: socket.id,
          user: socket.user,
          joinedAt: new Date(),
          isVideoEnabled: false,
          isAudioEnabled: false
        });

        // Notify other participants
        socket.to(roomName).emit('participant_joined', {
          userId: socket.userId,
          name: `${socket.user.firstName} ${socket.user.lastName}`,
          role: socket.user.role
        });

        // Send current participants to new joiner
        const participants = Array.from(room.participants.values()).map(p => ({
          userId: p.user.id,
          name: `${p.user.firstName} ${p.user.lastName}`,
          role: p.user.role,
          isVideoEnabled: p.isVideoEnabled,
          isAudioEnabled: p.isAudioEnabled
        }));

        socket.emit('session_joined', {
          sessionId,
          session,
          participants: participants.filter(p => p.userId !== socket.userId)
        });

        // Update session status if needed
        if (session.status === 'SCHEDULED') {
          await prisma.session.update({
            where: { id: sessionId },
            data: {
              status: 'IN_PROGRESS',
              startedAt: new Date()
            }
          });
        }

        // Log audit event
        await createAuditLog({
          action: AUDIT_ACTIONS.SESSION_JOIN,
          userId: socket.userId,
          userEmail: socket.user.email,
          resource: 'SESSION',
          resourceId: sessionId,
          status: 'SUCCESS'
        });

      } catch (error) {
        logger.error('Error joining session:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Leave video session
    socket.on('leave_session', async (data) => {
      try {
        const { sessionId } = data;
        const roomName = `session_${sessionId}`;

        socket.leave(roomName);

        if (activeRooms.has(sessionId)) {
          const room = activeRooms.get(sessionId);
          room.participants.delete(socket.userId);

          // Notify other participants
          socket.to(roomName).emit('participant_left', {
            userId: socket.userId
          });

          // Clean up room if empty
          if (room.participants.size === 0) {
            activeRooms.delete(sessionId);
          }
        }

        socket.emit('session_left', { sessionId });

        // Log audit event
        await createAuditLog({
          action: AUDIT_ACTIONS.SESSION_LEAVE,
          userId: socket.userId,
          userEmail: socket.user.email,
          resource: 'SESSION',
          resourceId: sessionId,
          status: 'SUCCESS'
        });

      } catch (error) {
        logger.error('Error leaving session:', error);
        socket.emit('error', { message: 'Failed to leave session' });
      }
    });

    // WebRTC signaling
    socket.on('webrtc_offer', (data) => {
      const { sessionId, targetUserId, offer } = data;
      socket.to(`user_${targetUserId}`).emit('webrtc_offer', {
        fromUserId: socket.userId,
        sessionId,
        offer
      });
    });

    socket.on('webrtc_answer', (data) => {
      const { sessionId, targetUserId, answer } = data;
      socket.to(`user_${targetUserId}`).emit('webrtc_answer', {
        fromUserId: socket.userId,
        sessionId,
        answer
      });
    });

    socket.on('webrtc_ice_candidate', (data) => {
      const { sessionId, targetUserId, candidate } = data;
      socket.to(`user_${targetUserId}`).emit('webrtc_ice_candidate', {
        fromUserId: socket.userId,
        sessionId,
        candidate
      });
    });

    // Media control events
    socket.on('toggle_video', (data) => {
      const { sessionId, isEnabled } = data;
      const roomName = `session_${sessionId}`;

      if (activeRooms.has(sessionId)) {
        const room = activeRooms.get(sessionId);
        const participant = room.participants.get(socket.userId);
        if (participant) {
          participant.isVideoEnabled = isEnabled;
        }
      }

      socket.to(roomName).emit('participant_video_toggled', {
        userId: socket.userId,
        isEnabled
      });
    });

    socket.on('toggle_audio', (data) => {
      const { sessionId, isEnabled } = data;
      const roomName = `session_${sessionId}`;

      if (activeRooms.has(sessionId)) {
        const room = activeRooms.get(sessionId);
        const participant = room.participants.get(socket.userId);
        if (participant) {
          participant.isAudioEnabled = isEnabled;
        }
      }

      socket.to(roomName).emit('participant_audio_toggled', {
        userId: socket.userId,
        isEnabled
      });
    });

    /**
     * Chat Handlers
     */

    // Send real-time message
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content, messageType = 'TEXT', sessionId } = data;

        // Verify receiver exists and access permissions
        const receiver = await prisma.user.findUnique({
          where: { id: receiverId, isActive: true }
        });

        if (!receiver) {
          socket.emit('error', { message: 'Recipient not found' });
          return;
        }

        // Create message in database
        const message = await prisma.message.create({
          data: {
            senderId: socket.userId,
            receiverId,
            content,
            messageType,
            sessionId,
            isEncrypted: true
          },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true
              }
            }
          }
        });

        // Send to receiver
        socket.to(`user_${receiverId}`).emit('new_message', { message });

        // Confirm to sender
        socket.emit('message_sent', { message });

        // Log audit event
        await createAuditLog({
          action: AUDIT_ACTIONS.MESSAGE_SEND,
          userId: socket.userId,
          userEmail: socket.user.email,
          resource: 'MESSAGE',
          resourceId: message.id,
          status: 'SUCCESS',
          details: { receiverId, messageType }
        });

      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      const { receiverId } = data;
      socket.to(`user_${receiverId}`).emit('user_typing', {
        userId: socket.userId,
        name: `${socket.user.firstName} ${socket.user.lastName}`
      });
    });

    socket.on('typing_stop', (data) => {
      const { receiverId } = data;
      socket.to(`user_${receiverId}`).emit('user_stopped_typing', {
        userId: socket.userId
      });
    });

    /**
     * Notification Handlers
     */

    // Send notification to specific user
    socket.on('send_notification', async (data) => {
      try {
        if (socket.user.role !== 'ADMIN') {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        const { userId, title, message, type = 'info' } = data;

        socket.to(`user_${userId}`).emit('notification', {
          id: Date.now().toString(),
          title,
          message,
          type,
          timestamp: new Date()
        });

        socket.emit('notification_sent', { userId });

      } catch (error) {
        logger.error('Error sending notification:', error);
        socket.emit('error', { message: 'Failed to send notification' });
      }
    });

    // Broadcast to role
    socket.on('broadcast_to_role', async (data) => {
      try {
        if (socket.user.role !== 'ADMIN') {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        const { role, title, message, type = 'info' } = data;

        socket.to(`role_${role}`).emit('notification', {
          id: Date.now().toString(),
          title,
          message,
          type,
          timestamp: new Date()
        });

        socket.emit('broadcast_sent', { role });

      } catch (error) {
        logger.error('Error broadcasting message:', error);
        socket.emit('error', { message: 'Failed to broadcast message' });
      }
    });

    /**
     * Presence Handlers
     */

    socket.on('get_online_users', () => {
      const onlineUsers = Array.from(activeConnections.values()).map(conn => ({
        userId: conn.user.id,
        name: `${conn.user.firstName} ${conn.user.lastName}`,
        role: conn.user.role,
        connectedAt: conn.connectedAt
      }));

      socket.emit('online_users', { users: onlineUsers });
    });

    /**
     * Disconnect Handler
     */

    socket.on('disconnect', async () => {
      logger.info(`User ${socket.user.email} disconnected from Socket.IO`);

      // Remove from active connections
      activeConnections.delete(socket.userId);

      // Remove from all session rooms
      for (const [sessionId, room] of activeRooms.entries()) {
        if (room.participants.has(socket.userId)) {
          room.participants.delete(socket.userId);
          
          // Notify other participants
          socket.to(`session_${sessionId}`).emit('participant_left', {
            userId: socket.userId
          });

          // Clean up room if empty
          if (room.participants.size === 0) {
            activeRooms.delete(sessionId);
          }
        }
      }

      // Notify about offline status
      socket.broadcast.emit('user_offline', {
        userId: socket.userId
      });
    });

    /**
     * Error Handler
     */

    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  // Periodic cleanup of inactive rooms
  setInterval(() => {
    const now = new Date();
    for (const [sessionId, room] of activeRooms.entries()) {
      // Remove rooms older than 2 hours with no participants
      if (room.participants.size === 0 && (now - room.createdAt) > 2 * 60 * 60 * 1000) {
        activeRooms.delete(sessionId);
        logger.info(`Cleaned up inactive session room: ${sessionId}`);
      }
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  logger.info('Socket.IO handler initialized');
};

module.exports = socketHandler;
