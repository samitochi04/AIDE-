import { Router } from 'express';
import Joi from 'joi';
import * as adminController from '../controllers/admin.controller.js';
import {
  authenticate,
  requireAdmin,
  requireSuperAdmin,
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
    })
  ),
  adminController.getAnalytics
);

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
// Content Management
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

export default router;
