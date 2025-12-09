import { Router } from 'express';
import express from 'express';
import * as stripeController from '../controllers/stripe.controller.js';
import { authenticate, validateBody, schemas, webhookLimiter } from '../middlewares/index.js';

const router = Router();

/**
 * @route   POST /stripe/webhook
 * @desc    Handle Stripe webhooks (subscription events, payment events)
 * @access  Public (verified by Stripe signature)
 * @note    Uses raw body parser for signature verification
 */
router.post(
  '/webhook',
  webhookLimiter,
  express.raw({ type: 'application/json' }),
  stripeController.handleWebhook
);

/**
 * @route   POST /stripe/create-checkout-session
 * @desc    Create Stripe checkout session for subscription
 * @access  Private
 */
router.post(
  '/create-checkout-session',
  authenticate,
  stripeController.createCheckoutSession
);

/**
 * @route   POST /stripe/create-portal-session
 * @desc    Create Stripe customer portal session for managing subscription
 * @access  Private
 */
router.post(
  '/create-portal-session',
  authenticate,
  stripeController.createPortalSession
);

/**
 * @route   GET /stripe/subscription-status
 * @desc    Get current user's subscription status
 * @access  Private
 */
router.get(
  '/subscription-status',
  authenticate,
  stripeController.getSubscriptionStatus
);

/**
 * @route   GET /stripe/prices
 * @desc    Get available subscription prices
 * @access  Public
 */
router.get('/prices', stripeController.getPrices);

/**
 * @route   POST /stripe/cancel-subscription
 * @desc    Cancel user's subscription (at period end)
 * @access  Private
 */
router.post(
  '/cancel-subscription',
  authenticate,
  stripeController.cancelSubscription
);

/**
 * @route   POST /stripe/resume-subscription
 * @desc    Resume a cancelled subscription (if not yet ended)
 * @access  Private
 */
router.post(
  '/resume-subscription',
  authenticate,
  stripeController.resumeSubscription
);

export default router;
