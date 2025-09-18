const express = require('express');
const router = express.Router();
const { prisma } = require('../utils/database');
const { authenticate } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// Get user's sessions (patients see their sessions, therapists see their sessions)
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let sessions;

    if (userRole === 'PATIENT') {
      sessions = await prisma.session.findMany({
        where: { patientId: userId },
        include: {
          therapist: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              therapistProfile: {
                select: {
                  specializations: true,
                  languages: true
                }
              }
            }
          },
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { scheduledAt: 'desc' }
      });
    } else if (userRole === 'THERAPIST') {
      sessions = await prisma.session.findMany({
        where: { therapistId: userId },
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
        orderBy: { scheduledAt: 'desc' }
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { sessions }
    });

  } catch (error) {
    logger.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions'
    });
  }
});

// Create new session (direct booking)
router.post('/', authenticate, async (req, res) => {
  try {
    const patientId = req.user.id;
    const { 
      therapistId, 
      scheduledAt, 
      sessionType, 
      title, 
      description,
      isEmergency = false 
    } = req.body;

    // Validate required fields
    if (!therapistId || !scheduledAt || !sessionType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: therapistId, scheduledAt, sessionType'
      });
    }

    // Verify therapist exists and is approved
    const therapist = await prisma.user.findFirst({
      where: {
        id: therapistId,
        role: 'THERAPIST',
        therapistProfile: {
          status: 'APPROVED'
        }
      }
    });

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found or not approved'
      });
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        patientId,
        therapistId,
        scheduledAt: new Date(scheduledAt),
        sessionType,
        title,
        description,
        isEmergency,
        status: 'SCHEDULED'
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
            email: true,
            therapistProfile: {
              select: {
                specializations: true,
                languages: true
              }
            }
          }
        }
      }
    });

    // Log session creation
    logger.info(`Session created: ${session.id} for patient ${patientId} with therapist ${therapistId}`);

    res.status(201).json({
      success: true,
      data: { session }
    });

  } catch (error) {
    logger.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create session'
    });
  }
});

// Update session
router.put('/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const updates = req.body;

    // Find session and verify user has access
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        OR: [
          { patientId: userId },
          { therapistId: userId }
        ]
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }

    // Restrict what fields can be updated based on role
    let allowedUpdates = {};
    
    if (userRole === 'THERAPIST') {
      // Therapists can update notes, status
      const { notes, status, sessionNotes } = updates;
      if (notes !== undefined) allowedUpdates.notes = notes;
      if (status !== undefined) allowedUpdates.status = status;
      if (sessionNotes !== undefined) allowedUpdates.sessionNotes = sessionNotes;
    } else if (userRole === 'PATIENT') {
      // Patients can update title, description (before session starts)
      if (session.status === 'SCHEDULED') {
        const { title, description } = updates;
        if (title !== undefined) allowedUpdates.title = title;
        if (description !== undefined) allowedUpdates.description = description;
      }
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: allowedUpdates,
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
            email: true,
            therapistProfile: {
              select: {
                specializations: true,
                languages: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: { session: updatedSession }
    });

  } catch (error) {
    logger.error('Error updating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session'
    });
  }
});

// Cancel session
router.post('/:sessionId/cancel', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Find session and verify user has access
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        OR: [
          { patientId: userId },
          { therapistId: userId }
        ]
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }

    // Update session status to cancelled
    await prisma.session.update({
      where: { id: sessionId },
      data: { 
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: userId
      }
    });

    logger.info(`Session ${sessionId} cancelled by user ${userId}`);

    res.json({
      success: true,
      message: 'Session cancelled successfully'
    });

  } catch (error) {
    logger.error('Error cancelling session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel session'
    });
  }
});

// Join session (start session)
router.post('/:sessionId/join', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Find session and verify user has access
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        OR: [
          { patientId: userId },
          { therapistId: userId }
        ]
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
            email: true,
            therapistProfile: {
              select: {
                specializations: true,
                languages: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }

    // Update session status to in progress if scheduled
    if (session.status === 'SCHEDULED') {
      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: { 
          status: 'IN_PROGRESS',
          startedAt: new Date()
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
              email: true,
              therapistProfile: {
                select: {
                  specializations: true,
                  languages: true
                }
              }
            }
          }
        }
      });

      return res.json({
        success: true,
        data: { session: updatedSession }
      });
    }

    res.json({
      success: true,
      data: { session }
    });

  } catch (error) {
    logger.error('Error joining session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join session'
    });
  }
});

// Add session notes
router.post('/:sessionId/notes', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { notes } = req.body;

    // Find session and verify therapist has access
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        therapistId: userId // Only therapists can add notes
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: { sessionNotes: notes },
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
            email: true,
            therapistProfile: {
              select: {
                specializations: true,
                languages: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: { session: updatedSession }
    });

  } catch (error) {
    logger.error('Error adding session notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add session notes'
    });
  }
});

// Rate session
router.post('/:sessionId/rate', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    // Find session and verify patient has access
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        patientId: userId, // Only patients can rate
        status: 'COMPLETED' // Can only rate completed sessions
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found, access denied, or session not completed'
      });
    }

    // Check if rating already exists
    const existingRating = await prisma.rating.findFirst({
      where: {
        sessionId,
        patientId: userId
      }
    });

    let ratingRecord;

    if (existingRating) {
      // Update existing rating
      ratingRecord = await prisma.rating.update({
        where: { id: existingRating.id },
        data: {
          rating: parseInt(rating),
          comment
        }
      });
    } else {
      // Create new rating
      ratingRecord = await prisma.rating.create({
        data: {
          sessionId,
          patientId: userId,
          therapistId: session.therapistId,
          rating: parseInt(rating),
          comment
        }
      });
    }

    res.json({
      success: true,
      data: { rating: ratingRecord }
    });

  } catch (error) {
    logger.error('Error rating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate session'
    });
  }
});

module.exports = router;
