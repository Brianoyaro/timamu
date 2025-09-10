import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { PrismaClient } from '@prisma/client'
import { generateTokens } from '../utils/jwt.js'

const prisma = new PrismaClient()

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/v1/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth callback received for:', profile.emails[0].value)
    
    const email = profile.emails[0].value
    const name = profile.displayName
    const googleId = profile.id
    const avatar = profile.photos[0]?.value

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    })

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            avatar: avatar || user.avatar,
            lastLoginAt: new Date()
          },
          include: { tenant: true }
        })
      } else {
        // Just update last login
        user = await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
          include: { tenant: true }
        })
      }
    } else {
      // Get or create default tenant
      let tenant = await prisma.tenant.upsert({
        where: { domain: 'default.mindlink.com' },
        update: {},
        create: {
          name: 'Default Clinic',
          domain: 'default.mindlink.com',
          status: 'active',
          plan: 'basic'
        }
      })

      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name,
          googleId,
          avatar,
          roles: ['patient'], // Default role for OAuth users
          tenantId: tenant.id,
          status: 'active',
          lastLoginAt: new Date()
        },
        include: { tenant: true }
      })

      console.log('New user created via Google OAuth:', user.email)
    }

    // Generate tokens for the user
    const { accessToken: jwtAccessToken, refreshToken: jwtRefreshToken } = generateTokens(user.id)

    // Store refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: jwtRefreshToken }
    })

    // Remove sensitive data and add tokens
    const { password, refreshToken: storedRefreshToken, ...userResponse } = user
    userResponse.accessToken = jwtAccessToken
    userResponse.refreshToken = jwtRefreshToken

    return done(null, userResponse)
  } catch (error) {
    console.error('Google OAuth error:', error)
    return done(error, null)
  }
}))

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { tenant: true }
    })
    done(null, user)
  } catch (error) {
    done(error, null)
  }
})

export default passport
