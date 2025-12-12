import { profileService } from '../services/profile.service.js';
import { formatResponse } from '../utils/helpers.js';
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Get current user's profile
 * GET /api/v1/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const profile = await profileService.getProfile(userId);
    
    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    res.json(formatResponse(profile));
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user's profile
 * PUT /api/v1/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    const updatedProfile = await profileService.updateProfile(userId, profileData);

    res.json(formatResponse(updatedProfile));
  } catch (error) {
    next(error);
  }
};

/**
 * Upload avatar
 * POST /api/v1/profile/avatar
 */
export const uploadAvatar = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new AppError('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.', 400);
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      throw new AppError('File too large. Maximum size is 5MB.', 400);
    }

    const avatarUrl = await profileService.uploadAvatar(userId, req.file);

    res.json(formatResponse({ avatar_url: avatarUrl }));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete avatar
 * DELETE /api/v1/profile/avatar
 */
export const deleteAvatar = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await profileService.deleteAvatar(userId);

    res.json(formatResponse({ message: 'Avatar deleted successfully' }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get profile stats
 * GET /api/v1/profile/stats
 */
export const getProfileStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const stats = await profileService.getProfileStats(userId);

    res.json(formatResponse(stats));
  } catch (error) {
    next(error);
  }
};
