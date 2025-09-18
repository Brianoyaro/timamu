/**
 * Lean User routes for NGO telepsychology platform
 * Simplified direct booking without assignment complexity
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { prisma } = require('../utils/database');
const { authenticate, authorize, requireVerified } = require('../middleware/authMiddleware');
const { validate, updateProfileSchema, changePasswordSchema, uuidParamsSchema } = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const { createAuditLog, AUDIT_ACTIONS } = require('../utils/audit');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile (lean schema)
 * @access  Private
 */
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      isVerified: true,
      avatar: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      createdAt: true,
      lastLoginAt: true,
      patientProfile: {
        select: {
          medicalHistory: true,
          emergencyContact: true,
          preferredLanguage: true,
          timezone: true
        }
      },
      therapistProfile: {
        select: {
          licenseNumber: true,
          specializations: true,
          languages: true,
          experience: true,
          education: true,
          biography: true,
          isApproved: true,
          approvedAt: true,
          availability: true,
          timezone: true,
          acceptsEmergency: true
        }
      },
      adminProfile: {
        select: {
          permissions: true,
          level: true
        }
      }
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: { user }
  });
}));

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile (lean schema)
 * @access  Private
 */
router.put('/profile', authenticate, requireVerified, validate(updateProfileSchema), asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    phone,
    dateOfBirth,
    gender,
    avatar,
    // Patient-specific fields
    medicalHistory,
    emergencyContact,
    preferredLanguage,
    // Therapist-specific fields
    specializations,
    languages,
    experience,
    education,
    biography,
    availability,
    acceptsEmergency
  } = req.body;

  // Start transaction to update user and profile
  const updatedUser = await prisma.$transaction(async (tx) => {
    // Update user basic info
    const user = await tx.user.update({
      where: { id: req.user.id },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender: gender || undefined,
        avatar: avatar || undefined
      }
    });

    // Update role-specific profile
    if (req.user.role === 'PATIENT') {
      await tx.patientProfile.upsert({
        where: { userId: req.user.id },
        update: {
          medicalHistory: medicalHistory || undefined,
          emergencyContact: emergencyContact || undefined,
          preferredLanguage: preferredLanguage || undefined
        },
        create: {
          userId: req.user.id,
          medicalHistory: medicalHistory || null,
          emergencyContact: emergencyContact || null,
          preferredLanguage: preferredLanguage || 'en'
        }
      });
    } else if (req.user.role === 'THERAPIST') {
      await tx.therapistProfile.upsert({
        where: { userId: req.user.id },
        update: {
          specializations: specializations || undefined,
          languages: languages || undefined,
          experience: experience || undefined,
          education: education || undefined,
          biography: biography || undefined,
          availability: availability || undefined,
          acceptsEmergency: acceptsEmergency !== undefined ? acceptsEmergency : undefined
        },
        create: {
          userId: req.user.id,
          licenseNumber: `TEMP-${Date.now()}`, // Temporary, should be provided during registration
          specializations: specializations || [],
          languages: languages || ['en'],
          experience: experience || 0,
          education: education || null,
          biography: biography || null,
          availability: availability || null,
          acceptsEmergency: acceptsEmergency || false
        }
      });
    }

    return user;
  });

  // Log audit event
  await createAuditLog({
    action: AUDIT_ACTIONS.USER_UPDATE,
    userId: req.user.id,
    userEmail: req.user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    status: 'SUCCESS',
    details: { updatedFields: Object.keys(req.body) }
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: updatedUser }
  });
}));

/**
 * @route   GET /api/users/therapists
 * @desc    Get approved therapists with search and filtering
 * @access  Private (Patients)
 */
router.get('/therapists', authenticate, authorize(['PATIENT', 'ADMIN']), asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    specialization, 
    language, 
    acceptsEmergency, 
    search 
  } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    role: 'THERAPIST',
    isActive: true,
    therapistProfile: {
      isApproved: true
    }
  };

  // Add search filter
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Add specialization filter
  if (specialization) {
    where.therapistProfile.specializations = { has: specialization };
  }

  // Add language filter
  if (language) {
    where.therapistProfile.languages = { has: language };
  }

  // Add emergency availability filter
  if (acceptsEmergency === 'true') {
    where.therapistProfile.acceptsEmergency = true;
  }

  const [therapists, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        therapistProfile: {
          select: {
            specializations: true,
            languages: true,
            experience: true,
            education: true,
            biography: true,
            availability: true,
            timezone: true,
            acceptsEmergency: true
          }
        },
        // Calculate average rating
        receivedRatings: {
          select: {
            rating: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    }),
    prisma.user.count({ where })
  ]);

  // Add calculated fields
  const enrichedTherapists = therapists.map(therapist => ({
    ...therapist,
    averageRating: therapist.receivedRatings.length > 0 
      ? therapist.receivedRatings.reduce((sum, r) => sum + r.rating, 0) / therapist.receivedRatings.length
      : null,
    totalRatings: therapist.receivedRatings.length,
    receivedRatings: undefined // Remove from response
  }));

  res.json({
    success: true,
    data: {
      therapists: enrichedTherapists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
}));

/**
 * @route   GET /api/users/therapists/:id
 * @desc    Get therapist profile by ID
 * @access  Private
 */
router.get('/therapists/:id', authenticate, validate(uuidParamsSchema, 'params'), asyncHandler(async (req, res) => {
  const therapist = await prisma.user.findFirst({
    where: {
      id: req.params.id,
      role: 'THERAPIST',
      isActive: true,
      therapistProfile: {
        isApproved: true
      }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
      createdAt: true,
      therapistProfile: {
        select: {
          specializations: true,
          languages: true,
          experience: true,
          education: true,
          biography: true,
          availability: true,
          timezone: true,
          acceptsEmergency: true
        }
      },
      receivedRatings: {
        select: {
          rating: true,
          review: true,
          isAnonymous: true,
          giver: {
            select: {
              firstName: true
            }
          },
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!therapist) {
    throw new AppError('Therapist not found', 404);
  }

  // Calculate average rating
  const averageRating = therapist.receivedRatings.length > 0 
    ? therapist.receivedRatings.reduce((sum, r) => sum + r.rating, 0) / therapist.receivedRatings.length
    : null;

  res.json({
    success: true,
    data: { 
      therapist: {
        ...therapist,
        averageRating,
        totalRatings: therapist.receivedRatings.length
      }
    }
  });
}));

/**
 * @route   POST /api/users/sessions
 * @desc    Book a session directly with a therapist (lean approach)
 * @access  Private (Patients only)
 */
router.post('/sessions', authenticate, authorize(['PATIENT']), requireVerified, asyncHandler(async (req, res) => {
  const {
    therapistId,
    scheduledAt,
    sessionType = 'VIDEO',
    title,
    notes,
    isEmergency = false,
    emergencyNotes
  } = req.body;

  // Validate required fields
  if (!therapistId || !scheduledAt || !title) {
    throw new AppError('Missing required fields: therapistId, scheduledAt, title', 400);
  }

  // Check if therapist exists and is approved
  const therapist = await prisma.user.findFirst({
    where: {
      id: therapistId,
      role: 'THERAPIST',
      isActive: true,
      therapistProfile: {
        isApproved: true
      }
    },
    include: {
      therapistProfile: {
        select: {
          acceptsEmergency: true
        }
      }
    }
  });

  if (!therapist) {
    throw new AppError('Therapist not found or not available', 404);
  }

  // Check if therapist accepts emergency sessions
  if (isEmergency && !therapist.therapistProfile.acceptsEmergency) {
    throw new AppError('This therapist does not accept emergency sessions', 400);
  }

  // Validate session time is in the future
  const sessionTime = new Date(scheduledAt);
  if (sessionTime <= new Date()) {
    throw new AppError('Session time must be in the future', 400);
  }

  // Check for conflicting sessions (basic overlap check)
  const conflictingSession = await prisma.session.findFirst({
    where: {
      OR: [
        { therapistId },
        { patientId: req.user.id }
      ],
      scheduledAt: {
        gte: new Date(sessionTime.getTime() - 30 * 60 * 1000), // 30 minutes before
        lte: new Date(sessionTime.getTime() + 90 * 60 * 1000)  // 90 minutes after
      },
      status: {
        in: ['SCHEDULED', 'IN_PROGRESS']
      }
    }
  });

  if (conflictingSession) {
    throw new AppError('Time slot is not available. Please choose a different time.', 409);
  }

  // Create the session
  const session = await prisma.session.create({
    data: {
      patientId: req.user.id,
      therapistId,
      scheduledAt: new Date(scheduledAt),
      sessionType,
      title: title.trim(),
      notes: notes?.trim() || null,
      isEmergency,
      emergencyNotes: isEmergency ? emergencyNotes?.trim() || null : null,
      status: 'SCHEDULED'
    },
    include: {
      therapist: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  // Create audit log
  await createAuditLog({
    action: 'SESSION_BOOKED',
    userId: req.user.id,
    userEmail: req.user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    status: 'SUCCESS',
    details: {
      sessionId: session.id,
      therapistId,
      scheduledAt,
      isEmergency
    }
  });

  logger.info(`Session booked: ${req.user.email} with ${therapist.email} at ${scheduledAt}`);

  res.status(201).json({
    success: true,
    message: 'Session booked successfully',
    data: { session }
  });
}));

/**
 * @route   GET /api/users/sessions
 * @desc    Get user's sessions
 * @access  Private
 */
router.get('/sessions', authenticate, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  
  // Filter by user role
  if (req.user.role === 'PATIENT') {
    where.patientId = req.user.id;
  } else if (req.user.role === 'THERAPIST') {
    where.therapistId = req.user.id;
  } else {
    // Admin can see all sessions
  }

  // Filter by status
  if (status) {
    where.status = status;
  }

  const [sessions, total] = await Promise.all([
    prisma.session.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        rating: {
          select: {
            rating: true,
            review: true
          }
        }
      },
      orderBy: { scheduledAt: 'desc' },
      skip,
      take: parseInt(limit)
    }),
    prisma.session.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
}));

/**
 * @route   PUT /api/users/sessions/:id/cancel
 * @desc    Cancel a session
 * @access  Private
 */
router.put('/sessions/:id/cancel', authenticate, validate(uuidParamsSchema, 'params'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  // Find the session
  const session = await prisma.session.findFirst({
    where: {
      id,
      OR: [
        { patientId: req.user.id },
        { therapistId: req.user.id }
      ],
      status: 'SCHEDULED'
    }
  });

  if (!session) {
    throw new AppError('Session not found or cannot be cancelled', 404);
  }

  // Check if cancellation is too late (less than 2 hours before session)
  const sessionTime = new Date(session.scheduledAt);
  const twoHoursBefore = new Date(sessionTime.getTime() - 2 * 60 * 60 * 1000);
  
  if (new Date() > twoHoursBefore && !session.isEmergency) {
    throw new AppError('Cannot cancel session less than 2 hours before scheduled time', 400);
  }

  // Cancel the session
  await prisma.session.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      notes: reason ? `Cancelled: ${reason}` : 'Cancelled by user'
    }
  });

  // Create audit log
  await createAuditLog({
    action: 'SESSION_CANCELLED',
    userId: req.user.id,
    userEmail: req.user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    status: 'SUCCESS',
    details: {
      sessionId: id,
      reason: reason || 'No reason provided'
    }
  });

  res.json({
    success: true,
    message: 'Session cancelled successfully'
  });
}));

module.exports = router;
