import {
  userRepository,
  subscriptionRepository,
  chatMessageRepository,
  aideRepository,
  analyticsEventRepository,
  adminRepository,
} from '../repositories/index.js';
import logger from '../utils/logger.js';
import { AppError, NotFoundError } from '../utils/errors.js';

/**
 * Admin Service
 * Handles admin-specific operations
 */
class AdminService {
  // ============================================
  // Dashboard
  // ============================================

  /**
   * Get dashboard overview stats
   */
  async getDashboard() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      // Parallel queries for efficiency
      const [
        totalUsers,
        newUsersToday,
        newUsersThisMonth,
        newUsersLastMonth,
        activeSubscriptions,
        subscriptionsByTier,
        recentSignups,
        aiMessagesThisMonth,
      ] = await Promise.all([
        userRepository.count(),
        userRepository.countCreatedSince(today),
        userRepository.countCreatedSince(thisMonth),
        userRepository.countCreatedBetween(lastMonth, thisMonth),
        subscriptionRepository.countActive(),
        subscriptionRepository.getByTierGrouped(),
        userRepository.findRecentSignups(10),
        chatMessageRepository.countInPeriod(thisMonth, new Date()),
      ]);

      // Calculate growth percentage
      const userGrowth = newUsersLastMonth > 0
        ? (((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100).toFixed(1)
        : 100;

      return {
        users: {
          total: totalUsers || 0,
          newToday: newUsersToday || 0,
          newThisMonth: newUsersThisMonth || 0,
          growth: parseFloat(userGrowth),
        },
        subscriptions: {
          active: activeSubscriptions || 0,
          byTier: subscriptionsByTier,
        },
        ai: {
          messagesThisMonth: aiMessagesThisMonth || 0,
        },
        recentSignups: recentSignups || [],
      };
    } catch (error) {
      logger.error('Failed to get admin dashboard', { error: error.message });
      throw new AppError('Failed to get dashboard data', 500);
    }
  }

  // ============================================
  // User Management
  // ============================================

  /**
   * Get all users with pagination
   */
  async getUsers(page = 1, limit = 20, filters = {}) {
    try {
      return await userRepository.findAllPaginated({
        page,
        limit,
        filters,
        orderBy: 'created_at',
        ascending: false,
      });
    } catch (error) {
      logger.error('Failed to get users', { error });
      throw new AppError('Failed to get users', 500);
    }
  }

  /**
   * Get user by ID with full details
   */
  async getUserById(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get subscription details
    const subscription = await subscriptionRepository.findActiveByUserId(userId);

    // Get AI usage
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const aiMessages = await chatMessageRepository.countUserMessagesInPeriod(userId, thisMonth.toISOString());

    return {
      ...user,
      subscription,
      stats: {
        aiMessagesThisMonth: aiMessages || 0,
      },
    };
  }

  /**
   * Update user
   */
  async updateUser(userId, updates) {
    try {
      await userRepository.update(userId, {
        ...updates,
        updated_at: new Date().toISOString(),
      });

      logger.info('User updated by admin', { userId, updates: Object.keys(updates) });
      return { success: true };
    } catch (error) {
      logger.error('Failed to update user', { userId, error });
      throw new AppError('Failed to update user', 500);
    }
  }

  /**
   * Delete/deactivate user
   */
  async deleteUser(userId) {
    try {
      // Soft delete - just deactivate
      await userRepository.softDelete(userId);

      logger.info('User deleted by admin', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete user', { userId, error });
      throw new AppError('Failed to delete user', 500);
    }
  }

  /**
   * Get user activity log
   */
  async getUserActivity(userId, limit = 50) {
    try {
      return await analyticsEventRepository.findRecentByUser(userId, limit);
    } catch (error) {
      logger.error('Failed to get user activity', { userId, error });
      throw new AppError('Failed to get user activity', 500);
    }
  }

  // ============================================
  // Subscription Management
  // ============================================

  /**
   * Get all subscriptions
   */
  async getSubscriptions(page = 1, limit = 20, filters = {}) {
    try {
      return await subscriptionRepository.findAllPaginated({
        page,
        limit,
        filters,
        orderBy: 'created_at',
        ascending: false,
      });
    } catch (error) {
      logger.error('Failed to get subscriptions', { error });
      throw new AppError('Failed to get subscriptions', 500);
    }
  }

  /**
   * Grant complimentary subscription
   */
  async grantSubscription(userId, tier, durationMonths = 1) {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + durationMonths);

      const subscription = await subscriptionRepository.create({
        user_id: userId,
        tier,
        status: 'active',
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        is_complimentary: true,
      });

      // Update user profile
      await userRepository.updateSubscriptionTier(userId, tier);

      logger.info('Complimentary subscription granted', { userId, tier, durationMonths });
      return subscription;
    } catch (error) {
      logger.error('Failed to grant subscription', { userId, error });
      throw new AppError('Failed to grant subscription', 500);
    }
  }

  /**
   * Revoke subscription
   */
  async revokeSubscription(userId) {
    try {
      await subscriptionRepository.updateStatusByUserId(userId, 'revoked');

      // Reset user to free tier
      await userRepository.updateSubscriptionTier(userId, 'free');

      logger.info('Subscription revoked', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to revoke subscription', { userId, error });
      throw new AppError('Failed to revoke subscription', 500);
    }
  }

  // ============================================
  // Content Management (Aides)
  // ============================================

  /**
   * Get aides for admin management
   */
  async getAides(page = 1, limit = 20, filters = {}) {
    try {
      return await aideRepository.findAllPaginated({
        page,
        limit,
        filters,
        orderBy: 'created_at',
        ascending: false,
      });
    } catch (error) {
      logger.error('Failed to get aides', { error });
      throw new AppError('Failed to get aides', 500);
    }
  }

  /**
   * Create new aide
   */
  async createAide(aideData) {
    try {
      const aide = await aideRepository.create(aideData);

      logger.info('Aide created', { aideId: aide.id });
      return aide;
    } catch (error) {
      logger.error('Failed to create aide', { error });
      throw new AppError('Failed to create aide', 500);
    }
  }

  /**
   * Update aide
   */
  async updateAide(aideId, updates) {
    try {
      const aide = await aideRepository.update(aideId, {
        ...updates,
        updated_at: new Date().toISOString(),
      });

      logger.info('Aide updated', { aideId });
      return aide;
    } catch (error) {
      logger.error('Failed to update aide', { aideId, error });
      throw new AppError('Failed to update aide', 500);
    }
  }

  /**
   * Delete aide
   */
  async deleteAide(aideId) {
    try {
      await aideRepository.delete(aideId);

      logger.info('Aide deleted', { aideId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete aide', { aideId, error });
      throw new AppError('Failed to delete aide', 500);
    }
  }

  // ============================================
  // Admin Management
  // ============================================

  /**
   * Get all admins
   */
  async getAdmins() {
    try {
      return await adminRepository.findAllWithUsers();
    } catch (error) {
      logger.error('Failed to get admins', { error });
      throw new AppError('Failed to get admins', 500);
    }
  }

  /**
   * Create admin
   */
  async createAdmin(userId, role, permissions = {}) {
    try {
      // Check if user exists
      const user = await userRepository.findById(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check if already admin
      const existing = await adminRepository.findByUserId(userId);

      if (existing) {
        throw new AppError('User is already an admin', 400);
      }

      const admin = await adminRepository.create({
        user_id: userId,
        role,
        permissions,
      });

      logger.info('Admin created', { userId, role });
      return admin;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to create admin', { userId, error });
      throw new AppError('Failed to create admin', 500);
    }
  }

  /**
   * Remove admin
   */
  async removeAdmin(adminId) {
    try {
      await adminRepository.delete(adminId);

      logger.info('Admin removed', { adminId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to remove admin', { adminId, error });
      throw new AppError('Failed to remove admin', 500);
    }
  }

  // ============================================
  // System
  // ============================================

  /**
   * Get system logs (simplified - in production use proper logging service)
   */
  async getLogs(page = 1, limit = 100) {
    // In a real app, this would query a logging service like Datadog, Logtail, etc.
    return {
      message: 'Logs available in logging service',
      loggingService: 'Check server logs or logging dashboard',
    };
  }

  /**
   * Clear cache (placeholder for cache implementation)
   */
  async clearCache() {
    // Implement cache clearing if you add caching (Redis, etc.)
    logger.info('Cache cleared');
    return { success: true, message: 'Cache cleared' };
  }
}

export const adminService = new AdminService();
export default adminService;
