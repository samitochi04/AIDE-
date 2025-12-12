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

export default router;
