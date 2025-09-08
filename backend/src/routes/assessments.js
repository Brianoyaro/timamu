import express from 'express'
import { body, query } from 'express-validator'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'
import { requireTenant, validateTenantAccess } from '../middleware/tenant.js'
import { validateRequest, sanitizeInput } from '../middleware/validation.js'
import { auditLog } from '../middleware/auditLog.js'

const router = express.Router()
const prisma = new PrismaClient()

// PHQ-9 scoring function
const calculatePHQ9Score = (responses) => {
  const score = Object.values(responses).reduce((sum, value) => sum + parseInt(value), 0)
  
  let severity
  if (score <= 4) severity = 'minimal'
  else if (score <= 9) severity = 'mild'
  else if (score <= 14) severity = 'moderate'
  else if (score <= 19) severity = 'moderately-severe'
  else severity = 'severe'

  return { score, severity }
}

// GAD-7 scoring function
const calculateGAD7Score = (responses) => {
  const score = Object.values(responses).reduce((sum, value) => sum + parseInt(value), 0)
  
  let severity
  if (score <= 4) severity = 'minimal'
  else if (score <= 9) severity = 'mild'
  else if (score <= 14) severity = 'moderate'
  else severity = 'severe'

  return { score, severity }
}

// Get assessments
router.get('/',
  authenticate,
  requireTenant,
  validateTenantAccess,
  [
    query('type').optional().isIn(['phq9', 'gad7', 'custom']),
    query('patientId').optional().isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { type, patientId, startDate, endDate, page = 1, limit = 20 } = req.query

      const where = { tenantId: req.tenantId }
      
      // Role-based filtering
      if (req.user.roles.includes('patient')) {
        where.patientId = req.user.id
      } else if (patientId) {
        where.patientId = patientId
      }

      if (type) where.type = type

      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = new Date(startDate)
        if (endDate) where.createdAt.lte = new Date(endDate)
      }

      const [assessments, total] = await Promise.all([
        prisma.assessment.findMany({
          where,
          include: {
            patient: {
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
        prisma.assessment.count({ where })
      ])

      res.json({
        success: true,
        data: {
          assessments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      })
    } catch (error) {
      console.error('Get assessments error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch assessments'
      })
    }
  }
)

// Submit assessment
router.post('/',
  authenticate,
  requireTenant,
  validateTenantAccess,
  sanitizeInput,
  [
    body('type').isIn(['phq9', 'gad7', 'custom']),
    body('responses').isObject(),
    body('patientId').optional().isUUID()
  ],
  validateRequest,
  auditLog('assessment.submitted'),
  async (req, res) => {
    try {
      const { type, responses, patientId } = req.body

      // Determine patient ID
      const targetPatientId = patientId || req.user.id

      // Check authorization
      if (targetPatientId !== req.user.id && !req.user.roles.includes('therapist') && !req.user.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to submit assessment for this patient'
        })
      }

      // Verify patient exists in tenant
      const patient = await prisma.user.findFirst({
        where: {
          id: targetPatientId,
          tenantId: req.tenantId,
          roles: { has: 'patient' }
        }
      })

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: 'Patient not found'
        })
      }

      // Calculate score based on assessment type
      let score, severity
      
      if (type === 'phq9') {
        const result = calculatePHQ9Score(responses)
        score = result.score
        severity = result.severity
      } else if (type === 'gad7') {
        const result = calculateGAD7Score(responses)
        score = result.score
        severity = result.severity
      }

      const assessment = await prisma.assessment.create({
        data: {
          type,
          responses,
          score,
          severity,
          patientId: targetPatientId,
          tenantId: req.tenantId
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      })

      res.status(201).json({
        success: true,
        data: { assessment }
      })
    } catch (error) {
      console.error('Submit assessment error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to submit assessment'
      })
    }
  }
)

// Get assessment history
router.get('/history',
  authenticate,
  requireTenant,
  validateTenantAccess,
  [
    query('type').optional().isIn(['phq9', 'gad7', 'custom']),
    query('patientId').optional().isUUID(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { type, patientId, limit = 50 } = req.query

      const where = { tenantId: req.tenantId }
      
      // Determine patient ID
      const targetPatientId = patientId || req.user.id

      // Check authorization
      if (targetPatientId !== req.user.id && !req.user.roles.includes('therapist') && !req.user.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to view this patient\'s assessments'
        })
      }

      where.patientId = targetPatientId

      if (type) where.type = type

      const assessments = await prisma.assessment.findMany({
        where,
        select: {
          id: true,
          type: true,
          score: true,
          severity: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit)
      })

      res.json({
        success: true,
        data: { assessments }
      })
    } catch (error) {
      console.error('Get assessment history error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch assessment history'
      })
    }
  }
)

// Get mood check-ins
router.get('/mood-checkins',
  authenticate,
  requireTenant,
  validateTenantAccess,
  [
    query('patientId').optional().isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { patientId, startDate, endDate, limit = 30 } = req.query

      const where = { tenantId: req.tenantId }
      
      // Determine patient ID
      const targetPatientId = patientId || req.user.id

      // Check authorization
      if (targetPatientId !== req.user.id && !req.user.roles.includes('therapist') && !req.user.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to view this patient\'s mood check-ins'
        })
      }

      where.patientId = targetPatientId

      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = new Date(startDate)
        if (endDate) where.createdAt.lte = new Date(endDate)
      }

      const checkins = await prisma.moodCheckin.findMany({
        where,
        select: {
          id: true,
          mood: true,
          notes: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit)
      })

      res.json({
        success: true,
        data: { checkins }
      })
    } catch (error) {
      console.error('Get mood check-ins error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch mood check-ins'
      })
    }
  }
)

// Submit mood check-in
router.post('/mood-checkins',
  authenticate,
  requireTenant,
  validateTenantAccess,
  sanitizeInput,
  [
    body('mood').isInt({ min: 1, max: 5 }),
    body('notes').optional().trim(),
    body('patientId').optional().isUUID()
  ],
  validateRequest,
  auditLog('mood_checkin.submitted'),
  async (req, res) => {
    try {
      const { mood, notes, patientId } = req.body // INSTEAD OF SUBMITTING patientId, WHAT IF WE USE req.user.id WHICH IN TURN MEANS THAT WE ONLY SEND mood AND notes? !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

      // Determine patient ID
      const targetPatientId = patientId || req.user.id

      // Check authorization
      // THIS CHECK IS A LOGICAL ERROR BECAUSE IT EXCLUDES PATIENTS FROM SUBMITTNG MOODCHECKINS AND ALLOWS ADMINS WHO ARE THERAPISTS. !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      // if (!req.user.roles.includes('patient')) // THIS IS CORRECT ACCORDING TO ME.
      if (targetPatientId !== req.user.id && !req.user.roles.includes('therapist') && !req.user.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to submit mood check-in for this patient'
        })
      }

      const checkin = await prisma.moodCheckin.create({
        data: {
          mood,
          notes,
          patientId: targetPatientId,
          tenantId: req.tenantId // IS THIS EVEN VALID? OR, SHOULD WE INSTEAD  USE req.user.tenantId? !!!!!!!!!!!!!!!!!!
        }
      })

      res.status(201).json({
        success: true,
        data: { checkin }
      })
    } catch (error) {
      console.error('Submit mood check-in error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to submit mood check-in'
      })
    }
  }
)

export default router
