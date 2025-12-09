import { Router } from 'express';
import * as affiliateController from '../controllers/affiliate.controller.js';
import {
  authenticate,
  validateBody,
  validateQuery,
  schemas,
} from '../middlewares/index.js';

const router = Router();

/**
 * @route   POST /affiliate/register
 * @desc    Register as an affiliate
 * @access  Private
 */
router.post(
  '/register',
  authenticate,
  validateBody(schemas.affiliateRegistration),
  affiliateController.register
);

/**
 * @route   GET /affiliate/dashboard
 * @desc    Get affiliate dashboard (stats, earnings, referrals)
 * @access  Private (affiliate only)
 */
router.get('/dashboard', authenticate, affiliateController.getDashboard);

/**
 * @route   GET /affiliate/referrals
 * @desc    Get list of referrals
 * @access  Private (affiliate only)
 */
router.get(
  '/referrals',
  authenticate,
  validateQuery(schemas.pagination),
  affiliateController.getReferrals
);

/**
 * @route   GET /affiliate/earnings
 * @desc    Get earnings history
 * @access  Private (affiliate only)
 */
router.get(
  '/earnings',
  authenticate,
  validateQuery(schemas.pagination),
  affiliateController.getEarnings
);

/**
 * @route   GET /affiliate/link
 * @desc    Get affiliate referral link
 * @access  Private (affiliate only)
 */
router.get('/link', authenticate, affiliateController.getReferralLink);

/**
 * @route   POST /affiliate/request-payout
 * @desc    Request payout of earnings
 * @access  Private (affiliate only)
 */
router.post('/request-payout', authenticate, affiliateController.requestPayout);

/**
 * @route   GET /affiliate/payouts
 * @desc    Get payout history
 * @access  Private (affiliate only)
 */
router.get(
  '/payouts',
  authenticate,
  validateQuery(schemas.pagination),
  affiliateController.getPayouts
);

/**
 * @route   PUT /affiliate/settings
 * @desc    Update affiliate settings (payout method, etc.)
 * @access  Private (affiliate only)
 */
router.put('/settings', authenticate, affiliateController.updateSettings);

// ============================================
// Public routes for tracking
// ============================================

/**
 * @route   GET /affiliate/track/:code
 * @desc    Track affiliate referral click
 * @access  Public
 */
router.get('/track/:code', affiliateController.trackClick);

export default router;
