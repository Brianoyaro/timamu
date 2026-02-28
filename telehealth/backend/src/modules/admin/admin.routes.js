import express from 'express';
import {
  getAllTherapists,
  updateTherapistApproval,
  getSystemMetrics,
  getAllUsers,
  getAllBookings,
} from './admin.controller.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { isAdmin } from '../../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(authMiddleware, isAdmin);

/**
 * @route   GET /api/admin/metrics
 * @desc    Get system metrics and dashboard stats
 * @access  Private (Admin)
 */
router.get('/metrics', getSystemMetrics);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Private (Admin)
 */
router.get('/users', getAllUsers);

/**
 * @route   GET /api/admin/therapists
 * @desc    Get all therapists (pending and approved)
 * @access  Private (Admin)
 */
router.get('/therapists', getAllTherapists);

/**
 * @route   PUT /api/admin/therapists/:therapistId/approval
 * @desc    Approve or reject therapist
 * @access  Private (Admin)
 */
router.put('/therapists/:therapistId/approval', updateTherapistApproval);

/**
 * @route   GET /api/admin/bookings
 * @desc    Get all bookings
 * @access  Private (Admin)
 */
router.get('/bookings', getAllBookings);

export default router;
