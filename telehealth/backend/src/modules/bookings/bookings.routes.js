import express from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
} from './bookings.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private (Patient)
 */
router.post('/', createBooking);

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings for current user
 * @access  Private
 */
router.get('/', getMyBookings);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get single booking by ID
 * @access  Private
 */
router.get('/:id', getBookingById);

/**
 * @route   PUT /api/bookings/:id
 * @desc    Update booking
 * @access  Private
 */
router.put('/:id', updateBooking);

/**
 * @route   POST /api/bookings/:id/cancel
 * @desc    Cancel booking
 * @access  Private
 */
router.post('/:id/cancel', cancelBooking);

export default router;
