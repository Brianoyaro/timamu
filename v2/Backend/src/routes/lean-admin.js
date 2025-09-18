/**
 * Lean Admin routes for NGO telepsychology platform
 * Simplified admin functionality without complex assignment system
 */

const express = require('express');
const { prisma } = require('../utils/database');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const { createAuditLog, AUDIT_ACTIONS } = require('../utils/audit');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/admin/stats
 * @desc    Get platform statistics
 * @access  Private (Admin only)
 */
router.get('/stats', authenticate, authorize(['ADMIN']), asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalPatients,
    totalTherapists,
    pendingTherapists,
    totalSessions,
    emergencySessions
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'PATIENT' } }),
    prisma.user.count({ 
      where: { 
        role: 'THERAPIST',
        therapistProfile: { isApproved: true }
      } 
    }),
    prisma.user.count({ 
      where: { 
        role: 'THERAPIST',
        therapistProfile: { isApproved: false }
      } 
    }),
    prisma.session.count(),
    prisma.session.count({ where: { isEmergency: true } })
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalPatients,
      totalTherapists,
      pendingTherapists,
      totalSessions,
      emergencySessions
    }
  });
}));

/**
 * @route   GET /api/admin/therapists/pending
 * @desc    Get pending therapist applications
 * @access  Private (Admin only)
 */
router.get('/therapists/pending', authenticate, authorize(['ADMIN']), asyncHandler(async (req, res) => {
  const therapists = await prisma.user.findMany({
    where: {
      role: 'THERAPIST',
      therapistProfile: {
        isApproved: false
      }
    },
    include: {
      therapistProfile: {
        select: {
          licenseNumber: true,
          specializations: true,
          languages: true,
          experience: true,
          education: true,
          biography: true,
          acceptsEmergency: true,
          availability: true,
          timezone: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  res.json({
    success: true,
    data: { therapists }
  });
}));

/**
 * @route   POST /api/admin/therapists/:id/approve
 * @desc    Approve a therapist application
 * @access  Private (Admin only)
 */
router.post('/therapists/:id/approve', authenticate, authorize(['ADMIN']), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if therapist exists and is pending
  const therapist = await prisma.user.findFirst({
    where: {
      id,
      role: 'THERAPIST',
      therapistProfile: {
        isApproved: false
      }
    },
    include: {
      therapistProfile: true
    }
  });

  if (!therapist) {
    throw new AppError('Therapist not found or already approved', 404);
  }

  // Approve the therapist
  await prisma.therapistProfile.update({
    where: { userId: id },
    data: {
      isApproved: true,
      approvedAt: new Date()
    }
  });

  // Create audit log
  await createAuditLog({
    action: AUDIT_ACTIONS.THERAPIST_APPROVED,
    userId: req.user.id,
    userEmail: req.user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    status: 'SUCCESS',
    details: {
      therapistId: id,
      therapistEmail: therapist.email,
      licenseNumber: therapist.therapistProfile.licenseNumber
    }
  });

  logger.info(`Therapist approved: ${therapist.email} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Therapist approved successfully'
  });
}));

/**
 * @route   POST /api/admin/therapists/:id/reject
 * @desc    Reject a therapist application
 * @access  Private (Admin only)
 */
router.post('/therapists/:id/reject', authenticate, authorize(['ADMIN']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  // Check if therapist exists and is pending
  const therapist = await prisma.user.findFirst({
    where: {
      id,
      role: 'THERAPIST',
      therapistProfile: {
        isApproved: false
      }
    },
    include: {
      therapistProfile: true
    }
  });

  if (!therapist) {
    throw new AppError('Therapist not found or already processed', 404);
  }

  // Deactivate the user account
  await prisma.user.update({
    where: { id },
    data: { isActive: false }
  });

  // Create audit log
  await createAuditLog({
    action: AUDIT_ACTIONS.THERAPIST_REJECTED,
    userId: req.user.id,
    userEmail: req.user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    status: 'SUCCESS',
    details: {
      therapistId: id,
      therapistEmail: therapist.email,
      licenseNumber: therapist.therapistProfile.licenseNumber,
      reason: reason || 'No reason provided'
    }
  });

  logger.info(`Therapist rejected: ${therapist.email} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Therapist application rejected'
  });
}));

/**
 * @route   GET /api/admin/sessions/recent
 * @desc    Get recent sessions for admin overview
 * @access  Private (Admin only)
 */
router.get('/sessions/recent', authenticate, authorize(['ADMIN']), asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;

  const sessions = await prisma.session.findMany({
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
    },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit)
  });

  res.json({
    success: true,
    data: { sessions }
  });
}));

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (Admin only)
 */
router.get('/users', authenticate, authorize(['ADMIN']), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, role, search, isActive } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        lastLoginAt: true,
        patientProfile: {
          select: {
            preferredLanguage: true,
            timezone: true
          }
        },
        therapistProfile: {
          select: {
            licenseNumber: true,
            specializations: true,
            experience: true,
            isApproved: true,
            acceptsEmergency: true
          }
        },
        adminProfile: {
          select: {
            level: true,
            permissions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    }),
    prisma.user.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      users,
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
 * @route   GET /api/admin/sessions
 * @desc    Get all sessions with filtering and pagination
 * @access  Private (Admin only)
 */
router.get('/sessions', authenticate, authorize(['ADMIN']), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status, isEmergency, therapistId, patientId } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  
  if (status) where.status = status;
  if (isEmergency !== undefined) where.isEmergency = isEmergency === 'true';
  if (therapistId) where.therapistId = therapistId;
  if (patientId) where.patientId = patientId;

  const [sessions, total] = await Promise.all([
    prisma.session.findMany({
      where,
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
 * @route   GET /api/admin/analytics
 * @desc    Get platform analytics
 * @access  Private (Admin only)
 */
router.get('/analytics', authenticate, authorize(['ADMIN']), asyncHandler(async (req, res) => {
  const { period = '30' } = req.query; // days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const [
    userGrowth,
    sessionStats,
    therapistStats,
    emergencyStats
  ] = await Promise.all([
    // User growth over period
    prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      select: {
        role: true,
        createdAt: true
      }
    }),
    
    // Session statistics
    prisma.session.groupBy({
      by: ['status'],
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: startDate
        }
      }
    }),
    
    // Therapist performance
    prisma.session.groupBy({
      by: ['therapistId'],
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: startDate
        },
        status: 'COMPLETED'
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    }),
    
    // Emergency session trends
    prisma.session.findMany({
      where: {
        isEmergency: true,
        createdAt: {
          gte: startDate
        }
      },
      select: {
        createdAt: true,
        status: true
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      period: parseInt(period),
      userGrowth,
      sessionStats,
      therapistStats,
      emergencyStats
    }
  });
}));

module.exports = router;
