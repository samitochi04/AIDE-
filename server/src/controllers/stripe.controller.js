import { stripeService } from '../services/stripe.service.js';
import { formatResponse } from '../utils/helpers.js';
import logger from '../utils/logger.js';

/**
 * Handle Stripe webhooks
 */
export const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    const result = await stripeService.handleWebhook(req.body, signature);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Create checkout session for subscription
 */
export const createCheckoutSession = async (req, res, next) => {
  try {
    const { tier, interval = 'monthly' } = req.body;
    const { id: userId, email, user_metadata } = req.user;
    const name = user_metadata?.full_name || user_metadata?.name || email;

    // Validate tier and interval
    const validTiers = ['basic', 'premium', 'ultimate'];
    const validIntervals = ['monthly', 'yearly'];
    
    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        success: false,
        error: `Invalid tier. Must be one of: ${validTiers.join(', ')}`,
      });
    }
    
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({
        success: false,
        error: `Invalid interval. Must be one of: ${validIntervals.join(', ')}`,
      });
    }

    const session = await stripeService.createCheckoutSession(userId, email, name, tier, interval);

    res.json(formatResponse({ sessionId: session.id, url: session.url }));
  } catch (error) {
    next(error);
  }
};

/**
 * Create customer portal session
 */
export const createPortalSession = async (req, res, next) => {
  try {
    const session = await stripeService.createPortalSession(req.user.id);
    res.json(formatResponse({ url: session.url }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get subscription status
 */
export const getSubscriptionStatus = async (req, res, next) => {
  try {
    const status = await stripeService.getSubscriptionStatus(req.user.id);
    res.json(formatResponse(status));
  } catch (error) {
    next(error);
  }
};

/**
 * Get available prices
 */
export const getPrices = async (req, res, next) => {
  try {
    const prices = await stripeService.getPrices();
    res.json(formatResponse({ prices }));
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (req, res, next) => {
  try {
    const result = await stripeService.cancelSubscription(req.user.id);
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

/**
 * Resume cancelled subscription
 */
export const resumeSubscription = async (req, res, next) => {
  try {
    const result = await stripeService.resumeSubscription(req.user.id);
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};
