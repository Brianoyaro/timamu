import { z } from 'zod';
import prisma from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

// Validation schemas
const updateTherapistProfileSchema = z.object({
  specialization: z.string().min(1).optional(),
  licenseNumber: z.string().min(1).optional(),
  bio: z.string().min(1).optional(),
  availability: z.record(z.array(z.string())).optional(),
});

/**
 * Get all approved therapists (public)
 */
export const getApprovedTherapists = async (req, res, next) => {
  try {
    const { specialization, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      isApproved: true,
      ...(specialization && {
        specialization: {
          contains: specialization,
        },
      }),
    };

    const [therapists, total] = await Promise.all([
      prisma.therapistProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip: parseInt(skip),
        take: parseInt(limit),
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
 * Get single therapist profile
 */
export const getTherapistById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const therapist = await prisma.therapistProfile.findUnique({
      where: { userId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    if (!therapist) {
      throw new AppError('Therapist not found', 404);
    }

    // Only return approved therapists to non-admin users
    if (!therapist.isApproved && (!req.user || req.user.role !== 'ADMIN')) {
      throw new AppError('Therapist not found', 404);
    }

    res.json({
      success: true,
      data: { therapist },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get own therapist profile
 */
export const getMyTherapistProfile = async (req, res, next) => {
  try {
    const therapist = await prisma.therapistProfile.findUnique({
      where: { userId: req.user.id },
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
    });

    if (!therapist) {
      throw new AppError('Therapist profile not found', 404);
    }

    res.json({
      success: true,
      data: { therapist },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update therapist profile
 */
export const updateTherapistProfile = async (req, res, next) => {
  try {
    const validatedData = updateTherapistProfileSchema.parse(req.body);

    const therapist = await prisma.therapistProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!therapist) {
      throw new AppError('Therapist profile not found', 404);
    }

    const updatedTherapist = await prisma.therapistProfile.update({
      where: { userId: req.user.id },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Therapist profile updated successfully',
      data: { therapist: updatedTherapist },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update availability
 */
export const updateAvailability = async (req, res, next) => {
  try {
    const availabilitySchema = z.record(z.array(z.string()));
    const availability = availabilitySchema.parse(req.body.availability);

    const therapist = await prisma.therapistProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!therapist) {
      throw new AppError('Therapist profile not found', 404);
    }

    const updatedTherapist = await prisma.therapistProfile.update({
      where: { userId: req.user.id },
      data: { availability },
    });

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: { availability: updatedTherapist.availability },
    });
  } catch (error) {
    next(error);
  }
};
