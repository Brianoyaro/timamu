import express from 'express';
import {
  getApprovedTherapists,
  getTherapistById,
  getMyTherapistProfile,
  updateTherapistProfile,
  updateAvailability,
} from './therapists.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/authMiddleware.js';
import { isTherapist } from '../../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/therapists
 * @desc    Get all approved therapists
 * @access  Public (optional auth)
 */
router.get('/', optionalAuthMiddleware, getApprovedTherapists);

/**
 * @route   GET /api/therapists/me
 * @desc    Get own therapist profile
 * @access  Private (Therapist)
 */
router.get('/me', authMiddleware, isTherapist, getMyTherapistProfile);

/**
 * @route   PUT /api/therapists/me
 * @desc    Update own therapist profile
 * @access  Private (Therapist)
 */
router.put('/me', authMiddleware, isTherapist, updateTherapistProfile);

/**
 * @route   PUT /api/therapists/availability
 * @desc    Update therapist availability
 * @access  Private (Therapist)
 */
router.put('/availability', authMiddleware, isTherapist, updateAvailability);

/**
 * @route   GET /api/therapists/:id
 * @desc    Get single therapist profile
 * @access  Public (optional auth)
 */
router.get('/:id', optionalAuthMiddleware, getTherapistById);

export default router;
