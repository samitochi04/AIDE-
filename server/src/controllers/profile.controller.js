import { profileService } from '../services/profile.service.js';
import { pdfExportService } from '../services/pdfExport.service.js';
import { emailService } from '../services/email.service.js';
import { supabaseAdmin } from '../config/supabase.js';
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

/**
 * Update notification preferences
 * PATCH /api/v1/profile/notifications
 */
export const updateNotificationPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { preferences } = req.body;

    if (!preferences) {
      throw new AppError('Preferences are required', 400);
    }

    // Use the profileService to update email_preferences
    const updatedProfile = await profileService.updateNotificationPreferences(userId, preferences);

    res.json(formatResponse({
      message: 'Notification preferences updated',
      preferences: updatedProfile.email_preferences,
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * POST /api/v1/profile/change-password
 */
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }

    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters', 400);
    }

    // Get user email
    const profile = await profileService.getProfile(userId);
    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    // Verify current password by attempting sign in
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Update password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      throw updateError;
    }

    // Send confirmation email
    await emailService.sendPasswordChanged(profile.email, {
      name: profile.full_name,
    });

    res.json(formatResponse({ message: 'Password changed successfully' }));
  } catch (error) {
    next(error);
  }
};

/**
 * Request data export (PDF)
 * POST /api/v1/profile/export
 */
export const requestDataExport = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check for recent export (rate limit - 1 per day)
    // Can be bypassed in development with BYPASS_EXPORT_RATE_LIMIT=true
    const bypassRateLimit = process.env.BYPASS_EXPORT_RATE_LIMIT === 'true';
    
    if (!bypassRateLimit) {
      const { data: recentExports } = await supabaseAdmin
        .from('data_exports')
        .select('id, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentExports && recentExports.length > 0) {
        throw new AppError('You can only request one export per day. Please try again later.', 429);
      }
    }

    // Start export process (runs in background)
    const exportRecord = await pdfExportService.requestExport(userId, 'settings');

    res.json(formatResponse({
      message: 'Export started. You will receive an email when it\'s ready.',
      exportId: exportRecord.id,
      status: exportRecord.status,
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get export status
 * GET /api/v1/profile/export/:exportId
 */
export const getExportStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { exportId } = req.params;

    const exportRecord = await pdfExportService.getExportStatus(exportId, userId);

    if (!exportRecord) {
      throw new AppError('Export not found', 404);
    }

    res.json(formatResponse(exportRecord));
  } catch (error) {
    next(error);
  }
};

/**
 * Get export history
 * GET /api/v1/profile/exports
 */
export const getExportHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const exports = await pdfExportService.getExportHistory(userId);

    res.json(formatResponse(exports));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete account (soft delete)
 * DELETE /api/v1/profile
 */
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { feedback, password } = req.body;

    // Get user profile
    const profile = await profileService.getProfile(userId);
    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    // Verify password if provided (for security)
    if (password) {
      const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: profile.email,
        password: password,
      });

      if (signInError) {
        throw new AppError('Password verification failed', 401);
      }
    }

    // Archive profile data before soft delete
    const { data: archiveResult, error: archiveError } = await supabaseAdmin.rpc(
      'archive_deleted_profile',
      {
        p_user_id: userId,
        p_reason: 'user_requested',
        p_feedback: feedback || null,
      }
    );

    if (archiveError) {
      logger.error('Failed to archive profile', { userId, error: archiveError.message });
      // Continue with soft delete even if archive fails
    }

    // Soft delete the profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // Send goodbye email
    await emailService.sendAccountDeleted(profile.email, {
      name: profile.full_name,
    });

    // Sign out user (invalidate session)
    await supabaseAdmin.auth.admin.signOut(userId);

    logger.info('Account deleted (soft)', { userId, archiveId: archiveResult });

    res.json(formatResponse({
      message: 'Account deleted successfully. We\'re sorry to see you go.',
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get active sessions
 * GET /api/v1/profile/sessions
 */
export const getSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user's sessions from Supabase auth
    // Note: Supabase doesn't expose detailed session info via API
    // We'll return the current session info we have
    const currentSession = {
      id: 'current',
      device: req.headers['user-agent'] || 'Unknown',
      ip: req.ip || req.connection?.remoteAddress || 'Unknown',
      lastActive: new Date().toISOString(),
      isCurrent: true,
    };

    res.json(formatResponse({
      sessions: [currentSession],
      message: 'Session management coming soon',
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Sign out all devices
 * POST /api/v1/profile/sign-out-all
 */
export const signOutAllDevices = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Sign out user from all sessions using admin API
    const { error } = await supabaseAdmin.auth.admin.signOut(userId, 'global');

    if (error) {
      throw error;
    }

    logger.info('User signed out from all devices', { userId });

    res.json(formatResponse({
      message: 'Signed out from all devices successfully',
    }));
  } catch (error) {
    next(error);
  }
};
