import { Router } from 'express';
import Joi from 'joi';
import * as adminController from '../controllers/admin.controller.js';
import {
  authenticate,
  requireAdmin,
  requireSuperAdmin,
  requirePermission,
  validateBody,
  validateQuery,
  schemas,
} from '../middlewares/index.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ============================================
// Dashboard & Analytics
// ============================================

/**
 * @route   GET /admin/dashboard
 * @desc    Get admin dashboard overview stats
 * @access  Admin
 */
router.get('/dashboard', adminController.getDashboard);

/**
 * @route   GET /admin/analytics
 * @desc    Get detailed analytics data
 * @access  Admin
 */
router.get(
  '/analytics',
  validateQuery(
    schemas.pagination.keys({
      startDate: Joi.date(),
      endDate: Joi.date(),
      metric: Joi.string(),
      days: Joi.number().integer().min(1).max(365),
    })
  ),
  adminController.getAnalytics
);

/**
 * @route   GET /admin/activity-logs
 * @desc    Get admin activity logs
 * @access  Super Admin
 */
router.get('/activity-logs', requireSuperAdmin, adminController.getActivityLogs);

// ============================================
// User Management
// ============================================

/**
 * @route   GET /admin/users
 * @desc    Get all users (paginated)
 * @access  Admin
 */
router.get('/users', validateQuery(schemas.pagination), adminController.getUsers);

/**
 * @route   GET /admin/users/:userId
 * @desc    Get specific user details
 * @access  Admin
 */
router.get('/users/:userId', adminController.getUserById);

/**
 * @route   PATCH /admin/users/:userId
 * @desc    Update user (subscription, status, notes)
 * @access  Admin
 */
router.patch(
  '/users/:userId',
  validateBody(schemas.adminUserUpdate),
  adminController.updateUser
);

/**
 * @route   DELETE /admin/users/:userId
 * @desc    Delete/deactivate user
 * @access  Super Admin
 */
router.delete('/users/:userId', requireSuperAdmin, adminController.deleteUser);

/**
 * @route   GET /admin/users/:userId/activity
 * @desc    Get user's activity log
 * @access  Admin
 */
router.get('/users/:userId/activity', adminController.getUserActivity);

// ============================================
// Subscription Management
// ============================================

/**
 * @route   GET /admin/subscriptions
 * @desc    Get all subscriptions (paginated)
 * @access  Admin
 */
router.get(
  '/subscriptions',
  validateQuery(schemas.pagination),
  adminController.getSubscriptions
);

/**
 * @route   POST /admin/subscriptions/grant
 * @desc    Grant subscription to user (complimentary)
 * @access  Super Admin
 */
router.post(
  '/subscriptions/grant',
  requireSuperAdmin,
  adminController.grantSubscription
);

/**
 * @route   POST /admin/subscriptions/revoke
 * @desc    Revoke user subscription
 * @access  Super Admin
 */
router.post(
  '/subscriptions/revoke',
  requireSuperAdmin,
  adminController.revokeSubscription
);

// ============================================
// Content Management (Legacy Aides)
// ============================================

/**
 * @route   GET /admin/aides
 * @desc    Get all aides (for management)
 * @access  Admin
 */
router.get('/aides', validateQuery(schemas.pagination), adminController.getAides);

/**
 * @route   POST /admin/aides
 * @desc    Create new aide
 * @access  Admin
 */
router.post('/aides', adminController.createAide);

/**
 * @route   PUT /admin/aides/:aideId
 * @desc    Update aide
 * @access  Admin
 */
router.put('/aides/:aideId', adminController.updateAide);

/**
 * @route   DELETE /admin/aides/:aideId
 * @desc    Delete aide
 * @access  Super Admin
 */
router.delete('/aides/:aideId', requireSuperAdmin, adminController.deleteAide);

// ============================================
// Gov Aides Management
// ============================================

/**
 * @route   GET /admin/gov-aides
 * @desc    Get all government aides
 * @access  Admin
 */
router.get('/gov-aides', adminController.getGovAides);

/**
 * @route   POST /admin/gov-aides
 * @desc    Create government aide
 * @access  Admin
 */
router.post('/gov-aides', adminController.createGovAide);

/**
 * @route   PUT /admin/gov-aides/:aideId
 * @desc    Update government aide
 * @access  Admin
 */
router.put('/gov-aides/:aideId', adminController.updateGovAide);

/**
 * @route   DELETE /admin/gov-aides/:aideId
 * @desc    Delete government aide
 * @access  Super Admin
 */
router.delete('/gov-aides/:aideId', requireSuperAdmin, adminController.deleteGovAide);

// ============================================
// Procedures Management
// ============================================

/**
 * @route   GET /admin/procedures
 * @desc    Get all procedures
 * @access  Admin
 */
router.get('/procedures', adminController.getProcedures);

/**
 * @route   POST /admin/procedures
 * @desc    Create procedure
 * @access  Admin
 */
router.post('/procedures', adminController.createProcedure);

/**
 * @route   PUT /admin/procedures/:procedureId
 * @desc    Update procedure
 * @access  Admin
 */
router.put('/procedures/:procedureId', adminController.updateProcedure);

/**
 * @route   DELETE /admin/procedures/:procedureId
 * @desc    Delete procedure
 * @access  Super Admin
 */
router.delete('/procedures/:procedureId', requireSuperAdmin, adminController.deleteProcedure);

// ============================================
// Renting Management
// ============================================

/**
 * @route   GET /admin/renting
 * @desc    Get all renting platforms
 * @access  Admin
 */
router.get('/renting', adminController.getRentingPlatforms);

/**
 * @route   POST /admin/renting
 * @desc    Create renting platform
 * @access  Admin
 */
router.post('/renting', adminController.createRentingPlatform);

/**
 * @route   PUT /admin/renting/:platformId
 * @desc    Update renting platform
 * @access  Admin
 */
router.put('/renting/:platformId', adminController.updateRentingPlatform);

/**
 * @route   DELETE /admin/renting/:platformId
 * @desc    Delete renting platform
 * @access  Super Admin
 */
router.delete('/renting/:platformId', requireSuperAdmin, adminController.deleteRentingPlatform);

// ============================================
// Content Management (Blog & Tutorials)
// ============================================

/**
 * @route   GET /admin/contents
 * @desc    Get all content (blog, tutorials)
 * @access  Admin
 */
router.get('/contents', adminController.getContents);

/**
 * @route   GET /admin/contents/:contentId
 * @desc    Get content by ID
 * @access  Admin
 */
router.get('/contents/:contentId', adminController.getContentById);

/**
 * @route   POST /admin/contents
 * @desc    Create content
 * @access  Admin
 */
router.post('/contents', adminController.createContent);

/**
 * @route   PUT /admin/contents/:contentId
 * @desc    Update content
 * @access  Admin
 */
router.put('/contents/:contentId', adminController.updateContent);

/**
 * @route   DELETE /admin/contents/:contentId
 * @desc    Delete content
 * @access  Super Admin
 */
router.delete('/contents/:contentId', requireSuperAdmin, adminController.deleteContent);

// ============================================
// Admin Management
// ============================================

/**
 * @route   GET /admin/admins
 * @desc    Get all admin users
 * @access  Super Admin
 */
router.get('/admins', requireSuperAdmin, adminController.getAdmins);

/**
 * @route   POST /admin/admins
 * @desc    Create new admin
 * @access  Super Admin
 */
router.post(
  '/admins',
  requireSuperAdmin,
  validateBody(schemas.createAdmin),
  adminController.createAdmin
);

/**
 * @route   DELETE /admin/admins/:adminId
 * @desc    Remove admin role from user
 * @access  Super Admin
 */
router.delete('/admins/:adminId', requireSuperAdmin, adminController.removeAdmin);

/**
 * @route   PATCH /admin/admins/:adminId
 * @desc    Update admin role and permissions
 * @access  Super Admin
 */
router.patch('/admins/:adminId', requireSuperAdmin, adminController.updateAdmin);

// ============================================
// Affiliate Management
// ============================================

/**
 * @route   GET /admin/affiliates
 * @desc    Get all affiliates
 * @access  Admin
 */
router.get('/affiliates', adminController.getAffiliates);

/**
 * @route   PATCH /admin/affiliates/:affiliateId
 * @desc    Update affiliate (approve, reject, update rate)
 * @access  Admin
 */
router.patch('/affiliates/:affiliateId', adminController.updateAffiliate);

/**
 * @route   GET /admin/affiliates/:affiliateId/stats
 * @desc    Get affiliate performance stats
 * @access  Admin
 */
router.get('/affiliates/:affiliateId/stats', adminController.getAffiliateStats);

// ============================================
// System
// ============================================

/**
 * @route   GET /admin/logs
 * @desc    Get system logs
 * @access  Super Admin
 */
router.get('/logs', requireSuperAdmin, adminController.getLogs);

/**
 * @route   POST /admin/cache/clear
 * @desc    Clear system cache
 * @access  Super Admin
 */
router.post('/cache/clear', requireSuperAdmin, adminController.clearCache);

// ============================================
// Platform Updates / Notifications
// ============================================

/**
 * @route   POST /admin/notifications/platform-update
 * @desc    Send platform update notification to all users
 * @access  Super Admin
 */
router.post(
  '/notifications/platform-update',
  requireSuperAdmin,
  validateBody(
    Joi.object({
      title: Joi.string().required().max(200),
      content: Joi.string().required().max(5000),
      ctaText: Joi.string().max(50),
      ctaUrl: Joi.string().uri(),
    })
  ),
  adminController.sendPlatformUpdate
);

// ============================================
// Email Management
// ============================================

/**
 * @route   GET /admin/emails/stats
 * @desc    Get email sending statistics
 * @access  Admin
 */
router.get('/emails/stats', adminController.getEmailStats);

/**
 * @route   GET /admin/emails/recent
 * @desc    Get recent email logs
 * @access  Admin
 */
router.get('/emails/recent', adminController.getRecentEmails);

/**
 * @route   GET /admin/emails/templates
 * @desc    Get all email templates
 * @access  Admin
 */
router.get('/emails/templates', adminController.getEmailTemplates);

/**
 * @route   PATCH /admin/emails/templates/:templateKey
 * @desc    Update an email template
 * @access  Super Admin
 */
router.patch(
  '/emails/templates/:templateKey',
  requireSuperAdmin,
  validateBody(
    Joi.object({
      subject: Joi.string().max(200),
      body_html: Joi.string().max(50000),
      body_text: Joi.string().max(10000),
      is_active: Joi.boolean(),
    })
  ),
  adminController.updateEmailTemplate
);

// ============================================
// Bulk Email
// ============================================

/**
 * @route   GET /admin/bulk-emails/recipients
 * @desc    Get users matching filters for bulk email preview
 * @access  Admin
 */
router.get('/bulk-emails/recipients', adminController.getBulkEmailRecipients);

/**
 * @route   GET /admin/bulk-emails
 * @desc    Get all bulk email campaigns
 * @access  Admin
 */
router.get('/bulk-emails', adminController.getBulkEmails);

/**
 * @route   POST /admin/bulk-emails
 * @desc    Create bulk email campaign
 * @access  Super Admin
 */
router.post(
  '/bulk-emails',
  requireSuperAdmin,
  validateBody(
    Joi.object({
      subject: Joi.string().required().max(200),
      subject_fr: Joi.string().allow('').max(200),
      content: Joi.string().required().max(100000),
      content_fr: Joi.string().allow('').max(100000),
      body_html: Joi.string().max(100000),
      body_text: Joi.string().max(50000),
      filters: Joi.object({
        all: Joi.boolean(),
        subscribers_only: Joi.boolean(),
        profile_type: Joi.string().allow(''),
        nationality: Joi.string().allow(''),
        has_subscription: Joi.string().allow(''),
        region: Joi.string().allow(''),
        saved_aide_id: Joi.string().allow(''),
        custom_emails: Joi.string().allow(''),
      }),
      scheduled_at: Joi.date(),
    })
  ),
  adminController.createBulkEmail
);

// ============================================
// App Settings
// ============================================

/**
 * @route   GET /admin/settings
 * @desc    Get all app settings
 * @access  Super Admin
 */
router.get('/settings', requireSuperAdmin, adminController.getSettings);

/**
 * @route   PUT /admin/settings
 * @desc    Bulk update app settings
 * @access  Super Admin
 */
router.put('/settings', requireSuperAdmin, adminController.bulkUpdateSettings);

/**
 * @route   PATCH /admin/settings/:key
 * @desc    Update app setting
 * @access  Super Admin
 */
router.patch(
  '/settings/:key',
  requireSuperAdmin,
  validateBody(
    Joi.object({
      value: Joi.any().required(),
    })
  ),
  adminController.updateSetting
);

export default router;
