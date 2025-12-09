import Joi from 'joi';

/**
 * Affiliate validation schemas
 */

// Affiliate status
export const AFFILIATE_STATUSES = ['pending', 'approved', 'rejected', 'suspended'];

// Affiliate registration schema
export const affiliateRegistrationSchema = Joi.object({
  company_name: Joi.string().max(255).allow('', null),
  website: Joi.string().uri().max(500).allow('', null),
  contact_email: Joi.string().email().required(),
  description: Joi.string().max(1000).allow('', null),
  promotion_methods: Joi.array().items(Joi.string().max(100)),
});

// Affiliate schema
export const affiliateSchema = Joi.object({
  id: Joi.string().uuid(),
  user_id: Joi.string().uuid().required(),
  referral_code: Joi.string().min(6).max(20).uppercase().required(),
  company_name: Joi.string().max(255).allow(null),
  website: Joi.string().uri().max(500).allow(null),
  contact_email: Joi.string().email().required(),
  description: Joi.string().max(1000).allow(null),
  status: Joi.string().valid(...AFFILIATE_STATUSES).default('pending'),
  commission_rate: Joi.number().min(0).max(1).default(0.1), // 10% default
  payout_method: Joi.string().valid('bank_transfer', 'paypal', 'stripe').allow(null),
  payout_details: Joi.object().allow(null),
  total_clicks: Joi.number().integer().min(0).default(0),
  total_referrals: Joi.number().integer().min(0).default(0),
  total_earnings: Joi.number().min(0).default(0),
  created_at: Joi.date(),
  updated_at: Joi.date(),
});

// Affiliate click schema
export const affiliateClickSchema = Joi.object({
  id: Joi.string().uuid(),
  affiliate_id: Joi.string().uuid().required(),
  ip_address: Joi.string().ip().allow(null),
  user_agent: Joi.string().max(500).allow(null),
  referrer: Joi.string().uri().max(500).allow(null),
  created_at: Joi.date(),
});

// Affiliate referral schema
export const affiliateReferralSchema = Joi.object({
  id: Joi.string().uuid(),
  affiliate_id: Joi.string().uuid().required(),
  referred_user_id: Joi.string().uuid().required(),
  status: Joi.string().valid('pending', 'converted', 'expired').default('pending'),
  converted_at: Joi.date().allow(null),
  created_at: Joi.date(),
});

// Affiliate earning schema
export const affiliateEarningSchema = Joi.object({
  id: Joi.string().uuid(),
  affiliate_id: Joi.string().uuid().required(),
  referral_id: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).default('EUR'),
  status: Joi.string().valid('pending', 'approved', 'paid', 'rejected').default('pending'),
  created_at: Joi.date(),
});

// Affiliate payout request schema
export const affiliatePayoutRequestSchema = Joi.object({
  amount: Joi.number().positive().min(50).required(), // minimum €50
  payout_method: Joi.string().valid('bank_transfer', 'paypal', 'stripe').required(),
});

// Affiliate payout schema
export const affiliatePayoutSchema = Joi.object({
  id: Joi.string().uuid(),
  affiliate_id: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).default('EUR'),
  status: Joi.string().valid('requested', 'processing', 'completed', 'failed').default('requested'),
  payout_method: Joi.string().valid('bank_transfer', 'paypal', 'stripe').required(),
  transaction_id: Joi.string().allow(null),
  processed_at: Joi.date().allow(null),
  created_at: Joi.date(),
});

// Admin affiliate update schema
export const affiliateUpdateSchema = Joi.object({
  status: Joi.string().valid(...AFFILIATE_STATUSES),
  commission_rate: Joi.number().min(0).max(0.5), // max 50%
  admin_notes: Joi.string().max(1000),
});

export default {
  AFFILIATE_STATUSES,
  affiliateRegistrationSchema,
  affiliateSchema,
  affiliateClickSchema,
  affiliateReferralSchema,
  affiliateEarningSchema,
  affiliatePayoutRequestSchema,
  affiliatePayoutSchema,
  affiliateUpdateSchema,
};
