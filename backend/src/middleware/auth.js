import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      })
    }

    const token = authHeader.substring(7)
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          tenant: true
        }
      })

      if (!user || user.status !== 'active') {
        return res.status(401).json({
          success: false,
          error: 'Invalid or inactive user'
        })
      }

      req.user = user
      next()
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired'
        })
      }
      
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      })
    }
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    })
  }
}

export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }

    const userRoles = req.user.roles || []
    const hasPermission = allowedRoles.some(role => userRoles.includes(role))

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      })
    }

    next()
  }
}

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { tenant: true }
        })

        if (user && user.status === 'active') {
          req.user = user
        }
      } catch (jwtError) {
        // Continue without authentication for optional auth
      }
    }
    
    next()
  } catch (error) {
    next()
  }
}
