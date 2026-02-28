import prisma from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

/**
 * Get all therapists (pending and approved)
 */
export const getAllTherapists = async (req, res, next) => {
  try {
    const { isApproved, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (isApproved !== undefined) {
      where.isApproved = isApproved === 'true';
    }

    const [therapists, total] = await Promise.all([
      prisma.therapistProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              createdAt: true,
            },
          },
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: {
          user: {
            createdAt: 'desc',
          },
        },
      }),
      prisma.therapistProfile.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        therapists,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve or reject therapist
 */
export const updateTherapistApproval = async (req, res, next) => {
  try {
    const { therapistId } = req.params;
    const { isApproved } = req.body;

    if (typeof isApproved !== 'boolean') {
      throw new AppError('isApproved must be a boolean', 400);
    }

    const therapist = await prisma.therapistProfile.findUnique({
      where: { userId: therapistId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!therapist) {
      throw new AppError('Therapist not found', 404);
    }

    const updatedTherapist = await prisma.therapistProfile.update({
      where: { userId: therapistId },
      data: { isApproved },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: `Therapist ${isApproved ? 'approved' : 'rejected'} successfully`,
      data: { therapist: updatedTherapist },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get system metrics/dashboard stats
 */
export const getSystemMetrics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalPatients,
      totalTherapists,
      approvedTherapists,
      pendingTherapists,
      totalBookings,
      scheduledBookings,
      completedBookings,
      cancelledBookings,
      totalSessions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'PATIENT' } }),
      prisma.user.count({ where: { role: 'THERAPIST' } }),
      prisma.therapistProfile.count({ where: { isApproved: true } }),
      prisma.therapistProfile.count({ where: { isApproved: false } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'SCHEDULED' } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.session.count(),
    ]);

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        therapist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        metrics: {
          users: {
            total: totalUsers,
            patients: totalPatients,
            therapists: totalTherapists,
          },
          therapists: {
            approved: approvedTherapists,
            pending: pendingTherapists,
          },
          bookings: {
            total: totalBookings,
            scheduled: scheduledBookings,
            completed: completedBookings,
            cancelled: cancelledBookings,
          },
          sessions: {
            total: totalSessions,
          },
        },
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          therapistProfile: {
            select: {
              specialization: true,
              isApproved: true,
            },
          },
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all bookings (admin view)
 */
export const getAllBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          therapist: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          session: true,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
