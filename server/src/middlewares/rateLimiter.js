import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../utils/errors.js';
import { APP_CONFIG } from '../config/index.js';

/**
 * Create rate limiter with custom options
 */
const createLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || APP_CONFIG.rateLimit.windowMs,
    max: options.max || APP_CONFIG.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      throw new RateLimitError(
        options.message || 'Too many requests, please try again later'
      );
    },
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.id || req.ip;
    },
    ...options,
  });
};

// Default rate limiter
export const defaultLimiter = createLimiter();

// Strict limiter for auth endpoints
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many authentication attempts, please try again later',
});

// Limiter for AI chat (more restrictive)
export const chatLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many chat requests, please slow down',
});

// Limiter for webhooks (more permissive)
export const webhookLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  keyGenerator: (req) => req.ip, // Always use IP for webhooks
});

// Limiter for analytics tracking
export const analyticsLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
});

// Limiter for file uploads
export const uploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: 'Too many uploads, please try again later',
});

export default defaultLimiter;
