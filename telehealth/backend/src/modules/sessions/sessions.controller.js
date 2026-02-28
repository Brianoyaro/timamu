import prisma from '../../config/db.js';
import { generateLiveKitToken, generateRoomName } from '../../utils/livekit.js';
import { AppError } from '../../middleware/errorHandler.js';

/**
 * Start a session for a booking
 */
export const startSession = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
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
        session: true,
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Verify user has access
    if (
      booking.patientId !== req.user.id &&
      booking.therapistId !== req.user.id
    ) {
      throw new AppError('You do not have access to this booking', 403);
    }

    // Check booking status
    if (booking.status === 'CANCELLED') {
      throw new AppError('Cannot start a cancelled booking', 400);
    }

    if (booking.status === 'COMPLETED') {
      throw new AppError('This booking has already been completed', 400);
    }

    // Check if session already exists
    let session = booking.session;

    if (!session) {
      // Create new session
      const roomName = generateRoomName(bookingId);

      session = await prisma.session.create({
        data: {
          bookingId,
          livekitRoom: roomName,
        },
      });
    }

    res.json({
      success: true,
      message: 'Session started successfully',
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get LiveKit token for a session
 */
export const getSessionToken = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    // Get booking with session
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        session: true,
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

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Verify user has access
    if (
      booking.patientId !== req.user.id &&
      booking.therapistId !== req.user.id
    ) {
      throw new AppError('You do not have access to this session', 403);
    }

    // Check if session exists
    if (!booking.session) {
      throw new AppError('Session not started yet', 400);
    }

    // Generate token
    const participantName = req.user.name || `User-${req.user.id.substring(0, 8)}`;
    const token = await generateLiveKitToken(
      booking.session.livekitRoom,
      participantName,
      req.user.id
    );

    console.log('🔑 Generated LiveKit Token:', {
      tokenType: typeof token,
      tokenLength: token?.length,
      tokenPreview: token?.substring(0, 50) + '...',
      roomName: booking.session.livekitRoom,
      serverUrl: process.env.LIVEKIT_URL
    });

    res.json({
      success: true,
      data: {
        token,
        roomName: booking.session.livekitRoom,
        serverUrl: process.env.LIVEKIT_URL,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * End a session
 */
export const endSession = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    // Get booking with session
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        session: true,
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Verify user has access (only therapist can end session)
    if (booking.therapistId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AppError('Only the therapist can end the session', 403);
    }

    // Check if session exists
    if (!booking.session) {
      throw new AppError('No active session found', 400);
    }

    // Update session end time and booking status
    await prisma.$transaction([
      prisma.session.update({
        where: { id: booking.session.id },
        data: { endedAt: new Date() },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'COMPLETED' },
      }),
    ]);

    res.json({
      success: true,
      message: 'Session ended successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get session details
 */
export const getSessionDetails = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        session: true,
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

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Verify user has access
    if (
      booking.patientId !== req.user.id &&
      booking.therapistId !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      throw new AppError('You do not have access to this session', 403);
    }

    res.json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};
