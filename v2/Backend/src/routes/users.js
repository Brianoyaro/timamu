/**
 * User routes
 * Handles user profile management and user-related operations
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { prisma } = require('../utils/database');
const { authenticate, authorize, requireVerified } = require('../middleware/authMiddleware');
const { validate, updateProfileSchema, changePasswordSchema, uuidSchema, uuidParamsSchema } = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const { createAuditLog, AUDIT_ACTIONS } = require('../utils/audit');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
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
          insuranceInfo: true,
          preferredLanguage: true,
          timezone: true,
          assignedTherapist: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              specializations: true,
              hourlyRate: true
            }
          }
        }
      },
      therapistProfile: {
        select: {
          licenseNumber: true,
          specializations: true,
          experience: true,
          education: true,
          biography: true,
          hourlyRate: true,
          isApproved: true,
          approvedAt: true,
          workingHours: true,
          timezone: true,
          assignedPatients: {
            select: {
              id: true,
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
 * @desc    Update current user profile
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
    insuranceInfo,
    // Therapist-specific fields
    specializations,
    experience,
    education,
    biography,
    hourlyRate
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
    if (req.user.role === 'PATIENT' && req.user.patientProfile) {
      await tx.patientProfile.update({
        where: { userId: req.user.id },
        data: {
          medicalHistory: medicalHistory || undefined,
          emergencyContact: emergencyContact || undefined,
          insuranceInfo: insuranceInfo || undefined
        }
      });
    } else if (req.user.role === 'THERAPIST' && req.user.therapistProfile) {
      await tx.therapistProfile.update({
        where: { userId: req.user.id },
        data: {
          specializations: specializations || undefined,
          experience: experience || undefined,
          education: education || undefined,
          biography: biography || undefined,
          hourlyRate: hourlyRate || undefined
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
 * @route   PUT /api/users/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticate, requireVerified, validate(changePasswordSchema), asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Verify current password
  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Hash new password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword }
  });

  // Log audit event
  await createAuditLog({
    action: 'PASSWORD_CHANGE',
    userId: req.user.id,
    userEmail: req.user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    status: 'SUCCESS'
  });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

/**
 * @route   GET /api/users/therapists
 * @desc    Get list of approved therapists
 * @access  Private (Patients and Admins)
 */
router.get('/therapists', authenticate, authorize(['PATIENT', 'ADMIN']), asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, specialization, search } = req.query;
  const skip = (page - 1) * limit;

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
      { lastName: { contains: search, mode: 'insensitive' } },
      { therapistProfile: { specializations: { has: search } } }
    ];
  }

  // Add specialization filter
  if (specialization) {
    where.therapistProfile.specializations = { has: specialization };
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
            experience: true,
            education: true,
            biography: true,
            hourlyRate: true,
            workingHours: true,
            timezone: true
          }
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      therapists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
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
          experience: true,
          education: true,
          biography: true,
          hourlyRate: true,
          workingHours: true,
          timezone: true
        }
      }
    }
  });

  if (!therapist) {
    throw new AppError('Therapist not found', 404);
  }

  res.json({
    success: true,
    data: { therapist }
  });
}));

/**
 * @route   GET /api/users/specializations
 * @desc    Get available therapy specializations
 * @access  Private
 */
router.get('/specializations', authenticate, asyncHandler(async (req, res) => {
  const specializations = await prisma.therapySpecialization.findMany({
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  });

  // Group by category
  const groupedSpecializations = specializations.reduce((acc, spec) => {
    if (!acc[spec.category]) {
      acc[spec.category] = [];
    }
    acc[spec.category].push(spec);
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      specializations: groupedSpecializations,
      all: specializations
    }
  });
}));

/**
 * @route   GET /api/users/assignment-types
 * @desc    Get available assignment types
 * @access  Private
 */
router.get('/assignment-types', authenticate, asyncHandler(async (req, res) => {
  const assignmentTypes = await prisma.assignmentType.findMany({
    orderBy: { priority: 'asc' }
  });

  res.json({
    success: true,
    data: { assignmentTypes }
  });
}));

/**
 * @route   GET /api/users/my-assignments
 * @desc    Get patient's current therapist assignments
 * @access  Private (Patients only)
 */
router.get('/my-assignments', 
  authenticate, 
  authorize(['PATIENT']), 
  requireVerified,
  asyncHandler(async (req, res) => {
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!patientProfile) {
      throw new AppError('Patient profile not found', 404);
    }

    const assignments = await prisma.patientTherapistAssignment.findMany({
      where: { patientId: patientProfile.id },
      include: {
        specialization: true,
        assignmentType: true,
        therapist: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // Active first
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: { assignments }
    });
  })
);

/**
 * @route   POST /api/users/therapists/:id/request
 * @desc    Request a specific therapist assignment (for patients)
 * @access  Private (Patients only)
 */
router.post('/therapists/:id/request', 
  authenticate, 
  authorize(['PATIENT']), 
  requireVerified,
  validate(uuidParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    const therapistId = req.params.id;
    const { specializationCode, assignmentTypeCode, reason } = req.body;

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
          include: {
            specializations: true
          }
        }
      }
    });

    if (!therapist) {
      throw new AppError('Therapist not found or not available', 404);
    }

    // Get patient profile
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!patientProfile) {
      throw new AppError('Patient profile not found', 404);
    }

    // Validate specialization and assignment type
    const specialization = await prisma.therapySpecialization.findUnique({
      where: { code: specializationCode || 'GEN001' }
    });

    const assignmentType = await prisma.assignmentType.findUnique({
      where: { code: assignmentTypeCode || 'primary' }
    });

    if (!specialization || !assignmentType) {
      throw new AppError('Invalid specialization or assignment type', 400);
    }

    // Check if therapist has this specialization
    const hasSpecialization = therapist.therapistProfile.specializations.some(
      spec => spec.id === specialization.id
    );

    if (!hasSpecialization) {
      throw new AppError('Therapist does not offer this specialization', 400);
    }

    // Check for existing assignments if concurrent not allowed
    if (!assignmentType.allowsConcurrent) {
      const existingAssignment = await prisma.patientTherapistAssignment.findFirst({
        where: {
          patientId: patientProfile.id,
          assignmentTypeId: assignmentType.id,
          status: 'ACTIVE'
        }
      });

      if (existingAssignment) {
        throw new AppError(`You already have an active ${assignmentType.name.toLowerCase()} assignment`, 400);
      }
    }

    // Create assignment
    const assignment = await prisma.patientTherapistAssignment.create({
      data: {
        patientId: patientProfile.id,
        therapistId: therapist.therapistProfile.id,
        specializationId: specialization.id,
        assignmentTypeId: assignmentType.id,
        status: assignmentType.requiresApproval ? 'PENDING_APPROVAL' : 'ACTIVE',
        maxSessions: assignmentType.defaultMaxSessions,
        expiresAt: assignmentType.defaultDurationDays ? 
          new Date(Date.now() + assignmentType.defaultDurationDays * 24 * 60 * 60 * 1000) : null,
        reason,
        requestedAt: new Date()
      },
      include: {
        specialization: true,
        assignmentType: true,
        therapist: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    // Log audit event
    await createAuditLog({
      action: 'THERAPIST_ASSIGNMENT_REQUEST',
      userId: req.user.id,
      userEmail: req.user.email,
      resource: 'ASSIGNMENT',
      resourceId: assignment.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'SUCCESS',
      details: {
        therapistId,
        specializationCode,
        assignmentTypeCode,
        requiresApproval: assignmentType.requiresApproval
      }
    });

    res.json({
      success: true,
      message: assignmentType.requiresApproval ? 
        'Assignment request submitted for approval' : 
        'Therapist assigned successfully',
      data: {
        assignment: {
          id: assignment.id,
          status: assignment.status,
          specialization: assignment.specialization.name,
          assignmentType: assignment.assignmentType.name,
          maxSessions: assignment.maxSessions,
          expiresAt: assignment.expiresAt,
          therapist: {
            id: assignment.therapist.user.id,
            firstName: assignment.therapist.user.firstName,
            lastName: assignment.therapist.user.lastName
          }
        }
      }
    });
  })
);

/**
 * @route   DELETE /api/users/therapists/assignment
 * @desc    Remove therapist assignment (for patients)
 * @access  Private (Patients only)
 */
router.delete('/therapists/assignment', 
  authenticate, 
  authorize(['PATIENT']), 
  requireVerified,
  asyncHandler(async (req, res) => {
    // Remove therapist assignment
    await prisma.patientProfile.update({
      where: { userId: req.user.id },
      data: { assignedTherapistId: null }
    });

    // Log audit event
    await createAuditLog({
      action: 'THERAPIST_UNASSIGN',
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'SUCCESS'
    });

    res.json({
      success: true,
      message: 'Therapist assignment removed successfully'
    });
  })
);

/**
 * @route   PUT /api/users/availability
 * @desc    Update therapist availability (for therapists)
 * @access  Private (Therapists only)
 */
router.put('/availability', 
  authenticate, 
  authorize(['THERAPIST']), 
  requireVerified,
  asyncHandler(async (req, res) => {
    const { workingHours, timezone } = req.body;

    // Update therapist availability
    await prisma.therapistProfile.update({
      where: { userId: req.user.id },
      data: {
        workingHours: workingHours || undefined,
        timezone: timezone || undefined
      }
    });

    // Log audit event
    await createAuditLog({
      action: 'AVAILABILITY_UPDATE',
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'SUCCESS'
    });

    res.json({
      success: true,
      message: 'Availability updated successfully'
    });
  })
);

/**
 * @route   GET /api/users/patients
 * @desc    Get assigned patients (for therapists)
 * @access  Private (Therapists only)
 */
router.get('/patients', 
  authenticate, 
  authorize(['THERAPIST']), 
  requireVerified,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const therapistProfile = await prisma.therapistProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!therapistProfile) {
      throw new AppError('Therapist profile not found', 404);
    }

    const [patients, total] = await Promise.all([
      prisma.patientProfile.findMany({
        where: { assignedTherapistId: therapistProfile.id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              createdAt: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.patientProfile.count({
        where: { assignedTherapistId: therapistProfile.id }
      })
    ]);

    res.json({
      success: true,
      data: {
        patients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  })
);

/**
 * @route   DELETE /api/users/account
 * @desc    Delete user account (soft delete)
 * @access  Private
 */
router.delete('/account', authenticate, asyncHandler(async (req, res) => {
  // Soft delete - deactivate account
  await prisma.user.update({
    where: { id: req.user.id },
    data: { isActive: false }
  });

  // Log audit event
  await createAuditLog({
    action: AUDIT_ACTIONS.USER_DELETE,
    userId: req.user.id,
    userEmail: req.user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    status: 'SUCCESS'
  });

  res.json({
    success: true,
    message: 'Account deactivated successfully'
  });
}));

module.exports = router;
