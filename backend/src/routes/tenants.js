import express from 'express'
import { body, query } from 'express-validator'
import { PrismaClient } from '@prisma/client'
import { authenticate, authorize } from '../middleware/auth.js'
import { validateRequest, sanitizeInput } from '../middleware/validation.js'
import { auditLog } from '../middleware/auditLog.js'

const router = express.Router()
const prisma = new PrismaClient()

// Get user's tenants
router.get('/',
  authenticate,
  async (req, res) => {
    try {
      let tenants

      if (req.user.roles.includes('admin')) {
        // Admins can see all tenants
        tenants = await prisma.tenant.findMany({
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: {
                users: true,
                sessions: true,
                appointments: true
              }
            }
          }
        })
      } else {
        // Regular users only see their tenant
        tenants = await prisma.tenant.findMany({
          where: { id: req.user.tenantId },
          include: {
            _count: {
              select: {
                users: true,
                sessions: true,
                appointments: true
              }
            }
          }
        })
      }

      res.json({
        success: true,
        data: { tenants }
      })
    } catch (error) {
      console.error('Get tenants error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tenants'
      })
    }
  }
)

// Get tenant details
router.get('/:id',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params

      // Check access permissions
      if (!req.user.roles.includes('admin') && req.user.tenantId !== id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this tenant'
        })
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true,
              sessions: true,
              appointments: true,
              messages: true
            }
          }
        }
      })

      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found'
        })
      }

      res.json({
        success: true,
        data: { tenant }
      })
    } catch (error) {
      console.error('Get tenant error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tenant'
      })
    }
  }
)

// Create tenant (admin only)
router.post('/',
  authenticate,
  authorize(['admin']),
  sanitizeInput,
  [
    body('name').trim().isLength({ min: 2 }),
    body('domain').trim().isLength({ min: 3 }),
    body('plan').optional().isIn(['basic', 'professional', 'enterprise'])
  ],
  validateRequest,
  auditLog('tenant.created'),
  async (req, res) => {
    try {
      const { name, domain, plan = 'basic', settings = {} } = req.body

      const tenant = await prisma.tenant.create({
        data: {
          name,
          domain,
          plan,
          settings
        }
      })

      res.status(201).json({
        success: true,
        data: { tenant }
      })
    } catch (error) {
      console.error('Create tenant error:', error)
      
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: 'Domain already exists'
        })
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create tenant'
      })
    }
  }
)

// Update tenant
router.patch('/:id',
  authenticate,
  authorize(['admin']),
  sanitizeInput,
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('domain').optional().trim().isLength({ min: 3 }),
    body('status').optional().isIn(['active', 'inactive', 'suspended']),
    body('plan').optional().isIn(['basic', 'professional', 'enterprise']),
    body('settings').optional().isObject()
  ],
  validateRequest,
  auditLog('tenant.updated'),
  async (req, res) => {
    try {
      const { id } = req.params
      const updates = req.body

      const tenant = await prisma.tenant.update({
        where: { id },
        data: updates
      })

      res.json({
        success: true,
        data: { tenant }
      })
    } catch (error) {
      console.error('Update tenant error:', error)
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found'
        })
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update tenant'
      })
    }
  }
)

// Delete tenant (admin only)
router.delete('/:id',
  authenticate,
  authorize(['admin']),
  auditLog('tenant.deleted'),
  async (req, res) => {
    try {
      const { id } = req.params

      await prisma.tenant.delete({
        where: { id }
      })

      res.json({
        success: true,
        data: { message: 'Tenant deleted successfully' }
      })
    } catch (error) {
      console.error('Delete tenant error:', error)
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found'
        })
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete tenant'
      })
    }
  }
)

// Get tenant users
router.get('/:id/users',
  authenticate,
  authorize(['admin']),
  [
    query('role').optional().isIn(['patient', 'therapist', 'admin']),
    query('status').optional().isIn(['active', 'inactive', 'suspended']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params
      const { role, status, page = 1, limit = 20 } = req.query

      const where = { tenantId: id }
      
      if (role) {
        where.roles = { has: role }
      }
      
      if (status) {
        where.status = status
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
            lastLoginAt: true,
            createdAt: true
          },
          orderBy: { name: 'asc' },
          skip: (page - 1) * limit,
          take: parseInt(limit)
        }),
        prisma.user.count({ where })
      ])

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      })
    } catch (error) {
      console.error('Get tenant users error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tenant users'
      })
    }
  }
)

export default router
