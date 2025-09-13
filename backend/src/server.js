import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import session from 'express-session'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
dotenv.config()

// Import passport configuration
import passport from './config/passport.js'

// Import routes
import authRoutes from './routes/auth.js'
import tenantRoutes from './routes/tenants.js'
import userRoutes from './routes/users.js'
import sessionRoutes from './routes/sessions.js'
import appointmentRoutes from './routes/appointments.js'
import messagingRoutes from './routes/messaging.js'
import assessmentRoutes from './routes/assessments.js'
import adminRoutes from './routes/admin.js'
import emailRoutes from './routes/email.js'
import webhookRoutes from './routes/webhooks.js'

// Import middleware
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { requestLogger } from './middleware/requestLogger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Trust proxy configuration for deployments behind reverse proxies (Render, Heroku, etc.)
app.set('trust proxy', true)

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id']
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(limiter)

// Session configuration for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging
app.use(requestLogger)

// Static file serving for uploads
app.use('/uploads', express.static(join(__dirname, '../uploads')))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    }
  })
})

// API routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/tenants', tenantRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/sessions', sessionRoutes)
app.use('/api/v1/appointments', appointmentRoutes)
app.use('/api/v1/threads', messagingRoutes)
app.use('/api/v1/assessments', assessmentRoutes)
app.use('/api/v1/mood-checkins', assessmentRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/email', emailRoutes)
app.use('/api/v1/webhooks', webhookRoutes)

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MindLink API server running on port ${PORT}`)
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})
