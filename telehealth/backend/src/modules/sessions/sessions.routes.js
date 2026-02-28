import express from 'express';
import {
  startSession,
  getSessionToken,
  endSession,
  getSessionDetails,
} from './sessions.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/sessions/:bookingId/start
 * @desc    Start a session for a booking
 * @access  Private (Patient or Therapist)
 */
router.post('/:bookingId/start', startSession);

/**
 * @route   GET /api/sessions/:bookingId/token
 * @desc    Get LiveKit token for a session
 * @access  Private (Patient or Therapist)
 */
router.get('/:bookingId/token', getSessionToken);

/**
 * @route   POST /api/sessions/:bookingId/end
 * @desc    End a session
 * @access  Private (Therapist only)
 */
router.post('/:bookingId/end', endSession);

/**
 * @route   GET /api/sessions/:bookingId
 * @desc    Get session details
 * @access  Private
 */
router.get('/:bookingId', getSessionDetails);

export default router;
