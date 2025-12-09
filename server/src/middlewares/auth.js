import { supabaseAdmin } from '../config/supabase.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Verify JWT token and attach user to request
 * Extracts token from Authorization header
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logger.warn(`Profile not found for user ${user.id}`);
    }

    // Attach user and profile to request
    req.user = user;
    req.profile = profile;
    req.token = token;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for routes that work for both authenticated and anonymous users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }

    const token = authHeader.split(' ')[1];

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && user) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      req.user = user;
      req.profile = profile;
      req.token = token;
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};

/**
 * Check if user has a specific subscription tier or higher
 */
export const requireSubscription = (minTier) => {
  const tierLevels = {
    free: 0,
    basic: 1,
    premium: 2,
    enterprise: 3,
  };

  return (req, res, next) => {
    if (!req.profile) {
      return next(new UnauthorizedError());
    }

    const userTierLevel = tierLevels[req.profile.subscription_tier] || 0;
    const requiredLevel = tierLevels[minTier] || 0;

    if (userTierLevel < requiredLevel) {
      return next(new ForbiddenError(`This feature requires ${minTier} subscription or higher`));
    }

    next();
  };
};

export default authenticate;
