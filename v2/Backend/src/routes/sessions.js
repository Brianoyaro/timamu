/**
 * Session routes
 * Handles therapy session booking, management, and video conferencing
 */

const express = require('express');
const { prisma } = require('../utils/database');
const { authenticate, authorize, requireVerified, checkResourceAccess } = require('../middleware/authMiddleware');
const { validate, createSessionSchema, updateSessionSchema, uuidSchema, paginationSchema } = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const { createAuditLog, AUDIT_ACTIONS } = require('../utils/audit');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Check if user can access session
 */
const canAccessSession = async (user, params) => {
  const session = await prisma.session.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      therapist: true
    }
  });

  if (!session) return false;

  // Users can access their own sessions
  if (session.patientId === user.id || session.therapistId === user.id) {
    return true;
  }

  // Admins can access all sessions
  if (user.role === 'ADMIN') {
    return true;
  }

  return false;
};

/**
 * @route   POST /api/sessions
 * @desc    Create a new therapy session
 * @access  Private (Patients only)
 */
router.post('/', 
  authenticate, 
  authorize(['PATIENT']), 
  requireVerified,
  validate(createSessionSchema),
  asyncHandler(async (req, res) => {
    const { therapistId, scheduledAt, sessionType, notes } = req.body;

    // Verify therapist exists and is approved
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
        therapistProfile: true
      }
    });

    if (!therapist) {
      throw new AppError('Therapist not found or not available', 404);
    }

    // Check if patient has this therapist assigned
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (patientProfile?.assignedTherapistId !== therapist.therapistProfile.id) {
      throw new AppError('You can only book sessions with your assigned therapist', 400);
    }

    // Check for scheduling conflicts
    const conflictingSession = await prisma.session.findFirst({
      where: {
        OR: [
          { patientId: req.user.id },
          { therapistId: therapistId }
        ],
        scheduledAt: new Date(scheduledAt),
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS']
        }
      }
    });

    if (conflictingSession) {
      throw new AppError('Time slot is not available', 400);
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        patientId: req.user.id,
        therapistId,
        scheduledAt: new Date(scheduledAt),
        sessionType,
        notes,
        status: 'SCHEDULED',
        cost: therapist.therapistProfile.hourlyRate
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Send notification emails
    try {
      // Email to patient
      await sendEmail({
        to: session.patient.email,
        template: 'sessionReminder',
        data: {
          patientName: session.patient.firstName,
          therapistName: `${session.therapist.firstName} ${session.therapist.lastName}`,
          sessionDateTime: new Date(scheduledAt).toLocaleString(),
          sessionType,
          sessionLink: `${process.env.FRONTEND_URL}/sessions/${session.id}`
        }
      });

      // Email to therapist
      await sendEmail({
        to: session.therapist.email,
        template: 'sessionInvitation',
        data: {
          recipientName: session.therapist.firstName,
          sessionId: session.id,
          sessionDateTime: new Date(scheduledAt).toLocaleString(),
          sessionType,
          sessionLink: `${process.env.FRONTEND_URL}/sessions/${session.id}`
        }
      });
    } catch (emailError) {
      logger.error('Failed to send session notification emails:', emailError);
      // Don't fail session creation if email fails
    }

    // Log audit event
    await createAuditLog({
      action: AUDIT_ACTIONS.SESSION_CREATE,
      userId: req.user.id,
      userEmail: req.user.email,
      resource: 'SESSION',
      resourceId: session.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'SUCCESS',
      details: { therapistId, scheduledAt, sessionType }
    });

    res.status(201).json({
      success: true,
      message: 'Session scheduled successfully',
      data: { session }
    });
  })
);

/**
 * @route   GET /api/sessions
 * @desc    Get user's sessions
 * @access  Private
 */
router.get('/', 
  authenticate, 
  requireVerified,
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, sortBy = 'scheduledAt', sortOrder } = req.query;
    const { status, upcoming } = req.query;
    const skip = (page - 1) * limit;

    let where = {};

    // Filter by user role
    if (req.user.role === 'PATIENT') {
      where.patientId = req.user.id;
    } else if (req.user.role === 'THERAPIST') {
      where.therapistId = req.user.id;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter upcoming sessions
    if (upcoming === 'true') {
      where.scheduledAt = { gte: new Date() };
      where.status = { in: ['SCHEDULED', 'IN_PROGRESS'] };
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true
            }
          },
          therapist: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true
            }
          },
          _count: {
            select: {
              messages: true,
              files: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.session.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  })
);

/**
 * @route   GET /api/sessions/:id
 * @desc    Get session by ID
 * @access  Private
 */
router.get('/:id', 
  authenticate, 
  requireVerified,
  validate(uuidSchema, 'params'),
  checkResourceAccess(canAccessSession),
  asyncHandler(async (req, res) => {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        files: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            size: true,
            createdAt: true,
            uploader: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        sessionNotes: {
          where: req.user.role === 'THERAPIST' ? {} : { isPrivate: false },
          include: {
            therapist: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    res.json({
      success: true,
      data: { session }
    });
  })
);

/**
 * @route   PUT /api/sessions/:id
 * @desc    Update session
 * @access  Private
 */
router.put('/:id', 
  authenticate, 
  requireVerified,
  validate(uuidSchema, 'params'),
  validate(updateSessionSchema),
  checkResourceAccess(canAccessSession),
  asyncHandler(async (req, res) => {
    const { scheduledAt, status, notes } = req.body;

    const currentSession = await prisma.session.findUnique({
      where: { id: req.params.id }
    });

    if (!currentSession) {
      throw new AppError('Session not found', 404);
    }

    // Only allow certain status changes based on user role
    if (status) {
      if (req.user.role === 'PATIENT' && !['CANCELLED'].includes(status)) {
        throw new AppError('Patients can only cancel sessions', 403);
      }
      if (req.user.role === 'THERAPIST' && !['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
        throw new AppError('Invalid status transition', 400);
      }
    }

    // Update session
    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: {
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
        startedAt: status === 'IN_PROGRESS' && !currentSession.startedAt ? new Date() : undefined,
        endedAt: status === 'COMPLETED' && !currentSession.endedAt ? new Date() : undefined,
        duration: status === 'COMPLETED' && currentSession.startedAt 
          ? Math.round((new Date() - currentSession.startedAt) / (1000 * 60)) 
          : undefined
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Log audit event
    await createAuditLog({
      action: AUDIT_ACTIONS.SESSION_UPDATE,
      userId: req.user.id,
      userEmail: req.user.email,
      resource: 'SESSION',
      resourceId: session.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'SUCCESS',
      details: { changes: req.body }
    });

    res.json({
      success: true,
      message: 'Session updated successfully',
      data: { session }
    });
  })
);

/**
 * @route   POST /api/sessions/:id/join
 * @desc    Join a session (start video call)
 * @access  Private
 */
router.post('/:id/join', 
  authenticate, 
  requireVerified,
  validate(uuidSchema, 'params'),
  checkResourceAccess(canAccessSession),
  asyncHandler(async (req, res) => {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id }
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.status !== 'SCHEDULED' && session.status !== 'IN_PROGRESS') {
      throw new AppError('Session is not available to join', 400);
    }

    // Check if session time is appropriate (within 15 minutes of scheduled time)
    const now = new Date();
    const scheduledTime = new Date(session.scheduledAt);
    const timeDiff = Math.abs(now - scheduledTime) / (1000 * 60); // difference in minutes

    if (timeDiff > 15 && session.status === 'SCHEDULED') {
      throw new AppError('Session can only be joined within 15 minutes of scheduled time', 400);
    }

    // Update session status if not already in progress
    if (session.status === 'SCHEDULED') {
      await prisma.session.update({
        where: { id: req.params.id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date()
        }
      });
    }

    // Log audit event
    await createAuditLog({
      action: AUDIT_ACTIONS.SESSION_JOIN,
      userId: req.user.id,
      userEmail: req.user.email,
      resource: 'SESSION',
      resourceId: session.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'SUCCESS'
    });

    // In a real implementation, you would generate WebRTC connection details here
    const sessionData = {
      sessionId: session.id,
      participantId: req.user.id,
      // WebRTC configuration would go here
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ],
      joinedAt: new Date()
    };

    res.json({
      success: true,
      message: 'Joined session successfully',
      data: sessionData
    });
  })
);

/**
 * @route   POST /api/sessions/:id/leave
 * @desc    Leave a session
 * @access  Private
 */
router.post('/:id/leave', 
  authenticate, 
  requireVerified,
  validate(uuidSchema, 'params'),
  checkResourceAccess(canAccessSession),
  asyncHandler(async (req, res) => {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id }
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    // Log audit event
    await createAuditLog({
      action: AUDIT_ACTIONS.SESSION_LEAVE,
      userId: req.user.id,
      userEmail: req.user.email,
      resource: 'SESSION',
      resourceId: session.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'SUCCESS'
    });

    res.json({
      success: true,
      message: 'Left session successfully'
    });
  })
);

/**
 * @route   POST /api/sessions/:id/notes
 * @desc    Add session notes (therapists only)
 * @access  Private (Therapists only)
 */
router.post('/:id/notes', 
  authenticate, 
  authorize(['THERAPIST']),
  requireVerified,
  validate(uuidSchema, 'params'),
  checkResourceAccess(canAccessSession),
  asyncHandler(async (req, res) => {
    const { content, isPrivate = true } = req.body;

    if (!content || content.trim().length === 0) {
      throw new AppError('Note content is required', 400);
    }

    const therapistProfile = await prisma.therapistProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!therapistProfile) {
      throw new AppError('Therapist profile not found', 404);
    }

    const note = await prisma.sessionNote.create({
      data: {
        sessionId: req.params.id,
        therapistId: therapistProfile.id,
        content: content.trim(),
        isPrivate
      },
      include: {
        therapist: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Session note added successfully',
      data: { note }
    });
  })
);

/**
 * @route   GET /api/sessions/stats
 * @desc    Get session statistics
 * @access  Private
 */
router.get('/stats', 
  authenticate, 
  requireVerified,
  asyncHandler(async (req, res) => {
    let where = {};

    // Filter by user role
    if (req.user.role === 'PATIENT') {
      where.patientId = req.user.id;
    } else if (req.user.role === 'THERAPIST') {
      where.therapistId = req.user.id;
    }

    const [
      totalSessions,
      completedSessions,
      upcomingSessions,
      cancelledSessions,
      totalDuration
    ] = await Promise.all([
      prisma.session.count({ where }),
      prisma.session.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.session.count({
        where: {
          ...where,
          status: 'SCHEDULED',
          scheduledAt: { gte: new Date() }
        }
      }),
      prisma.session.count({ where: { ...where, status: 'CANCELLED' } }),
      prisma.session.aggregate({
        where: { ...where, duration: { not: null } },
        _sum: { duration: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalSessions,
        completedSessions,
        upcomingSessions,
        cancelledSessions,
        totalDuration: totalDuration._sum.duration || 0,
        completionRate: totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(2) : 0
      }
    });
  })
);

module.exports = router;
