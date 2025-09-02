import express from 'express'
import { body, query } from 'express-validator'
import multer from 'multer'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'
import { requireTenant, validateTenantAccess } from '../middleware/tenant.js'
import { validateRequest, sanitizeInput } from '../middleware/validation.js'
import { auditLog } from '../middleware/auditLog.js'

const router = express.Router()
const prisma = new PrismaClient()

// Configure multer for file attachments
const upload = multer({
  dest: 'uploads/attachments/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
})

// Get message threads
router.get('/',
  authenticate,
  requireTenant,
  validateTenantAccess,
  async (req, res) => {
    try {
      const threads = await prisma.thread.findMany({
        where: {
          tenantId: req.tenantId,
          participants: {
            some: {
              userId: req.user.id
            }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  roles: true
                }
              }
            }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              content: true,
              type: true,
              createdAt: true,
              senderId: true,
              readAt: true
            }
          },
          _count: {
            select: {
              messages: {
                where: {
                  senderId: { not: req.user.id },
                  readAt: null
                }
              }
            }
          }
        },
        orderBy: { lastMessageAt: 'desc' }
      })

      // Format response
      const formattedThreads = threads.map(thread => ({
        id: thread.id,
        participants: thread.participants.map(p => p.user),
        lastMessage: thread.messages[0] || null,
        unreadCount: thread._count.messages,
        updatedAt: thread.lastMessageAt
      }))

      res.json({
        success: true,
        data: { threads: formattedThreads }
      })
    } catch (error) {
      console.error('Get threads error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch message threads'
      })
    }
  }
)

// Get thread details
router.get('/:id',
  authenticate,
  requireTenant,
  validateTenantAccess,
  async (req, res) => {
    try {
      const { id } = req.params

      const thread = await prisma.thread.findFirst({
        where: {
          id,
          tenantId: req.tenantId,
          participants: {
            some: {
              userId: req.user.id
            }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  roles: true
                }
              }
            }
          }
        }
      })

      if (!thread) {
        return res.status(404).json({
          success: false,
          error: 'Thread not found or access denied'
        })
      }

      res.json({
        success: true,
        data: { thread }
      })
    } catch (error) {
      console.error('Get thread error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch thread'
      })
    }
  }
)

// Get messages in thread
router.get('/:id/messages',
  authenticate,
  requireTenant,
  validateTenantAccess,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params
      const { page = 1, limit = 50 } = req.query

      // Verify thread access
      const thread = await prisma.thread.findFirst({
        where: {
          id,
          tenantId: req.tenantId,
          participants: {
            some: {
              userId: req.user.id
            }
          }
        }
      })

      if (!thread) {
        return res.status(404).json({
          success: false,
          error: 'Thread not found or access denied'
        })
      }

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: { threadId: id },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: parseInt(limit)
        }),
        prisma.message.count({ where: { threadId: id } })
      ])

      res.json({
        success: true,
        data: {
          messages: messages.reverse(), // Reverse to show oldest first
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      })
    } catch (error) {
      console.error('Get messages error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch messages'
      })
    }
  }
)

// Send message
router.post('/:id/messages',
  authenticate,
  requireTenant,
  validateTenantAccess,
  sanitizeInput,
  [
    body('content').trim().notEmpty(),
    body('type').optional().isIn(['text', 'file', 'image'])
  ],
  validateRequest,
  auditLog('message.sent'),
  async (req, res) => {
    try {
      const { id } = req.params
      const { content, type = 'text', attachment } = req.body

      // Verify thread access
      const thread = await prisma.thread.findFirst({
        where: {
          id,
          tenantId: req.tenantId,
          participants: {
            some: {
              userId: req.user.id
            }
          }
        }
      })

      if (!thread) {
        return res.status(404).json({
          success: false,
          error: 'Thread not found or access denied'
        })
      }

      const message = await prisma.message.create({
        data: {
          content,
          type,
          attachment,
          threadId: id,
          senderId: req.user.id,
          tenantId: req.tenantId
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      })

      // Update thread last message timestamp
      await prisma.thread.update({
        where: { id },
        data: { lastMessageAt: new Date() }
      })

      res.status(201).json({
        success: true,
        data: { message }
      })
    } catch (error) {
      console.error('Send message error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to send message'
      })
    }
  }
)

// Upload attachment
router.post('/:id/attachments',
  authenticate,
  requireTenant,
  validateTenantAccess,
  upload.single('file'),
  auditLog('message.attachment_uploaded'),
  async (req, res) => {
    try {
      const { id } = req.params

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        })
      }

      // Verify thread access
      const thread = await prisma.thread.findFirst({
        where: {
          id,
          tenantId: req.tenantId,
          participants: {
            some: {
              userId: req.user.id
            }
          }
        }
      })

      if (!thread) {
        return res.status(404).json({
          success: false,
          error: 'Thread not found or access denied'
        })
      }

      // In production, upload to cloud storage
      const attachment = {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/attachments/${req.file.filename}`
      }

      res.json({
        success: true,
        data: { attachment }
      })
    } catch (error) {
      console.error('Upload attachment error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to upload attachment'
      })
    }
  }
)

// Mark message as read
router.patch('/:threadId/messages/:messageId/read',
  authenticate,
  requireTenant,
  validateTenantAccess,
  auditLog('message.marked_read'),
  async (req, res) => {
    try {
      const { threadId, messageId } = req.params

      // Verify thread access
      const thread = await prisma.thread.findFirst({
        where: {
          id: threadId,
          tenantId: req.tenantId,
          participants: {
            some: {
              userId: req.user.id
            }
          }
        }
      })

      if (!thread) {
        return res.status(404).json({
          success: false,
          error: 'Thread not found or access denied'
        })
      }

      const message = await prisma.message.update({
        where: {
          id: messageId,
          threadId,
          senderId: { not: req.user.id } // Can't mark own messages as read
        },
        data: { readAt: new Date() }
      })

      res.json({
        success: true,
        data: { message }
      })
    } catch (error) {
      console.error('Mark message read error:', error)
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Message not found'
        })
      }

      res.status(500).json({
        success: false,
        error: 'Failed to mark message as read'
      })
    }
  }
)

// Create thread (for starting new conversations)
router.post('/',
  authenticate,
  requireTenant,
  validateTenantAccess,
  sanitizeInput,
  [
    body('participantIds').isArray().isLength({ min: 1, max: 10 }),
    body('participantIds.*').isUUID(),
    body('initialMessage').optional().trim()
  ],
  validateRequest,
  auditLog('thread.created'),
  async (req, res) => {
    try {
      const { participantIds, initialMessage } = req.body

      // Verify all participants belong to tenant
      const participants = await prisma.user.findMany({
        where: {
          id: { in: participantIds },
          tenantId: req.tenantId
        }
      })

      if (participants.length !== participantIds.length) {
        return res.status(400).json({
          success: false,
          error: 'Some participants not found in tenant'
        })
      }

      // Add current user to participants if not included
      const allParticipantIds = [...new Set([req.user.id, ...participantIds])]

      const thread = await prisma.thread.create({
        data: {
          tenantId: req.tenantId,
          participants: {
            create: allParticipantIds.map(userId => ({ userId }))
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  roles: true
                }
              }
            }
          }
        }
      })

      // Send initial message if provided
      if (initialMessage) {
        await prisma.message.create({
          data: {
            content: initialMessage,
            threadId: thread.id,
            senderId: req.user.id,
            tenantId: req.tenantId
          }
        })
      }

      res.status(201).json({
        success: true,
        data: { thread }
      })
    } catch (error) {
      console.error('Create thread error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create thread'
      })
    }
  }
)

export default router
