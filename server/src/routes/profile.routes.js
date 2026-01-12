import { Router } from 'express';
import multer from 'multer';
import * as profileController from '../controllers/profile.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// Configure multer for memory storage (for Supabase upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * @route   GET /profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/', authenticate, profileController.getProfile);

/**
 * @route   PUT /profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.put('/', authenticate, profileController.updateProfile);

/**
 * @route   DELETE /profile
 * @desc    Delete account (soft delete)
 * @access  Private
 */
router.delete('/', authenticate, profileController.deleteAccount);

/**
 * @route   GET /profile/stats
 * @desc    Get profile statistics
 * @access  Private
 */
router.get('/stats', authenticate, profileController.getProfileStats);

/**
 * @route   POST /profile/avatar
 * @desc    Upload avatar image
 * @access  Private
 */
router.post('/avatar', authenticate, upload.single('avatar'), profileController.uploadAvatar);

/**
 * @route   DELETE /profile/avatar
 * @desc    Delete avatar image
 * @access  Private
 */
router.delete('/avatar', authenticate, profileController.deleteAvatar);

/**
 * @route   PATCH /profile/notifications
 * @desc    Update notification preferences
 * @access  Private
 */
router.patch('/notifications', authenticate, profileController.updateNotificationPreferences);

/**
 * @route   POST /profile/change-password
 * @desc    Change password
 * @access  Private
 */
router.post('/change-password', authenticate, profileController.changePassword);

/**
 * @route   POST /profile/export
 * @desc    Request data export (PDF)
 * @access  Private
 */
router.post('/export', authenticate, profileController.requestDataExport);

/**
 * @route   GET /profile/export/:exportId
 * @desc    Get export status
 * @access  Private
 */
router.get('/export/:exportId', authenticate, profileController.getExportStatus);

/**
 * @route   GET /profile/exports
 * @desc    Get export history
 * @access  Private
 */
router.get('/exports', authenticate, profileController.getExportHistory);

/**
 * @route   GET /profile/sessions
 * @desc    Get active sessions
 * @access  Private
 */
router.get('/sessions', authenticate, profileController.getSessions);

/**
 * @route   POST /profile/sign-out-all
 * @desc    Sign out from all devices
 * @access  Private
 */
router.post('/sign-out-all', authenticate, profileController.signOutAllDevices);

export default router;
