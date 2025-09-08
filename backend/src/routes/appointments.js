import express from 'express'
import { body, query } from 'express-validator'
import { PrismaClient } from '@prisma/client'
import { authenticate, authorize } from '../middleware/auth.js'
import { requireTenant, validateTenantAccess } from '../middleware/tenant.js'
import { validateRequest, sanitizeInput } from '../middleware/validation.js'
import { auditLog } from '../middleware/auditLog.js'

const router = express.Router()
const prisma = new PrismaClient()

// Get appointments
router.get('/',
  authenticate,
  requireTenant,
  validateTenantAccess,
  [
    query('status').optional().isIn(['scheduled', 'confirmed', 'cancelled', 'completed', 'no-show']),
    query('patientId').optional().isUUID(),
    query('therapistId').optional().isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { 
        status, 
        patientId, 
        therapistId, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 20 
      } = req.query

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

      if (startDate || endDate) {
        where.datetime = {}
        if (startDate) where.datetime.gte = new Date(startDate)
        if (endDate) where.datetime.lte = new Date(endDate)
      }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
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
            session: {
              select: {
                id: true,
                status: true
              }
            }
          },
          orderBy: { datetime: 'asc' },
          skip: (page - 1) * limit,
          take: parseInt(limit)
        }),
        prisma.appointment.count({ where })
      ])

      res.json({
        success: true,
        data: {
          appointments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      })
    } catch (error) {
      console.error('Get appointments error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch appointments'
      })
    }
  }
)

// Get appointment details
router.get('/:id',
  authenticate,
  requireTenant,
  validateTenantAccess,
  async (req, res) => {
    try {
      const { id } = req.params

      const appointment = await prisma.appointment.findFirst({
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
              email: true,
              phone: true
            }
          },
          therapist: {
            select: {
              id: true,
              name: true,
              avatar: true,
              title: true,
              specializations: true
            }
          },
          session: {
            select: {
              id: true,
              status: true,
              startTime: true,
              endTime: true
            }
          }
        }
      })

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found'
        })
      }

      res.json({
        success: true,
        data: { appointment }
      })
    } catch (error) {
      console.error('Get appointment error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch appointment'
      })
    }
  }
)

// Create appointment
router.post('/',
  authenticate,
  requireTenant,
  validateTenantAccess,
  sanitizeInput,
  [
    body('patientId').isUUID(),
    body('therapistId').isUUID(),
    body('datetime').isISO8601(),
    body('duration').optional().isInt({ min: 15, max: 180 }),
    body('type').optional().isIn(['therapy', 'consultation', 'assessment']),
    body('notes').optional().trim()
  ],
  validateRequest,
  auditLog('appointment.created'),
  async (req, res) => {
    try {
      const { patientId, therapistId, datetime, duration = 60, type = 'therapy', notes } = req.body

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
          error: 'Not authorized to create this appointment'
        })
      }

      // Check for scheduling conflicts
      const appointmentStart = new Date(datetime)
      const appointmentEnd = new Date(appointmentStart.getTime() + duration * 60 * 1000)

      const conflicts = await prisma.appointment.findMany({
        where: {
          tenantId: req.tenantId,
          therapistId,
          status: { in: ['scheduled', 'confirmed'] },
          datetime: {
            lt: appointmentEnd
          },
          // Check if appointment end time is after the start of new appointment
          AND: {
            datetime: {
              gte: new Date(appointmentStart.getTime() - 60 * 60 * 1000) // 1 hour buffer
            }
          }
        }
      })

      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Therapist is not available at this time'
        })
      }

      const appointment = await prisma.appointment.create({
        data: {
          patientId,
          therapistId,
          datetime: appointmentStart,
          duration,
          type,
          notes,
          tenantId: req.tenantId,
          status: 'scheduled'
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
          }
        }
      })

      res.status(201).json({
        success: true,
        data: { appointment }
      })
    } catch (error) {
      console.error('Create appointment error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create appointment'
      })
    }
  }
)

// Update appointment
router.patch('/:id',
  authenticate,
  requireTenant,
  validateTenantAccess,
  sanitizeInput,
  [
    body('datetime').optional().isISO8601(),
    body('duration').optional().isInt({ min: 15, max: 180 }),
    body('status').optional().isIn(['scheduled', 'confirmed', 'cancelled', 'completed', 'no-show']),
    body('notes').optional().trim(),
    body('cancellationReason').optional().trim()
  ],
  validateRequest,
  auditLog('appointment.updated'),
  async (req, res) => {
    try {
      const { id } = req.params
      const updates = req.body

      const appointment = await prisma.appointment.findFirst({
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

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found or access denied'
        })
      }

      // If rescheduling, check for conflicts
      if (updates.datetime) {
        const appointmentStart = new Date(updates.datetime)
        const duration = updates.duration || appointment.duration
        const appointmentEnd = new Date(appointmentStart.getTime() + duration * 60 * 1000)

        const conflicts = await prisma.appointment.findMany({
          where: {
            tenantId: req.tenantId,
            therapistId: appointment.therapistId,
            id: { not: id },
            status: { in: ['scheduled', 'confirmed'] },
            datetime: {
              lt: appointmentEnd,
              gte: new Date(appointmentStart.getTime() - 60 * 60 * 1000)
            }
          }
        })

        if (conflicts.length > 0) {
          return res.status(409).json({
            success: false,
            error: 'Therapist is not available at this time'
          })
        }
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: updates,
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
          }
        }
      })

      res.json({
        success: true,
        data: { appointment: updatedAppointment }
      })
    } catch (error) {
      console.error('Update appointment error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update appointment'
      })
    }
  }
)

// Delete appointment
router.delete('/:id',
  authenticate,
  requireTenant,
  validateTenantAccess,
  auditLog('appointment.deleted'),
  async (req, res) => {
    try {
      const { id } = req.params

      const appointment = await prisma.appointment.findFirst({
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

      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found or access denied'
        })
      }

      await prisma.appointment.delete({
        where: { id }
      })

      res.json({
        success: true,
        data: { message: 'Appointment deleted successfully' }
      })
    } catch (error) {
      console.error('Delete appointment error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to delete appointment'
      })
    }
  }
)

// Get therapist availability
router.get('/therapists/:therapistId/availability',
  authenticate,
  requireTenant,
  validateTenantAccess,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { therapistId } = req.params
      const { startDate, endDate } = req.query

      const therapist = await prisma.user.findFirst({
        where: {
          id: therapistId,
          tenantId: req.tenantId,
          roles: { has: 'therapist' }
        }
      })

      if (!therapist) {
        return res.status(404).json({
          success: false,
          error: 'Therapist not found'
        })
      }

      const availability = await prisma.availability.findMany({
        where: {
          therapistId,
          isActive: true
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      })

      // Get existing appointments in date range
      const appointmentWhere = {
        therapistId,
        tenantId: req.tenantId,
        status: { in: ['scheduled', 'confirmed'] }
      }

      if (startDate || endDate) {
        appointmentWhere.datetime = {}
        if (startDate) appointmentWhere.datetime.gte = new Date(startDate)
        if (endDate) appointmentWhere.datetime.lte = new Date(endDate)
      }

      const existingAppointments = await prisma.appointment.findMany({
        where: appointmentWhere,
        select: {
          datetime: true,
          duration: true
        }
      })

      res.json({
        success: true,
        data: {
          availability,
          existingAppointments
        }
      })
    } catch (error) {
      console.error('Get availability error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch availability'
      })
    }
  }
)

// Set therapist availability
router.post('/therapists/:therapistId/availability',
  authenticate,
  requireTenant,
  validateTenantAccess,
  sanitizeInput,
  [
    body('availability').isArray(),
    body('availability.*.dayOfWeek').isInt({ min: 0, max: 6 }),
    body('availability.*.startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('availability.*.endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  ],
  validateRequest,
  auditLog('therapist.availability_updated'),
  async (req, res) => {
    try {
      const { therapistId } = req.params
      const { availability } = req.body

      // Check authorization
      if (req.user.id !== therapistId && !req.user.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          error: 'Can only update your own availability'
        })
      }

      const therapist = await prisma.user.findFirst({
        where: {
          id: therapistId,
          tenantId: req.tenantId,
          roles: { has: 'therapist' }
        }
      })

      if (!therapist) {
        return res.status(404).json({
          success: false,
          error: 'Therapist not found'
        })
      }

      // Delete existing availability
      await prisma.availability.deleteMany({
        where: { therapistId }
      })

      // Create new availability slots
      const availabilityData = availability.map(slot => ({
        ...slot,
        therapistId
      }))

      await prisma.availability.createMany({
        data: availabilityData
      })

      const updatedAvailability = await prisma.availability.findMany({
        where: { therapistId },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      })

      res.json({
        success: true,
        data: { availability: updatedAvailability }
      })
    } catch (error) {
      console.error('Set availability error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update availability'
      })
    }
  }
)

export default router
