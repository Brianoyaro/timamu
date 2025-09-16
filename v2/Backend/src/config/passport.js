/**
 * Passport configuration for Google OAuth
 * Handles Google authentication strategy
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { prisma } = require('../utils/database');
const logger = require('../utils/logger');

console.log('🔧 Passport: Configuring Google OAuth strategy');
console.log('🔧 Passport: Google Client ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('🔧 Passport: Google Client Secret exists:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log('🔧 Passport: Callback URL:', 'https://timamu-v2-backend.onrender.com/api/auth/google/callback');

// Configure Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'https://timamu-v2-backend.onrender.com/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔧 Passport: Google OAuth callback triggered');
    console.log('🔧 Passport: Google profile received:', {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName
    });

    const email = profile.emails[0].value;
    const googleId = profile.id;
    const firstName = profile.name.givenName;
    const lastName = profile.name.familyName;
    const avatar = profile.photos[0]?.value;

    console.log('🔧 Passport: Looking for existing user with email:', email, 'or Google ID:', googleId);
    
    // Check if user already exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { googleId }
        ]
      },
      include: {
        patientProfile: true,
        therapistProfile: true,
        adminProfile: true
      }
    });

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId },
          include: {
            patientProfile: true,
            therapistProfile: true,
            adminProfile: true
          }
        });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      return done(null, user);
    }

    // Create new user
    user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          googleId,
          firstName,
          lastName,
          avatar,
          role: 'PATIENT', // Default role for OAuth users
          isActive: true,
          isVerified: true, // Google accounts are considered verified
          lastLoginAt: new Date()
        }
      });

      // Create patient profile for new OAuth users
      await tx.patientProfile.create({
        data: {
          userId: newUser.id,
          preferredLanguage: 'en'
        }
      });

      return await tx.user.findUnique({
        where: { id: newUser.id },
        include: {
          patientProfile: true,
          therapistProfile: true,
          adminProfile: true
        }
      });
    });

    logger.info(`New user created via Google OAuth: ${email}`);
    return done(null, user);

  } catch (error) {
    logger.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        patientProfile: true,
        therapistProfile: true,
        adminProfile: true
      }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
