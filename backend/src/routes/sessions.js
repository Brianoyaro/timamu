import express from 'express'
import { body, query } from 'express-validator'
import { PrismaClient } from '@prisma/client'
import { authenticate, authorize } from '../middleware/auth.js'
import { requireTenant, validateTenantAccess } from '../middleware/tenant.js'
import { validateRequest, sanitizeInput } from '../middleware/validation.js'
import { auditLog } from '../middleware/auditLog.js'

const router = express.Router()
const prisma = new PrismaClient()

// Get sessions
router.get('/',
  authenticate,
  requireTenant,
  validateTenantAccess,
  [
    query('status').optional().isIn(['scheduled', 'active', 'ended', 'cancelled']),
    query('patientId').optional().isUUID(),
    query('therapistId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { status, patientId, therapistId, page = 1, limit = 20 } = req.query

      const where = { tenantId: req.tenantId }
      
      // Role-based filtering
      if (req.user.roles.includes('patient')) {
        where.patientId = req.user.id
      } else if (req.user.roles.includes('therapist') && !req.user.roles.includes('admin')) {
        where.therapistId = req.user.id
      }

      if (status) where.status = status
      if (patientId) where.patientId = patientId
      if (therapistId) where.therapistId = therapistId

      const [sessions, total] = await Promise.all([
        prisma.session.findMany({
          where,
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                avatar: true,
                email: true
              }
            },
            therapist: {
              select: {
                id: true,
                name: true,
                avatar: true,
                title: true
              }
            },
            appointment: {
              select: {
                id: true,
                type: true,
                notes: true
              }
            }
          },
          orderBy: { startTime: 'desc' },
          skip: (page - 1) * limit,
          take: parseInt(limit)
        }),
        prisma.session.count({ where })
      ])

      res.json({
        success: true,
        data: {
          sessions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      })
    } catch (error) {
      console.error('Get sessions error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sessions'
      })
    }
  }
)

// Get session details
router.get('/:id',
  authenticate,
  requireTenant,
  validateTenantAccess,
  async (req, res) => {
    try {
      const { id } = req.params

      const session = await prisma.session.findFirst({
        where: {
          id,
          tenantId: req.tenantId,
          OR: [
            { patientId: req.user.id },
            { therapistId: req.user.id },
            { tenant: { users: { some: { id: req.user.id, roles: { has: 'admin' } } } } }
          ]
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              avatar: true,
              email: true
            }
          },
          therapist: {
            select: {
              id: true,
              name: true,
              avatar: true,
              title: true
            }
          },
          appointment: true,
          notes: {
            where: {
              OR: [
                { isVisibleToPatient: true },
                { authorId: req.user.id },
                { session: { therapistId: req.user.id } }
              ]
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        })
      }

      res.json({
        success: true,
        data: { session }
      })
    } catch (error) {
      console.error('Get session error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch session'
      })
    }
  }
)

// Create session
router.post('/',
  authenticate,
  requireTenant,
  validateTenantAccess,
  sanitizeInput,
  [
    body('patientId').isUUID(),
    body('therapistId').isUUID(),
    body('startTime').isISO8601(),
    body('duration').optional().isInt({ min: 15, max: 180 }),
    body('type').optional().isIn(['therapy', 'consultation', 'assessment']),
    body('appointmentId').optional().isUUID()
  ],
  validateRequest,
  auditLog('session.created'),
  async (req, res) => {
    try {
      const { patientId, therapistId, startTime, duration = 60, type = 'therapy', appointmentId } = req.body

      // Verify participants belong to tenant
      const [patient, therapist] = await Promise.all([
        prisma.user.findFirst({
          where: { id: patientId, tenantId: req.tenantId, roles: { has: 'patient' } }
        }),
        prisma.user.findFirst({
          where: { id: therapistId, tenantId: req.tenantId, roles: { has: 'therapist' } }
        })
      ])

      if (!patient || !therapist) {
        return res.status(400).json({
          success: false,
          error: 'Invalid patient or therapist'
        })
      }

      // Check authorization
      const canCreate = req.user.roles.includes('admin') || 
                       req.user.id === therapistId || 
                       req.user.id === patientId

      if (!canCreate) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to create this session'
        })
      }

      const sessionData = {
        patientId,
        therapistId,
        startTime: new Date(startTime),
        duration,
        type,
        tenantId: req.tenantId
      }

      if (appointmentId) {
        sessionData.appointment = {
          connect: { id: appointmentId }
        }
      }

      const session = await prisma.session.create({
        data: sessionData,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          therapist: {
            select: {
              id: true,
              name: true,
              avatar: true,
              title: true
            }
          }
        }
      })

      res.status(201).json({
        success: true,
        data: { session }
      })
    } catch (error) {
      console.error('Create session error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create session'
      })
    }
  }
)

// Join session
router.post('/:id/join',
  authenticate,
  requireTenant,
  validateTenantAccess,
  auditLog('session.joined'),
  async (req, res) => {
    try {
      const { id } = req.params

      const session = await prisma.session.findFirst({
        where: {
          id,
          tenantId: req.tenantId,
          OR: [
            { patientId: req.user.id },
            { therapistId: req.user.id }
          ]
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          therapist: {
            select: {
              id: true,
              name: true,
              avatar: true,
              title: true
            }
          }
        }
      })

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found or access denied'
        })
      }

      if (session.status === 'ended') {
        return res.status(400).json({
          success: false,
          error: 'Session has already ended'
        })
      }

      // Update session status if not already active
      if (session.status === 'scheduled') {
        await prisma.session.update({
          where: { id },
          data: { status: 'active' }
        })
      }

      res.json({
        success: true,
        data: { session: { ...session, status: 'active' } }
      })
    } catch (error) {
      console.error('Join session error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to join session'
      })
    }
  }
)

// End session
router.post('/:id/end',
  authenticate,
  requireTenant,
  validateTenantAccess,
  auditLog('session.ended'),
  async (req, res) => {
    try {
      const { id } = req.params

      const session = await prisma.session.findFirst({
        where: {
          id,
          tenantId: req.tenantId,
          OR: [
            { patientId: req.user.id },
            { therapistId: req.user.id }
          ]
        }
      })

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found or access denied'
        })
      }

      if (session.status === 'ended') {
        return res.status(400).json({
          success: false,
          error: 'Session has already ended'
        })
      }

      const updatedSession = await prisma.session.update({
        where: { id },
        data: {
          status: 'ended',
          endTime: new Date()
        }
      })

      res.json({
        success: true,
        data: { session: updatedSession }
      })
    } catch (error) {
      console.error('End session error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to end session'
      })
    }
  }
)

// WebRTC signaling - send signal
router.post('/:id/signal',
  authenticate,
  requireTenant,
  validateTenantAccess,
  sanitizeInput,
  [
    body('signal').notEmpty(),
    body('type').isIn(['offer', 'answer', 'ice-candidate', 'webrtc-signal']),
    body('from').optional().isIn(['patient', 'therapist'])
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params
      const { signal, type, from } = req.body

      const session = await prisma.session.findFirst({
        where: {
          id,
          tenantId: req.tenantId,
          OR: [
            { patientId: req.user.id },
            { therapistId: req.user.id }
          ]
        }
      })

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found or access denied'
        })
      }

      // Add signal to session
      const signalData = {
        signal,
        type,
        from: from || (req.user.roles.includes('therapist') ? 'therapist' : 'patient'),
        timestamp: new Date().toISOString(),
        userId: req.user.id
      }

      await prisma.session.update({
        where: { id },
        data: {
          signals: {
            push: signalData
          }
        }
      })

      res.json({
        success: true,
        data: { message: 'Signal sent successfully' }
      })
    } catch (error) {
      console.error('Send signal error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to send signal'
      })
    }
  }
)

// WebRTC signaling - get signals
router.get('/:id/signals',
  authenticate,
  requireTenant,
  validateTenantAccess,
  [
    query('after').optional().isISO8601()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params
      const { after } = req.query

      const session = await prisma.session.findFirst({
        where: {
          id,
          tenantId: req.tenantId,
          OR: [
            { patientId: req.user.id },
            { therapistId: req.user.id }
          ]
        }
      })

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found or access denied'
        })
      }

      let signals = session.signals || []

      // Filter signals after timestamp if provided
      if (after) {
        signals = signals.filter(signal => 
          new Date(signal.timestamp) > new Date(after)
        )
      }

      // Filter out signals from the same user
      signals = signals.filter(signal => signal.userId !== req.user.id)

      res.json({
        success: true,
        data: { signals }
      })
    } catch (error) {
      console.error('Get signals error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch signals'
      })
    }
  }
)

// Admit patient (therapist only)
router.post('/:id/admit',
  authenticate,
  authorize(['therapist', 'admin']),
  requireTenant,
  validateTenantAccess,
  auditLog('session.patient_admitted'),
  async (req, res) => {
    try {
      const { id } = req.params

      const session = await prisma.session.findFirst({
        where: {
          id,
          tenantId: req.tenantId,
          therapistId: req.user.id
        }
      })

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found or access denied'
        })
      }

      const updatedSession = await prisma.session.update({
        where: { id },
        data: { status: 'active' },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          therapist: {
            select: {
              id: true,
              name: true,
              avatar: true,
              title: true
            }
          }
        }
      })

      res.json({
        success: true,
        data: { session: updatedSession }
      })
    } catch (error) {
      console.error('Admit patient error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to admit patient'
      })
    }
  }
)

// Get session notes
router.get('/:id/notes',
  authenticate,
  requireTenant,
  validateTenantAccess,
  async (req, res) => {
    try {
      const { id } = req.params

      const session = await prisma.session.findFirst({
        where: {
          id,
          tenantId: req.tenantId,
          OR: [
            { patientId: req.user.id },
            { therapistId: req.user.id },
            { tenant: { users: { some: { id: req.user.id, roles: { has: 'admin' } } } } }
          ]
        }
      })

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found or access denied'
        })
      }

      const where = { sessionId: id }

      // Patients can only see notes marked as visible to them
      if (req.user.roles.includes('patient') && !req.user.roles.includes('therapist')) {
        where.isVisibleToPatient = true
      }

      const notes = await prisma.sessionNote.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              title: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      res.json({
        success: true,
        data: { notes }
      })
    } catch (error) {
      console.error('Get session notes error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch session notes'
      })
    }
  }
)

// Create session note (therapist only)
router.post('/:id/notes',
  authenticate,
  authorize(['therapist', 'admin']),
  requireTenant,
  validateTenantAccess,
  sanitizeInput,
  [
    body('content').trim().notEmpty(),
    body('isVisibleToPatient').optional().isBoolean()
  ],
  validateRequest,
  auditLog('session.note_created'),
  async (req, res) => {
    try {
      const { id } = req.params
      const { content, isVisibleToPatient = false } = req.body

      const session = await prisma.session.findFirst({
        where: {
          id,
          tenantId: req.tenantId,
          therapistId: req.user.id
        }
      })

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found or access denied'
        })
      }

      const note = await prisma.sessionNote.create({
        data: {
          content,
          isVisibleToPatient,
          sessionId: id,
          authorId: req.user.id
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              title: true
            }
          }
        }
      })

      res.status(201).json({
        success: true,
        data: { note }
      })
    } catch (error) {
      console.error('Create session note error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create session note'
      })
    }
  }
)

// Update session note
router.patch('/:sessionId/notes/:noteId',
  authenticate,
  authorize(['therapist', 'admin']),
  requireTenant,
  validateTenantAccess,
  sanitizeInput,
  [
    body('content').optional().trim().notEmpty(),
    body('isVisibleToPatient').optional().isBoolean()
  ],
  validateRequest,
  auditLog('session.note_updated'),
  async (req, res) => {
    try {
      const { sessionId, noteId } = req.params
      const updates = req.body

      const note = await prisma.sessionNote.findFirst({
        where: {
          id: noteId,
          sessionId,
          authorId: req.user.id,
          session: {
            tenantId: req.tenantId
          }
        }
      })

      if (!note) {
        return res.status(404).json({
          success: false,
          error: 'Note not found or access denied'
        })
      }

      const updatedNote = await prisma.sessionNote.update({
        where: { id: noteId },
        data: updates,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              title: true
            }
          }
        }
      })

      res.json({
        success: true,
        data: { note: updatedNote }
      })
    } catch (error) {
      console.error('Update session note error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update session note'
      })
    }
  }
)

export default router
