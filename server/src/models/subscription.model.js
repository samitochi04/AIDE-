import Joi from 'joi';

/**
 * Subscription validation schemas
 */

// Subscription tiers
export const TIERS = ['free', 'basic', 'plus', 'premium'];

// Subscription status
export const STATUSES = ['active', 'cancelled', 'past_due', 'incomplete', 'trialing', 'revoked'];

// Subscription schema
export const subscriptionSchema = Joi.object({
  id: Joi.string().uuid(),
  user_id: Joi.string().uuid().required(),
  stripe_subscription_id: Joi.string().allow(null),
  stripe_customer_id: Joi.string().allow(null),
  tier: Joi.string().valid(...TIERS).required(),
  status: Joi.string().valid(...STATUSES).required(),
  current_period_start: Joi.date().required(),
  current_period_end: Joi.date().required(),
  cancel_at_period_end: Joi.boolean().default(false),
  is_complimentary: Joi.boolean().default(false),
  created_at: Joi.date(),
  updated_at: Joi.date(),
});

// Checkout session request schema
export const checkoutRequestSchema = Joi.object({
  tier: Joi.string().valid('basic', 'plus', 'premium').required(),
  successUrl: Joi.string().uri(),
  cancelUrl: Joi.string().uri(),
});

// Payment schema
export const paymentSchema = Joi.object({
  id: Joi.string().uuid(),
  stripe_invoice_id: Joi.string().required(),
  stripe_subscription_id: Joi.string(),
  user_id: Joi.string().uuid(),
  amount: Joi.number().integer().min(0).required(), // in cents
  currency: Joi.string().length(3).default('eur'),
  status: Joi.string().valid('succeeded', 'failed', 'pending', 'refunded').required(),
  created_at: Joi.date(),
});

// Promo code schema
export const promoCodeSchema = Joi.object({
  id: Joi.string().uuid(),
  code: Joi.string().min(3).max(50).uppercase().required(),
  discount_type: Joi.string().valid('percentage', 'fixed').required(),
  discount_value: Joi.number().positive().required(),
  max_uses: Joi.number().integer().min(1).allow(null),
  current_uses: Joi.number().integer().min(0).default(0),
  valid_from: Joi.date().required(),
  valid_until: Joi.date().greater(Joi.ref('valid_from')).allow(null),
  applicable_tiers: Joi.array().items(Joi.string().valid(...TIERS)),
  is_active: Joi.boolean().default(true),
  created_at: Joi.date(),
});

// Grant subscription request (admin)
export const grantSubscriptionSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  tier: Joi.string().valid('basic', 'plus', 'premium').required(),
  durationMonths: Joi.number().integer().min(1).max(24).default(1),
  reason: Joi.string().max(500),
});

export default {
  TIERS,
  STATUSES,
  subscriptionSchema,
  checkoutRequestSchema,
  paymentSchema,
  promoCodeSchema,
  grantSubscriptionSchema,
};
