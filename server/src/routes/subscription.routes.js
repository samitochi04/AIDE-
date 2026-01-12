import { Router } from 'express';
import { authenticate, optionalAuth } from '../middlewares/auth.js';
import { subscriptionService, stripeService } from '../services/index.js';
import { TIER_LIMITS, SUBSCRIPTION_PRICING } from '../utils/constants.js';
import { formatResponse } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @route   GET /subscription/tiers
 * @desc    Get all subscription tiers and their features
 * @access  Public
 */
router.get('/tiers', (req, res) => {
  const tiers = Object.entries(TIER_LIMITS).map(([tier, limits]) => ({
    tier,
    ...limits,
    pricing: SUBSCRIPTION_PRICING[tier],
  }));
  
  res.json(formatResponse({ tiers }));
});

/**
 * @route   GET /subscription/status
 * @desc    Get current user's subscription status
 * @access  Private
 */
router.get('/status', authenticate, async (req, res, next) => {
  try {
    const status = await stripeService.getSubscriptionStatus(req.user.id);
    res.json(formatResponse(status));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /subscription/usage
 * @desc    Get current user's usage summary
 * @access  Private
 */
router.get('/usage', authenticate, async (req, res, next) => {
  try {
    const usage = await subscriptionService.getUsageSummary(req.user.id);
    res.json(formatResponse(usage));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /subscription/limits
 * @desc    Get current user's tier limits
 * @access  Private
 */
router.get('/limits', authenticate, async (req, res, next) => {
  try {
    const limits = await subscriptionService.getUserLimits(req.user.id);
    res.json(formatResponse(limits));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /subscription/check/:feature
 * @desc    Check if user can use a specific feature
 * @access  Private
 */
router.get('/check/:feature', authenticate, async (req, res, next) => {
  try {
    const { feature } = req.params;
    let result;
    
    switch (feature) {
      case 'ai-message':
        result = await subscriptionService.canSendAIMessage(req.user.id);
        break;
      case 'simulation':
        result = await subscriptionService.canRunSimulation(req.user.id);
        break;
      case 'save-aide':
        result = await subscriptionService.canSaveAide(req.user.id);
        break;
      case 'procedure':
        result = await subscriptionService.canTrackProcedure(req.user.id);
        break;
      case 'content':
        result = await subscriptionService.canAccessContent(req.user.id);
        break;
      case 'export':
        result = await subscriptionService.canExportData(req.user.id);
        break;
      default:
        return res.status(400).json(formatResponse(null, 'Invalid feature'));
    }
    
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /subscription/recommend
 * @desc    Get upgrade recommendation based on usage
 * @access  Private
 */
router.get('/recommend', authenticate, async (req, res, next) => {
  try {
    const recommendation = await subscriptionService.getUpgradeRecommendation(req.user.id);
    res.json(formatResponse(recommendation));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /subscription/checkout
 * @desc    Create Stripe checkout session
 * @access  Private
 */
router.post('/checkout', authenticate, async (req, res, next) => {
  try {
    const { tier, interval = 'monthly' } = req.body;
    
    if (!tier || !['basic', 'premium', 'ultimate'].includes(tier)) {
      return res.status(400).json(formatResponse(null, 'Invalid subscription tier'));
    }
    
    const session = await stripeService.createCheckoutSession(
      req.user.id,
      req.user.email,
      req.user.full_name || req.user.email,
      tier,
      interval
    );
    
    res.json(formatResponse({ sessionId: session.id, url: session.url }));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /subscription/portal
 * @desc    Create Stripe customer portal session
 * @access  Private
 */
router.post('/portal', authenticate, async (req, res, next) => {
  try {
    const session = await stripeService.createPortalSession(req.user.id);
    res.json(formatResponse({ url: session.url }));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /subscription/cancel
 * @desc    Cancel subscription at period end
 * @access  Private
 */
router.post('/cancel', authenticate, async (req, res, next) => {
  try {
    const result = await stripeService.cancelSubscription(req.user.id);
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /subscription/resume
 * @desc    Resume cancelled subscription
 * @access  Private
 */
router.post('/resume', authenticate, async (req, res, next) => {
  try {
    const result = await stripeService.resumeSubscription(req.user.id);
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
});

export default router;
