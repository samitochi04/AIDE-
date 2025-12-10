import { supabaseAdmin } from '../config/supabase.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { ADMIN_ROLES } from '../utils/constants.js';

/**
 * Check if user is an admin
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error || !admin) {
      throw new ForbiddenError('Admin access required');
    }

    req.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has specific admin role
 */
export const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.admin) {
        // If requireAdmin wasn't called first, check now
        if (!req.user) {
          throw new UnauthorizedError();
        }

        const { data: admin, error } = await supabaseAdmin
          .from('admins')
          .select('*')
          .eq('user_id', req.user.id)
          .single();

        if (error || !admin) {
          throw new ForbiddenError('Admin access required');
        }

        req.admin = admin;
      }

      if (!allowedRoles.includes(req.admin.role)) {
        throw new ForbiddenError(`Required role: ${allowedRoles.join(' or ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if admin has specific permission
 */
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.admin) {
        throw new ForbiddenError('Admin access required');
      }

      // Super admins have all permissions
      if (req.admin.role === ADMIN_ROLES.SUPER_ADMIN) {
        return next();
      }

      const permissions = req.admin.permissions || {};
      if (!permissions[permission]) {
        throw new ForbiddenError(`Permission required: ${permission}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Convenience middleware: require super admin role
 */
export const requireSuperAdmin = requireRole(ADMIN_ROLES.SUPER_ADMIN);

export default requireAdmin;
