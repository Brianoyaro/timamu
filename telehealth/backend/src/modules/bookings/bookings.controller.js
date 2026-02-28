import { z } from 'zod';
import prisma from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

// Validation schemas
const createBookingSchema = z.object({
  therapistId: z.string().uuid('Invalid therapist ID'),
  scheduledAt: z.string().datetime('Invalid date format'),
  notes: z.string().optional(),
});

const updateBookingSchema = z.object({
  notes: z.string().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
});

/**
 * Create a new booking
 */
export const createBooking = async (req, res, next) => {
  try {
    const validatedData = createBookingSchema.parse(req.body);
    const { therapistId, scheduledAt, notes } = validatedData;

    // Verify therapist exists and is approved
    const therapist = await prisma.therapistProfile.findUnique({
      where: { userId: therapistId },
    });

    if (!therapist) {
      throw new AppError('Therapist not found', 404);
    }

    if (!therapist.isApproved) {
      throw new AppError('Therapist is not approved yet', 400);
    }

    // Check if scheduled time is in the future
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate < new Date()) {
      throw new AppError('Cannot book appointments in the past', 400);
    }

    // Check for conflicting bookings
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        therapistId,
        scheduledAt: scheduledDate,
        status: {
          in: ['SCHEDULED'],
        },
      },
    });

    if (conflictingBooking) {
      throw new AppError('This time slot is already booked', 409);
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        patientId: req.user.id,
        therapistId,
        scheduledAt: scheduledDate,
        notes,
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
            therapistProfile: {
              select: {
                specialization: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all bookings for current user
 */
export const getMyBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(req.user.role === 'PATIENT'
        ? { patientId: req.user.id }
        : { therapistId: req.user.id }),
      ...(status && { status }),
    };

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
              therapistProfile: {
                select: {
                  specialization: true,
                },
              },
            },
          },
          session: true,
        },
        orderBy: {
          scheduledAt: 'desc',
        },
        skip: parseInt(skip),
        take: parseInt(limit),
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

/**
 * Get single booking by ID
 */
export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        therapist: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            therapistProfile: {
              select: {
                specialization: true,
                licenseNumber: true,
              },
            },
          },
        },
        session: true,
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Verify user has access to this booking
    if (
      booking.patientId !== req.user.id &&
      booking.therapistId !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      throw new AppError('You do not have access to this booking', 403);
    }

    res.json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update booking
 */
export const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateBookingSchema.parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Verify user has access to update this booking
    if (
      booking.patientId !== req.user.id &&
      booking.therapistId !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      throw new AppError('You do not have permission to update this booking', 403);
    }

    // Only allow certain status transitions
    if (validatedData.status === 'COMPLETED' && req.user.role === 'PATIENT') {
      throw new AppError('Only therapists can mark sessions as completed', 403);
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: validatedData,
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
      message: 'Booking updated successfully',
      data: { booking: updatedBooking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel booking
 */
export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Verify user has access to cancel
    if (
      booking.patientId !== req.user.id &&
      booking.therapistId !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      throw new AppError('You do not have permission to cancel this booking', 403);
    }

    // Check if already cancelled or completed
    if (booking.status === 'CANCELLED') {
      throw new AppError('Booking is already cancelled', 400);
    }

    if (booking.status === 'COMPLETED') {
      throw new AppError('Cannot cancel a completed booking', 400);
    }

    const cancelledBooking = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
        therapist: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking: cancelledBooking },
    });
  } catch (error) {
    next(error);
  }
};
