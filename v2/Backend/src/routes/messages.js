/**
 * Message routes
 * Handles real-time messaging between patients and therapists
 */

const express = require('express');
const { prisma } = require('../utils/database');
const { authenticate, authorize, requireVerified, checkResourceAccess } = require('../middleware/authMiddleware');
const { validate, sendMessageSchema, uuidSchema, uuidParamsSchema, recipientIdParamsSchema, paginationSchema } = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const { createAuditLog, AUDIT_ACTIONS } = require('../utils/audit');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Check if user can access message conversation
 */
const canAccessConversation = async (user, params) => {
  const { recipientId } = params;

  // Users can message their assigned therapist/patient
  if (user.role === 'PATIENT') {
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: user.id },
      include: {
        assignedTherapist: {
          include: { user: true }
        }
      }
    });

    return patientProfile?.assignedTherapist?.user.id === recipientId;
  }

  if (user.role === 'THERAPIST') {
    const therapistProfile = await prisma.therapistProfile.findUnique({
      where: { userId: user.id }
    });

    const patientProfile = await prisma.patientProfile.findUnique({
      where: { 
        userId: recipientId,
        assignedTherapistId: therapistProfile?.id
      }
    });

    return !!patientProfile;
  }

  // Admins can access all conversations
  return user.role === 'ADMIN';
};

/**
 * @route   POST /api/messages
 * @desc    Send a new message
 * @access  Private
 */
router.post('/', 
  authenticate, 
  requireVerified,
  validate(sendMessageSchema),
  asyncHandler(async (req, res) => {
    const { receiverId, content, messageType, sessionId } = req.body;

    // Verify receiver exists and is active
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId, isActive: true }
    });

    if (!receiver) {
      throw new AppError('Recipient not found', 404);
    }

    // Check if users can communicate
    const canMessage = await canAccessConversation(req.user, { recipientId: receiverId });
    if (!canMessage) {
      throw new AppError('You can only message your assigned therapist/patients', 403);
    }

    // Verify session if provided
    if (sessionId) {
      const session = await prisma.session.findFirst({
        where: {
          id: sessionId,
          OR: [
            { patientId: req.user.id, therapistId: receiverId },
            { patientId: receiverId, therapistId: req.user.id }
          ]
        }
      });

      if (!session) {
        throw new AppError('Session not found or access denied', 404);
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: req.user.id,
        receiverId,
        content,
        messageType,
        sessionId,
        isEncrypted: true // In production, implement actual encryption
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
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true
          }
        },
        session: {
          select: {
            id: true,
            scheduledAt: true,
            status: true
          }
        }
      }
    });

    // Log audit event
    await createAuditLog({
      action: AUDIT_ACTIONS.MESSAGE_SEND,
      userId: req.user.id,
      userEmail: req.user.email,
      resource: 'MESSAGE',
      resourceId: message.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'SUCCESS',
      details: { receiverId, messageType, sessionId }
    });

    // Emit real-time message via Socket.IO (handled in socket handler)
    req.io?.to(`user_${receiverId}`).emit('new_message', {
      message: {
        ...message,
        content: messageType === 'TEXT' ? content : 'File attachment' // Don't send file content over socket
      }
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    });
  })
);

/**
 * @route   GET /api/messages/conversations
 * @desc    Get list of conversations
 * @access  Private
 */
router.get('/conversations', 
  authenticate, 
  requireVerified,
  asyncHandler(async (req, res) => {
    let conversations = [];

    if (req.user.role === 'PATIENT') {
      // Get conversation with assigned therapist
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { userId: req.user.id },
        include: {
          assignedTherapist: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true
                }
              }
            }
          }
        }
      });

      if (patientProfile?.assignedTherapist) {
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: req.user.id, receiverId: patientProfile.assignedTherapist.user.id },
              { senderId: patientProfile.assignedTherapist.user.id, receiverId: req.user.id }
            ]
          },
          orderBy: { createdAt: 'desc' }
        });

        const unreadCount = await prisma.message.count({
          where: {
            senderId: patientProfile.assignedTherapist.user.id,
            receiverId: req.user.id,
            isRead: false
          }
        });

        conversations.push({
          participant: patientProfile.assignedTherapist.user,
          lastMessage,
          unreadCount
        });
      }
    } else if (req.user.role === 'THERAPIST') {
      // Get conversations with assigned patients
      const therapistProfile = await prisma.therapistProfile.findUnique({
        where: { userId: req.user.id },
        include: {
          assignedPatients: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true
                }
              }
            }
          }
        }
      });

      if (therapistProfile?.assignedPatients) {
        for (const patient of therapistProfile.assignedPatients) {
          const lastMessage = await prisma.message.findFirst({
            where: {
              OR: [
                { senderId: req.user.id, receiverId: patient.user.id },
                { senderId: patient.user.id, receiverId: req.user.id }
              ]
            },
            orderBy: { createdAt: 'desc' }
          });

          const unreadCount = await prisma.message.count({
            where: {
              senderId: patient.user.id,
              receiverId: req.user.id,
              isRead: false
            }
          });

          conversations.push({
            participant: patient.user,
            lastMessage,
            unreadCount
          });
        }
      }
    }

    // Sort by last message time
    conversations.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
      return timeB - timeA;
    });

    res.json({
      success: true,
      data: { conversations }
    });
  })
);

/**
 * @route   GET /api/messages/conversations/:recipientId
 * @desc    Get messages in a conversation
 * @access  Private
 */
router.get('/conversations/:recipientId', 
  authenticate, 
  requireVerified,
  validate(recipientIdParamsSchema, 'params'),
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { recipientId } = req.params;
    const { page, limit, sortOrder = 'asc' } = req.query;
    const skip = (page - 1) * limit;

    // Check access
    const canAccess = await canAccessConversation(req.user, { recipientId });
    if (!canAccess) {
      throw new AppError('Access denied to this conversation', 403);
    }

    const where = {
      OR: [
        { senderId: req.user.id, receiverId: recipientId },
        { senderId: recipientId, receiverId: req.user.id }
      ]
    };

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
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
        },
        orderBy: { createdAt: sortOrder },
        skip,
        take: limit
      }),
      prisma.message.count({ where })
    ]);

    // Mark received messages as read
    await prisma.message.updateMany({
      where: {
        senderId: recipientId,
        receiverId: req.user.id,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  })
);

/**
 * @route   PUT /api/messages/:id/read
 * @desc    Mark message as read
 * @access  Private
 */
router.put('/:id/read', 
  authenticate, 
  requireVerified,
  validate(uuidParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    const message = await prisma.message.findUnique({
      where: { id: req.params.id }
    });

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    if (message.receiverId !== req.user.id) {
      throw new AppError('Access denied', 403);
    }

    if (!message.isRead) {
      await prisma.message.update({
        where: { id: req.params.id },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      // Log audit event
      await createAuditLog({
        action: AUDIT_ACTIONS.MESSAGE_READ,
        userId: req.user.id,
        userEmail: req.user.email,
        resource: 'MESSAGE',
        resourceId: message.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'SUCCESS'
      });
    }

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  })
);

/**
 * @route   DELETE /api/messages/:id
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/:id', 
  authenticate, 
  requireVerified,
  validate(uuidParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    const message = await prisma.message.findUnique({
      where: { id: req.params.id }
    });

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    // Only sender can delete their message, or admin
    if (message.senderId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AppError('Access denied', 403);
    }

    await prisma.message.delete({
      where: { id: req.params.id }
    });

    // Log audit event
    await createAuditLog({
      action: AUDIT_ACTIONS.MESSAGE_DELETE,
      userId: req.user.id,
      userEmail: req.user.email,
      resource: 'MESSAGE',
      resourceId: message.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'SUCCESS'
    });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  })
);

/**
 * @route   GET /api/messages/unread-count
 * @desc    Get unread message count
 * @access  Private
 */
router.get('/unread-count', 
  authenticate, 
  requireVerified,
  asyncHandler(async (req, res) => {
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: req.user.id,
        isRead: false
      }
    });

    res.json({
      success: true,
      data: { unreadCount }
    });
  })
);

/**
 * @route   POST /api/messages/mark-all-read
 * @desc    Mark all messages as read
 * @access  Private
 */
router.post('/mark-all-read', 
  authenticate, 
  requireVerified,
  asyncHandler(async (req, res) => {
    const updatedCount = await prisma.message.updateMany({
      where: {
        receiverId: req.user.id,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({
      success: true,
      message: `${updatedCount.count} messages marked as read`
    });
  })
);

/**
 * @route   GET /api/messages/search
 * @desc    Search messages
 * @access  Private
 */
router.get('/search', 
  authenticate, 
  requireVerified,
  asyncHandler(async (req, res) => {
    const { q: query, participantId, sessionId, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    if (!query || query.trim().length < 2) {
      throw new AppError('Search query must be at least 2 characters', 400);
    }

    let where = {
      OR: [
        { senderId: req.user.id },
        { receiverId: req.user.id }
      ],
      content: {
        contains: query,
        mode: 'insensitive'
      }
    };

    // Filter by participant
    if (participantId) {
      where.OR = [
        { senderId: req.user.id, receiverId: participantId },
        { senderId: participantId, receiverId: req.user.id }
      ];
    }

    // Filter by session
    if (sessionId) {
      where.sessionId = sessionId;
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.message.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        messages,
        query,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  })
);

module.exports = router;
