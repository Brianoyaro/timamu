import express from 'express'
import { body, query } from 'express-validator'
import multer from 'multer'
import { PrismaClient } from '@prisma/client'
import { authenticate, authorize } from '../middleware/auth.js'
import { requireTenant, validateTenantAccess } from '../middleware/tenant.js'
import { validateRequest, sanitizeInput } from '../middleware/validation.js'
import { auditLog } from '../middleware/auditLog.js'

const router = express.Router()
const prisma = new PrismaClient()

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/avatars/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

// Get users (with role filtering)
router.get('/',
  authenticate,
  requireTenant,
  validateTenantAccess,
  [
    query('role').optional().isIn(['patient', 'therapist', 'admin']),
    query('status').optional().isIn(['active', 'inactive', 'suspended']),
    query('search').optional().trim(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { role, status, search, page = 1, limit = 20 } = req.query

      const where = { tenantId: req.tenantId }
      
      if (role) {
        where.roles = { has: role }
      }
      
      if (status) {
        where.status = status
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            roles: true,
            status: true,
            title: true,
            bio: true,
            specializations: true,
            languages: true,
            rating: true,
            reviewCount: true,
            sessionRate: true,
            lastLoginAt: true,
            createdAt: true
          },
          orderBy: { name: 'asc' },
          skip: (page - 1) * limit,
          take: parseInt(limit)
        }),
        prisma.user.count({ where })
      ])

      // Ensure arrays are never null
      const sanitizedUsers = users.map(user => ({
        ...user,
        specializations: user.specializations || [],
        languages: user.languages || [],
        roles: user.roles || []
      }))

      res.json({
        success: true,
        data: {
          users: sanitizedUsers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      })
    } catch (error) {
      console.error('Get users error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users'
      })
    }
  }
)

// Get user by ID
router.get('/:id',
  authenticate,
  requireTenant,
  validateTenantAccess,
  async (req, res) => {
    try {
      const { id } = req.params

      const user = await prisma.user.findFirst({
        where: {
          id,
          tenantId: req.tenantId
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          phone: true,
          dateOfBirth: true,
          roles: true,
          status: true,
          title: true,
          bio: true,
          specializations: true,
          languages: true,
          education: true,
          licenses: true,
          experience: true,
          rating: true,
          reviewCount: true,
          sessionRate: true,
          emergencyContact: true,
          goals: true,
          preferences: true,
          createdAt: true,
          updatedAt: true
        }
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        })
      }

      // Ensure arrays are never null
      const sanitizedUser = {
        ...user,
        specializations: user.specializations || [],
        languages: user.languages || [],
        roles: user.roles || []
      }

      res.json({
        success: true,
        data: { user: sanitizedUser }
      })
    } catch (error) {
      console.error('Get user error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user'
      })
    }
  }
)

// Update user profile
router.patch('/:id',
  authenticate,
  requireTenant,
  validateTenantAccess,
  sanitizeInput,
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('phone').optional().trim(),
    body('dateOfBirth').optional().isISO8601(),
    body('title').optional().trim(),
    body('bio').optional().trim(),
    body('specializations').optional().isArray(),
    body('languages').optional().isArray(),
    body('education').optional().trim(),
    body('licenses').optional().trim(),
    body('experience').optional().isInt({ min: 0 }),
    body('sessionRate').optional().trim(),
    body('emergencyContact').optional().trim(),
    body('goals').optional().trim(),
    body('preferences').optional().trim()
  ],
  validateRequest,
  auditLog('user.updated'),
  async (req, res) => {
    try {
      const { id } = req.params
      const updates = req.body

      // Users can only update their own profile unless they're admin
      if (req.user.id !== id && !req.user.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          error: 'Can only update your own profile'
        })
      }

      const user = await prisma.user.update({
        where: {
          id,
          tenantId: req.tenantId
        },
        data: updates,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          phone: true,
          dateOfBirth: true,
          roles: true,
          status: true,
          title: true,
          bio: true,
          specializations: true,
          languages: true,
          education: true,
          licenses: true,
          experience: true,
          rating: true,
          reviewCount: true,
          sessionRate: true,
          emergencyContact: true,
          goals: true,
          preferences: true,
          updatedAt: true
        }
      })

      res.json({
        success: true,
        data: { user }
      })
    } catch (error) {
      console.error('Update user error:', error)
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        })
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update user'
      })
    }
  }
)

// Update user roles (admin only)
router.patch('/:id/roles',
  authenticate,
  authorize(['admin']),
  requireTenant,
  validateTenantAccess,
  sanitizeInput,
  [
    body('roles').isArray().custom((roles) => {
      const validRoles = ['patient', 'therapist', 'admin']
      return roles.every(role => validRoles.includes(role))
    })
  ],
  validateRequest,
  auditLog('user.roles_updated'),
  async (req, res) => {
    try {
      const { id } = req.params
      const { roles } = req.body

      const user = await prisma.user.update({
        where: {
          id,
          tenantId: req.tenantId
        },
        data: { roles },
        select: {
          id: true,
          email: true,
          name: true,
          roles: true,
          updatedAt: true
        }
      })

      res.json({
        success: true,
        data: { user }
      })
    } catch (error) {
      console.error('Update user roles error:', error)
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        })
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update user roles'
      })
    }
  }
)

// Upload avatar
router.post('/me/avatar',
  authenticate,
  upload.single('file'),
  auditLog('user.avatar_updated'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        })
      }

      // In production, you'd upload to cloud storage (S3, Cloudinary, etc.)
      const avatarUrl = `/uploads/avatars/${req.file.filename}`

      await prisma.user.update({
        where: { id: req.user.id },
        data: { avatar: avatarUrl }
      })

      res.json({
        success: true,
        data: { url: avatarUrl }
      })
    } catch (error) {
      console.error('Avatar upload error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to upload avatar'
      })
    }
  }
)

// Request data export
router.post('/me/data-export',
  authenticate,
  auditLog('user.data_export_requested'),
  async (req, res) => {
    try {
      // In production, this would trigger a background job
      // to compile user data and send via email
      
      res.json({
        success: true,
        data: { 
          message: 'Data export request received. You will receive an email with your data within 24 hours.',
          requestId: `export_${req.user.id}_${Date.now()}`
        }
      })
    } catch (error) {
      console.error('Data export error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to process data export request'
      })
    }
  }
)

// Request account deletion
router.post('/me/data-delete',
  authenticate,
  auditLog('user.deletion_requested'),
  async (req, res) => {
    try {
      // In production, this would trigger a background job
      // to handle account deletion with proper data retention policies
      
      res.json({
        success: true,
        data: { 
          message: 'Account deletion request received. You will receive a confirmation email.',
          requestId: `delete_${req.user.id}_${Date.now()}`
        }
      })
    } catch (error) {
      console.error('Account deletion error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to process deletion request'
      })
    }
  }
)

export default router
