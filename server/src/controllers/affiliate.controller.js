import { affiliateService } from '../services/affiliate.service.js';
import { formatResponse } from '../utils/helpers.js';
import { ForbiddenError } from '../utils/errors.js';

/**
 * Middleware to check if user is an approved affiliate
 */
const requireAffiliate = async (req, res, next) => {
  const affiliate = await affiliateService.getByUserId(req.user.id);
  if (!affiliate || affiliate.status !== 'approved') {
    throw new ForbiddenError('Active affiliate account required');
  }
  req.affiliate = affiliate;
  next();
};

/**
 * Register as an affiliate
 */
export const register = async (req, res, next) => {
  try {
    const data = await affiliateService.register(req.user.id, {
      companyName: req.body.company_name,
      website: req.body.website,
      contactEmail: req.body.contact_email,
      description: req.body.description,
    });

    res.status(201).json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

/**
 * Get affiliate dashboard
 */
export const getDashboard = async (req, res, next) => {
  try {
    const data = await affiliateService.getDashboard(req.user.id);
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

/**
 * Get referrals list
 */
export const getReferrals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const data = await affiliateService.getReferrals(req.user.id, parseInt(page), parseInt(limit));
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

/**
 * Get earnings history
 */
export const getEarnings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const data = await affiliateService.getEarnings(req.user.id, parseInt(page), parseInt(limit));
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

/**
 * Get referral link
 */
export const getReferralLink = async (req, res, next) => {
  try {
    const data = await affiliateService.getReferralLink(req.user.id);
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

/**
 * Request payout
 */
export const requestPayout = async (req, res, next) => {
  try {
    const data = await affiliateService.requestPayout(req.user.id);
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

/**
 * Get payout history
 */
export const getPayouts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const data = await affiliateService.getPayouts(req.user.id, parseInt(page), parseInt(limit));
    res.json(formatResponse(data));
  } catch (error) {
    next(error);
  }
};

/**
 * Update affiliate settings
 */
export const updateSettings = async (req, res, next) => {
  try {
    const result = await affiliateService.updateSettings(req.user.id, req.body);
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

/**
 * Track affiliate click (public route)
 */
export const trackClick = async (req, res, next) => {
  try {
    const { code } = req.params;

    const result = await affiliateService.trackClick(code, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      referrer: req.headers['referer'],
    });

    if (result.success) {
      // Set cookie to track referral
      res.cookie('affiliate_ref', code, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      // Redirect to home page
      res.redirect(process.env.FRONTEND_URL || '/');
    } else {
      // Invalid code - redirect anyway
      res.redirect(process.env.FRONTEND_URL || '/');
    }
  } catch (error) {
    // Don't break on tracking errors - just redirect
    res.redirect(process.env.FRONTEND_URL || '/');
  }
};
