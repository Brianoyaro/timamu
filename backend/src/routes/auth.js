import express from 'express'
import { body } from 'express-validator'
import rateLimit from 'express-rate-limit'
import { PrismaClient } from '@prisma/client'
import { hashPassword, comparePassword } from '../utils/password.js'
import { generateTokens, verifyRefreshToken, generateResetToken, verifyResetToken } from '../utils/jwt.js'
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email.js'
import { validateRequest, sanitizeInput } from '../middleware/validation.js'
import { authenticate } from '../middleware/auth.js'
import { auditLog } from '../middleware/auditLog.js'

const router = express.Router()
const prisma = new PrismaClient()

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later'
  }
})

// Validation rules
const signUpValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().isLength({ min: 2 }),
  body('role').isIn(['patient', 'therapist']),
  body('tenantId').optional().isUUID()
]

const signInValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
]

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail()
]

const resetPasswordValidation = [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 })
]

// Sign up
router.post('/register', 
  authLimiter,
  sanitizeInput,
  signUpValidation,
  validateRequest,
  auditLog('user.register'),
  async (req, res) => {
    try {
      const { email, password, name, role, tenantId } = req.body

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User already exists with this email'
        })
      }

      // Get or create default tenant
      let tenant
      if (tenantId) {
        tenant = await prisma.tenant.findUnique({
          where: { id: tenantId }
        })
        
        if (!tenant) {
          return res.status(404).json({
            success: false,
            error: 'Tenant not found'
          })
        }
      } else {
        // Create default tenant for new users
        tenant = await prisma.tenant.upsert({
          where: { domain: 'default.mindlink.com' },
          update: {},
          create: {
            name: 'Default Clinic',
            domain: 'default.mindlink.com',
            status: 'active',
            plan: 'basic'
          }
        })
      }

      // Hash password
      const hashedPassword = await hashPassword(password)

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          roles: [role],
          tenantId: tenant.id
        },
        include: {
          tenant: true
        }
      })

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id)

      // Store refresh token
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
      })

      // Send welcome email (async)
      sendWelcomeEmail(user.email, user.name).catch(console.error)

      // Remove sensitive data
      const { password: _, refreshToken: __, ...userResponse } = user

      res.status(201).json({
        success: true,
        data: {
          user: userResponse,
          accessToken,
          refreshToken
        }
      })
    } catch (error) {
      console.error('Sign up error:', error)
      res.status(500).json({
        success: false,
        error: 'Registration failed'
      })
    }
  }
)

// Sign in
router.post('/login',
  authLimiter,
  sanitizeInput,
  signInValidation,
  validateRequest,
  auditLog('user.login'),
  async (req, res) => {
    try {
      console.log('=== LOGIN ATTEMPT ===')
      const { email, password } = req.body
      console.log('Login attempt for email:', email)
      console.log('Request body keys:', Object.keys(req.body))

      // Find user
      console.log('Looking up user in database...')
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          tenant: true
        }
      })

      if (!user) {
        console.log('No user found with email:', email)
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        })
      }

      console.log('User found:', {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        roles: user.roles,
        tenantId: user.tenantId
      })

      // Check password
      console.log('Checking password for user:', email)
      const isValidPassword = await comparePassword(password, user.password)
      console.log('Password validation result:', isValidPassword)
      
      if (!isValidPassword) {
        console.log('Invalid password for user:', email)
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        })
      }

      // Check user status
      console.log('User status check:', user.status)
      if (user.status !== 'active') {
        console.log('User account not active:', email, 'Status:', user.status)
        return res.status(401).json({
          success: false,
          error: 'Account is not active'
        })
      }

      // Generate tokens
      console.log('Generating tokens for user:', user.id)
      const { accessToken, refreshToken } = generateTokens(user.id)
      console.log('Tokens generated successfully')

      // Update user with refresh token and last login
      console.log('Updating user with refresh token and last login')
      await prisma.user.update({
        where: { id: user.id },
        data: {
          refreshToken,
          lastLoginAt: new Date()
        }
      })
      console.log('User updated successfully')

      // Remove sensitive data
      const { password: _, refreshToken: __, ...userResponse } = user
      console.log('Preparing response for user:', userResponse.id)

      res.json({
        success: true,
        data: {
          user: userResponse,
          accessToken,
          refreshToken
        }
      })
      console.log('=== LOGIN SUCCESSFUL ===')
    } catch (error) {
      console.error('=== LOGIN ERROR ===')
      console.error('Sign in error:', error)
      res.status(500).json({
        success: false,
        error: 'Login failed'
      })
    }
  }
)

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required'
      })
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken)
    
    // Find user and validate stored refresh token
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true }
    })

    if (!user || user.refreshToken !== refreshToken || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      })
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id)

    // Update stored refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken }
    })

    // Remove sensitive data
    const { password: _, refreshToken: __, ...userResponse } = user

    res.json({
      success: true,
      data: {
        user: userResponse,
        accessToken,
        refreshToken: newRefreshToken
      }
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(401).json({
      success: false,
      error: 'Token refresh failed'
    })
  }
})

// Sign out
router.post('/logout',
  authenticate,
  auditLog('user.logout'),
  async (req, res) => {
    try {
      // Clear refresh token
      await prisma.user.update({
        where: { id: req.user.id },
        data: { refreshToken: null }
      })

      res.json({
        success: true,
        data: { message: 'Logged out successfully' }
      })
    } catch (error) {
      console.error('Logout error:', error)
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      })
    }
  }
)

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const { password, refreshToken, ...userResponse } = req.user
    
    res.json({
      success: true,
      data: { user: userResponse }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get user information'
    })
  }
})

// Forgot password
router.post('/forgot-password',
  authLimiter,
  sanitizeInput,
  forgotPasswordValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { email } = req.body

      const user = await prisma.user.findUnique({
        where: { email }
      })

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({
          success: true,
          data: { message: 'If an account exists, password reset instructions have been sent' }
        })
      }

      // Generate reset token
      const resetToken = generateResetToken()
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      // Store reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires
        }
      })

      // Send reset email
      await sendPasswordResetEmail(user.email, resetToken)

      res.json({
        success: true,
        data: { message: 'If an account exists, password reset instructions have been sent' }
      })
    } catch (error) {
      console.error('Forgot password error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to process password reset request'
      })
    }
  }
)

// Reset password
router.post('/reset-password',
  authLimiter,
  sanitizeInput,
  resetPasswordValidation,
  validateRequest,
  auditLog('user.password_reset'),
  async (req, res) => {
    try {
      const { token, password } = req.body

      // Verify reset token
      const decoded = verifyResetToken(token)

      // Find user with valid reset token
      const user = await prisma.user.findFirst({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: {
            gt: new Date()
          }
        }
      })

      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token'
        })
      }

      // Hash new password
      const hashedPassword = await hashPassword(password)

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          refreshToken: null // Invalidate all sessions
        }
      })

      res.json({
        success: true,
        data: { message: 'Password reset successful' }
      })
    } catch (error) {
      console.error('Reset password error:', error)
      res.status(500).json({
        success: false,
        error: 'Password reset failed'
      })
    }
  }
)

export default router
