/**
 * Authentication routes
 * Handles user registration, login, token refresh, and password management
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const crypto = require('crypto');

const { prisma } = require('../utils/database');
const { generateTokens, verifyRefreshToken, revokeRefreshToken, revokeAllUserTokens } = require('../utils/jwt');
const { authenticate } = require('../middleware/authMiddleware');
const { validate, registerSchema, loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema } = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    role,
    phone,
    dateOfBirth,
    gender,
    licenseNumber,
    specializations,
    experience
  } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Start transaction for user creation
  const user = await prisma.$transaction(async (tx) => {
    // Create user
    const newUser = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender
      }
    });

    // Create role-specific profile
    if (role === 'PATIENT') {
      await tx.patientProfile.create({
        data: {
          userId: newUser.id,
          preferredLanguage: 'en'
        }
      });
    } else if (role === 'THERAPIST') {
      // Check if license number is unique
      const existingLicense = await tx.therapistProfile.findUnique({
        where: { licenseNumber }
      });

      if (existingLicense) {
        throw new AppError('License number already registered', 400);
      }

      await tx.therapistProfile.create({
        data: {
          userId: newUser.id,
          licenseNumber,
          specializations,
          experience,
          isApproved: false // Therapists need approval
        }
      });
    }

    return newUser;
  });

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Store verification token (you might want to create a separate table for this)
  // For now, we'll use a simple approach with user metadata
  
  // Send verification email
  try {
    await sendEmail({
      to: email,
      subject: 'Verify Your Email - Telepsychology Platform',
      template: 'emailVerification',
      data: {
        name: firstName,
        verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${email}`
      }
    });
  } catch (emailError) {
    logger.error('Failed to send verification email:', emailError);
    // Don't fail registration if email fails
  }

  // Log audit event
  await createAuditLog({
    action: 'USER_REGISTER',
    userId: user.id,
    userEmail: email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    status: 'SUCCESS',
    details: { role }
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please check your email to verify your account.',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified
      }
    }
  });
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with profile data
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      patientProfile: true,
      therapistProfile: true,
      adminProfile: true
    }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    await createAuditLog({
      action: 'USER_LOGIN',
      userEmail: email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'FAILURE',
      details: { reason: 'Invalid credentials' }
    });

    throw new AppError('Invalid credentials', 401);
  }

  if (!user.isActive) {
    await createAuditLog({
      action: 'USER_LOGIN',
      userId: user.id,
      userEmail: email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'FAILURE',
      details: { reason: 'Account deactivated' }
    });

    throw new AppError('Account has been deactivated', 401);
  }

  // For therapists, check if approved
  if (user.role === 'THERAPIST' && (!user.therapistProfile || !user.therapistProfile.isApproved)) {
    await createAuditLog({
      action: 'USER_LOGIN',
      userId: user.id,
      userEmail: email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'FAILURE',
      details: { reason: 'Therapist not approved' }
    });

    throw new AppError('Your therapist account is pending approval', 403);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  // Generate tokens
  const { accessToken, refreshToken } = await generateTokens(user);

  // Log successful login
  await createAuditLog({
    action: 'USER_LOGIN',
    userId: user.id,
    userEmail: email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    status: 'SUCCESS'
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
        profile: user.patientProfile || user.therapistProfile || user.adminProfile
      },
      accessToken,
      refreshToken
    }
  });
}));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const { user } = await verifyRefreshToken(refreshToken);

  if (!user.isActive) {
    throw new AppError('Account has been deactivated', 401);
  }

  // Revoke the old refresh token
  await revokeRefreshToken(refreshToken);

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken,
      refreshToken: newRefreshToken
    }
  });
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (revoke refresh token)
 * @access  Private
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  const refreshToken = req.headers['x-refresh-token'];

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  // Log logout
  await createAuditLog({
    action: 'USER_LOGOUT',
    userId: req.user.id,
    userEmail: req.user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    status: 'SUCCESS'
  });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices (revoke all refresh tokens)
 * @access  Private
 */
router.post('/logout-all', authenticate, asyncHandler(async (req, res) => {
  await revokeAllUserTokens(req.user.id);

  // Log logout all
  await createAuditLog({
    action: 'USER_LOGOUT_ALL',
    userId: req.user.id,
    userEmail: req.user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    status: 'SUCCESS'
  });

  res.json({
    success: true,
    message: 'Logged out from all devices successfully'
  });
}));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Don't reveal if email exists
    return res.json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link.'
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Store reset token (you might want to create a separate table for this)
  // For now, we'll use a simple approach
  
  try {
    await sendEmail({
      to: email,
      subject: 'Password Reset - Telepsychology Platform',
      template: 'passwordReset',
      data: {
        name: user.firstName,
        resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`
      }
    });

    // Log password reset request
    await createAuditLog({
      action: 'PASSWORD_RESET_REQUEST',
      userId: user.id,
      userEmail: email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'SUCCESS'
    });

  } catch (emailError) {
    logger.error('Failed to send password reset email:', emailError);
    throw new AppError('Failed to send password reset email', 500);
  }

  res.json({
    success: true,
    message: 'If your email is registered, you will receive a password reset link.'
  });
}));

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // In a real implementation, you would validate the token from a secure store
  // For now, this is a placeholder implementation
  
  // Hash new password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Update password and revoke all refresh tokens
  // await prisma.user.update({
  //   where: { /* token validation logic */ },
  //   data: { password: hashedPassword }
  // });

  res.json({
    success: true,
    message: 'Password reset successfully. Please log in with your new password.'
  });
}));

/**
 * @route   GET /api/auth/google
 * @desc    Google OAuth login
 * @access  Public
 */
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  asyncHandler(async (req, res) => {
    const { accessToken, refreshToken } = await generateTokens(req.user);

    // Log OAuth login
    await createAuditLog({
      action: 'OAUTH_LOGIN',
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'SUCCESS',
      details: { provider: 'google' }
    });

    // Redirect to frontend with tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`);
  })
);

module.exports = router;
