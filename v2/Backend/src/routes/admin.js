/**
 * Admin routes
 * Handles administrative functions like user management, analytics, and system monitoring
 */

const express = require('express');
const { prisma } = require('../utils/database');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validate, uuidSchema, uuidParamsSchema, paginationSchema } = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const { createAuditLog, getAuditLogs, getAuditStats, exportAuditLogs, AUDIT_ACTIONS } = require('../utils/audit');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

const router = express.Router();

// All admin routes require admin role
router.use(authenticate);
router.use(authorize(['ADMIN']));

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    pendingTherapists,
    totalSessions,
    activeSessions,
    totalMessages,
    systemStats
  ] = await Promise.all([
    // Total users
    prisma.user.count(),
    
    // Active users (logged in within last 30 days)
    prisma.user.count({
      where: {
        isActive: true,
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    
    // Pending therapist approvals
    prisma.therapistProfile.count({
      where: { isApproved: false }
    }),
    
    // Total sessions
    prisma.session.count(),
    
    // Active sessions
    prisma.session.count({
      where: { status: 'IN_PROGRESS' }
    }),
    
    // Total messages
    prisma.message.count(),
    
    // System statistics
    Promise.all([
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),
      prisma.session.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      prisma.session.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        select: { createdAt: true }
      })
    ])
  ]);

  const [usersByRole, sessionsByStatus, recentSessions] = systemStats;

  // Calculate daily session counts for the last 7 days
  const dailySessionCounts = {};
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailySessionCounts[dateStr] = 0;
  }

  recentSessions.forEach(session => {
    const dateStr = session.createdAt.toISOString().split('T')[0];
    if (dailySessionCounts[dateStr] !== undefined) {
      dailySessionCounts[dateStr]++;
    }
  });

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        activeUsers,
        pendingTherapists,
        totalSessions,
        activeSessions,
        totalMessages
      },
      usersByRole: usersByRole.map(item => ({
        role: item.role,
        count: item._count.role
      })),
      sessionsByStatus: sessionsByStatus.map(item => ({
        status: item.status,
        count: item._count.status
      })),
      dailySessionCounts
    }
  });
}));

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (Admin only)
 */
router.get('/users', 
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, sortBy = 'createdAt', sortOrder } = req.query;
    const { role, status, search } = req.query;
    const skip = (page - 1) * limit;

    let where = {};

    // Filter by role
    if (role) {
      where.role = role;
    }

    // Filter by status
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    } else if (status === 'verified') {
      where.isVerified = true;
    } else if (status === 'unverified') {
      where.isVerified = false;
    }

    // Search filter
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
              id: true,
              assignedTherapist: {
                select: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }
          },
          therapistProfile: {
            select: {
              id: true,
              isApproved: true,
              licenseNumber: true,
              specializations: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        users,
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
 * @route   GET /api/admin/users/:id
 * @desc    Get user details by ID
 * @access  Private (Admin only)
 */
router.get('/users/:id', 
  validate(uuidParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        patientProfile: {
          include: {
            assignedTherapist: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        therapistProfile: {
          include: {
            assignedPatients: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        adminProfile: true,
        patientSessions: {
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            therapist: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        therapistSessions: {
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            patient: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
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
  })
);

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Update user status (activate/deactivate)
 * @access  Private (Admin only)
 */
router.put('/users/:id/status', 
  validate(uuidParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw new AppError('isActive must be a boolean value', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent deactivating other admins
    if (user.role === 'ADMIN' && !isActive) {
      throw new AppError('Cannot deactivate admin users', 403);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive }
    });

    // Log audit event
    await createAuditLog({
      action: isActive ? AUDIT_ACTIONS.USER_ACTIVATE : AUDIT_ACTIONS.USER_DEACTIVATE,
      userId: req.user.id,
      userEmail: req.user.email,
      resource: 'USER',
      resourceId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'SUCCESS',
      details: { targetUserEmail: user.email, isActive }
    });

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user: updatedUser }
    });
  })
);

/**
 * @route   GET /api/admin/therapists/pending
 * @desc    Get pending therapist approvals
 * @access  Private (Admin only)
 */
router.get('/therapists/pending', 
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;

    const [therapists, total] = await Promise.all([
      prisma.therapistProfile.findMany({
        where: { isApproved: false },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              createdAt: true,
              isActive: true
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit
      }),
      prisma.therapistProfile.count({
        where: { isApproved: false }
      })
    ]);

    res.json({
      success: true,
      data: {
        therapists,
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
 * @route   PUT /api/admin/therapists/:id/approve
 * @desc    Approve or reject therapist
 * @access  Private (Admin only)
 */
router.put('/therapists/:id/approve', 
  validate(uuidParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    const { approved, notes } = req.body;

    if (typeof approved !== 'boolean') {
      throw new AppError('approved must be a boolean value', 400);
    }

    const therapistProfile = await prisma.therapistProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: true
      }
    });

    if (!therapistProfile) {
      throw new AppError('Therapist profile not found', 404);
    }

    const updatedProfile = await prisma.therapistProfile.update({
      where: { id: req.params.id },
      data: {
        isApproved: approved,
        approvedAt: approved ? new Date() : null,
        approvedBy: approved ? req.user.id : null
      }
    });

    // Send notification email
    try {
      if (approved) {
        await sendEmail({
          to: therapistProfile.user.email,
          template: 'therapistApproval',
          data: {
            name: therapistProfile.user.firstName,
            dashboardLink: `${process.env.FRONTEND_URL}/dashboard`
          }
        });
      } else {
        await sendEmail({
          to: therapistProfile.user.email,
          subject: 'Therapist Application Update',
          html: `
            <h2>Application Status Update</h2>
            <p>Hi ${therapistProfile.user.firstName},</p>
            <p>Thank you for your interest in joining our platform. After review, we are unable to approve your application at this time.</p>
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            <p>If you have any questions, please contact our support team.</p>
          `
        });
      }
    } catch (emailError) {
      logger.error('Failed to send therapist approval email:', emailError);
      // Don't fail the approval process if email fails
    }

    // Log audit event
    await createAuditLog({
      action: approved ? AUDIT_ACTIONS.THERAPIST_APPROVE : AUDIT_ACTIONS.THERAPIST_REJECT,
      userId: req.user.id,
      userEmail: req.user.email,
      resource: 'THERAPIST',
      resourceId: therapistProfile.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'SUCCESS',
      details: { 
        therapistEmail: therapistProfile.user.email,
        approved,
        notes 
      }
    });

    res.json({
      success: true,
      message: `Therapist ${approved ? 'approved' : 'rejected'} successfully`,
      data: { therapistProfile: updatedProfile }
    });
  })
);

/**
 * @route   GET /api/admin/sessions
 * @desc    Get all sessions with filtering
 * @access  Private (Admin only)
 */
router.get('/sessions', 
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, sortBy = 'scheduledAt', sortOrder } = req.query;
    const { status, therapistId, patientId } = req.query;
    const skip = (page - 1) * limit;

    let where = {};

    if (status) where.status = status;
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
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs
 * @access  Private (Admin only)
 */
router.get('/audit-logs', asyncHandler(async (req, res) => {
  const filters = {
    userId: req.query.userId,
    action: req.query.action,
    status: req.query.status,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 50
  };

  const result = await getAuditLogs(filters);

  res.json({
    success: true,
    data: result
  });
}));

/**
 * @route   GET /api/admin/audit-logs/stats
 * @desc    Get audit log statistics
 * @access  Private (Admin only)
 */
router.get('/audit-logs/stats', asyncHandler(async (req, res) => {
  const filters = {
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };

  const stats = await getAuditStats(filters);

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * @route   GET /api/admin/audit-logs/export
 * @desc    Export audit logs to CSV
 * @access  Private (Admin only)
 */
router.get('/audit-logs/export', asyncHandler(async (req, res) => {
  const filters = {
    userId: req.query.userId,
    action: req.query.action,
    status: req.query.status,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };

  const csvContent = await exportAuditLogs(filters);

  // Log audit event
  await createAuditLog({
    action: AUDIT_ACTIONS.ADMIN_DATA_EXPORT,
    userId: req.user.id,
    userEmail: req.user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    status: 'SUCCESS',
    details: { exportType: 'audit_logs', filters }
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csvContent);
}));

/**
 * @route   GET /api/admin/analytics
 * @desc    Get advanced analytics
 * @access  Private (Admin only)
 */
router.get('/analytics', asyncHandler(async (req, res) => {
  const { period = '30' } = req.query; // days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const [
    userGrowth,
    sessionMetrics,
    messageMetrics,
    therapistMetrics
  ] = await Promise.all([
    // User growth over time
    prisma.user.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: { createdAt: true, role: true }
    }),

    // Session metrics
    prisma.session.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: { status: true },
      _avg: { duration: true }
    }),

    // Message metrics
    prisma.message.groupBy({
      by: ['messageType'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: { messageType: true }
    }),

    // Therapist performance
    prisma.therapistProfile.findMany({
      where: {
        isApproved: true,
        user: {
          therapistSessions: {
            some: {
              createdAt: { gte: startDate }
            }
          }
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            therapistSessions: {
              where: {
                createdAt: { gte: startDate }
              },
              select: {
                status: true,
                duration: true
              }
            }
          }
        },
        _count: {
          select: {
            assignedPatients: true
          }
        }
      }
    })
  ]);

  // Process user growth data
  const dailyUserGrowth = {};
  for (let i = parseInt(period) - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyUserGrowth[dateStr] = { PATIENT: 0, THERAPIST: 0, ADMIN: 0 };
  }

  userGrowth.forEach(user => {
    const dateStr = user.createdAt.toISOString().split('T')[0];
    if (dailyUserGrowth[dateStr]) {
      dailyUserGrowth[dateStr][user.role]++;
    }
  });

  res.json({
    success: true,
    data: {
      userGrowth: dailyUserGrowth,
      sessionMetrics,
      messageMetrics,
      therapistMetrics: therapistMetrics.map(therapist => ({
        name: `${therapist.user.firstName} ${therapist.user.lastName}`,
        patientCount: therapist._count.assignedPatients,
        sessionCount: therapist.user.therapistSessions.length,
        completedSessions: therapist.user.therapistSessions.filter(s => s.status === 'COMPLETED').length,
        averageDuration: therapist.user.therapistSessions
          .filter(s => s.duration)
          .reduce((acc, s, _, arr) => acc + s.duration / arr.length, 0) || 0
      }))
    }
  });
}));

module.exports = router;
