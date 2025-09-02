import express from 'express'
import { query } from 'express-validator'
import { PrismaClient } from '@prisma/client'
import { authenticate, authorize } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validation.js'

const router = express.Router()
const prisma = new PrismaClient()

// Get audit logs
router.get('/audit-logs',
  authenticate,
  authorize(['admin']),
  [
    query('action').optional().trim(),
    query('userId').optional().isUUID(),
    query('tenantId').optional().isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { 
        action, 
        userId, 
        tenantId, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 50 
      } = req.query

      const where = {}

      if (action) {
        where.action = { contains: action, mode: 'insensitive' }
      }

      if (userId) where.userId = userId
      if (tenantId) where.tenantId = tenantId

      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = new Date(startDate)
        if (endDate) where.createdAt.lte = new Date(endDate)
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            tenant: {
              select: {
                id: true,
                name: true,
                domain: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: parseInt(limit)
        }),
        prisma.auditLog.count({ where })
      ])

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      })
    } catch (error) {
      console.error('Get audit logs error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audit logs'
      })
    }
  }
)

// Get system statistics
router.get('/stats',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      const [
        totalUsers,
        totalTenants,
        activeSessions,
        totalSessions,
        totalAppointments,
        totalMessages
      ] = await Promise.all([
        prisma.user.count(),
        prisma.tenant.count(),
        prisma.session.count({ where: { status: 'active' } }),
        prisma.session.count(),
        prisma.appointment.count(),
        prisma.message.count()
      ])

      // Get user counts by role
      const usersByRole = await prisma.user.groupBy({
        by: ['roles'],
        _count: true
      })

      // Get tenant stats
      const tenantStats = await prisma.tenant.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          _count: {
            select: {
              users: true,
              sessions: true,
              appointments: true
            }
          }
        }
      })

      res.json({
        success: true,
        data: {
          overview: {
            totalUsers,
            totalTenants,
            activeSessions,
            totalSessions,
            totalAppointments,
            totalMessages
          },
          usersByRole,
          tenantStats
        }
      })
    } catch (error) {
      console.error('Get admin stats error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch system statistics'
      })
    }
  }
)

// Get system health
router.get('/health',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      // Basic health checks
      const dbHealth = await prisma.$queryRaw`SELECT 1 as healthy`
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: dbHealth ? 'connected' : 'disconnected',
        services: {
          api: 'healthy',
          database: dbHealth ? 'healthy' : 'unhealthy',
          email: 'healthy', // Would check SMTP connection in production
          storage: 'healthy' // Would check file storage in production
        }
      }

      res.json({
        success: true,
        data: health
      })
    } catch (error) {
      console.error('Health check error:', error)
      res.status(500).json({
        success: false,
        error: 'Health check failed',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString()
        }
      })
    }
  }
)

export default router
