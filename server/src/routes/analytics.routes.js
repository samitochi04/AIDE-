import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import {
  authenticate,
  optionalAuth,
  validateBody,
  schemas,
  analyticsLimiter,
} from '../middlewares/index.js';

const router = Router();

/**
 * @route   POST /analytics/event
 * @desc    Track a user event (page view, action, etc.)
 * @access  Public (optional auth for user attribution)
 */
router.post(
  '/event',
  analyticsLimiter,
  optionalAuth,
  validateBody(schemas.analyticsEvent),
  analyticsController.trackEvent
);

/**
 * @route   POST /analytics/aide-view
 * @desc    Track when user views an aide detail page
 * @access  Public (optional auth)
 */
router.post(
  '/aide-view',
  analyticsLimiter,
  optionalAuth,
  analyticsController.trackAideView
);

/**
 * @route   POST /analytics/aide-click
 * @desc    Track when user clicks to apply for an aide
 * @access  Public (optional auth)
 */
router.post(
  '/aide-click',
  analyticsLimiter,
  optionalAuth,
  analyticsController.trackAideClick
);

/**
 * @route   POST /analytics/search
 * @desc    Track search queries
 * @access  Public (optional auth)
 */
router.post(
  '/search',
  analyticsLimiter,
  optionalAuth,
  analyticsController.trackSearch
);

/**
 * @route   POST /analytics/session-start
 * @desc    Track session start
 * @access  Public
 */
router.post('/session-start', analyticsLimiter, analyticsController.trackSessionStart);

/**
 * @route   POST /analytics/session-end
 * @desc    Track session end with duration
 * @access  Public
 */
router.post('/session-end', analyticsLimiter, analyticsController.trackSessionEnd);

export default router;
