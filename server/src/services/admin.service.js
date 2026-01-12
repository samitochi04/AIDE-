import {
  userRepository,
  subscriptionRepository,
  chatMessageRepository,
  aideRepository,
  analyticsEventRepository,
  adminRepository,
  adminActivityLogRepository,
  bulkEmailRepository,
  bulkEmailRecipientsRepository,
  appSettingsRepository,
  contentRepository,
  govAidesRepository,
  proceduresRepository,
  adminRentingRepository,
  affiliateRepository,
} from '../repositories/index.js';
import emailService from './email.service.js';
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
    try {
      const user = await userRepository.findById(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get subscription details
      const subscription = await subscriptionRepository.findActiveByUserId(userId).catch(() => null);

      // Get AI usage
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const aiMessages = await chatMessageRepository.countUserMessagesInPeriod(userId, thisMonth.toISOString()).catch(() => 0);

      return {
        ...user,
        subscription,
        stats: {
          aiMessagesThisMonth: aiMessages || 0,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Failed to get user by ID', { userId, error: error.message });
      throw new AppError('Failed to get user details', 500);
    }
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
   * Get user activity log - structured for frontend
   */
  async getUserActivity(userId) {
    try {
      // Fetch all relevant user activity in parallel
      const [savedAides, procedures, chats, simulations] = await Promise.all([
        // Saved aides
        this.db
          .from('saved_aides')
          .select('id, aide_id, aide_name, status, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20)
          .then(({ data, error }) => {
            if (error) logger.warn('Error fetching saved_aides', { error: error.message });
            return data || [];
          }),

        // User procedures
        this.db
          .from('user_procedures')
          .select('id, procedure_id, procedure_name, status, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20)
          .then(({ data, error }) => {
            if (error) logger.warn('Error fetching user_procedures', { error: error.message });
            return data || [];
          }),

        // Chat conversations
        this.db
          .from('chat_conversations')
          .select('id, title, updated_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(20)
          .then(async ({ data, error }) => {
            if (error) {
              logger.warn('Error fetching chat_conversations', { error: error.message });
              return [];
            }
            // Get message counts separately
            const conversations = data || [];
            for (const conv of conversations) {
              const { count } = await this.db
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.id);
              conv.message_count = count || 0;
            }
            return conversations;
          }),

        // Simulations
        this.db
          .from('simulations')
          .select('id, created_at, eligible_aides_count')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20)
          .then(({ data, error }) => {
            if (error) logger.warn('Error fetching simulations', { error: error.message });
            return data || [];
          }),
      ]);

      return {
        savedAides,
        procedures,
        chats,
        simulations,
      };
    } catch (error) {
      logger.error('Failed to get user activity', { userId, error });
      throw new AppError('Failed to get user activity', 500);
    }
  }

  // Need to add db reference
  get db() {
    return userRepository.db;
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
  async getAdmins(options = {}) {
    try {
      const { search, role, page = 1, limit = 20 } = options;
      let admins = await adminRepository.findAllWithUsers();
      
      // Filter by search
      if (search) {
        const searchLower = search.toLowerCase();
        admins = admins.filter(admin => 
          admin.user?.email?.toLowerCase().includes(searchLower) ||
          admin.user?.full_name?.toLowerCase().includes(searchLower)
        );
      }
      
      // Filter by role
      if (role) {
        admins = admins.filter(admin => admin.role === role);
      }
      
      // Pagination
      const total = admins.length;
      const start = (page - 1) * limit;
      const paginatedAdmins = admins.slice(start, start + limit);
      
      return {
        admins: paginatedAdmins,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to get admins', { error });
      throw new AppError('Failed to get admins', 500);
    }
  }

  /**
   * Create admin
   */
  async createAdmin(email, role, permissions = {}) {
    try {
      // Look up user by email
      const user = await userRepository.findByEmail(email);

      if (!user) {
        throw new NotFoundError('User not found with that email');
      }

      // Check if already admin
      const existing = await adminRepository.findByUserId(user.id);

      if (existing) {
        throw new AppError('User is already an admin', 400);
      }

      const admin = await adminRepository.create({
        user_id: user.id,
        role,
        permissions,
      });

      logger.info('Admin created', { userId: user.id, email, role });
      return admin;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to create admin', { email, error });
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

  /**
   * Update admin role and permissions
   */
  async updateAdmin(adminId, { role, permissions }) {
    try {
      const updateData = {};
      if (role) updateData.role = role;
      if (permissions) updateData.permissions = permissions;

      const { data, error } = await adminRepository.update(adminId, updateData);

      if (error) {
        throw error;
      }

      logger.info('Admin updated', { adminId, role });
      return { success: true, admin: data };
    } catch (error) {
      logger.error('Failed to update admin', { adminId, error });
      throw new AppError('Failed to update admin', 500);
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

  // ============================================
  // Activity Logging
  // ============================================

  /**
   * Log admin activity
   */
  async logActivity(adminId, action, resourceType, resourceId = null, details = {}, metadata = {}) {
    try {
      await adminActivityLogRepository.logAction(adminId, action, resourceType, resourceId, details, metadata);
    } catch (error) {
      logger.error('Failed to log admin activity', { adminId, action, error: error.message });
      // Don't throw - logging should not break operations
    }
  }

  /**
   * Get activity logs
   */
  async getActivityLogs(options = {}) {
    try {
      return await adminActivityLogRepository.findWithFilters(options);
    } catch (error) {
      logger.error('Failed to get activity logs', { error });
      throw new AppError('Failed to get activity logs', 500);
    }
  }

  // ============================================
  // Content Management (Blog & Tutorials)
  // ============================================

  /**
   * Get all content with filters
   */
  async getContents(page = 1, limit = 20, filters = {}) {
    try {
      return await contentRepository.findAllPaginated({ page, limit, ...filters });
    } catch (error) {
      logger.error('Failed to get contents', { error });
      throw new AppError('Failed to get contents', 500);
    }
  }

  /**
   * Get content by ID
   */
  async getContentById(contentId) {
    const content = await contentRepository.findById(contentId);
    if (!content) {
      throw new NotFoundError('Content not found');
    }
    return content;
  }

  /**
   * Get content by slug (public)
   */
  async getContentBySlug(slug) {
    const content = await contentRepository.findBySlug(slug);
    if (!content || !content.is_published) {
      throw new NotFoundError('Content not found');
    }
    // Increment view count
    await contentRepository.incrementViews(content.id);
    return content;
  }

  /**
   * Create content
   */
  async createContent(contentData, adminId) {
    try {
      // Generate slug if not provided
      if (!contentData.slug && contentData.title) {
        contentData.slug = this._generateSlug(contentData.title);
      }

      const content = await contentRepository.create({
        ...contentData,
        created_by: adminId,
      });

      await this.logActivity(adminId, 'create', 'content', content.id, { title: contentData.title });
      logger.info('Content created', { contentId: content.id });
      return content;
    } catch (error) {
      logger.error('Failed to create content', { error });
      throw new AppError('Failed to create content', 500);
    }
  }

  /**
   * Update content
   */
  async updateContent(contentId, updates, adminId) {
    try {
      // Update slug if title changed
      if (updates.title && !updates.slug) {
        updates.slug = this._generateSlug(updates.title);
      }

      // Set published_at if publishing
      if (updates.is_published && !updates.published_at) {
        updates.published_at = new Date().toISOString();
      }

      const content = await contentRepository.update(contentId, {
        ...updates,
        updated_at: new Date().toISOString(),
      });

      await this.logActivity(adminId, 'update', 'content', contentId, { fields: Object.keys(updates) });
      logger.info('Content updated', { contentId });
      return content;
    } catch (error) {
      logger.error('Failed to update content', { contentId, error });
      throw new AppError('Failed to update content', 500);
    }
  }

  /**
   * Delete content
   */
  async deleteContent(contentId, adminId) {
    try {
      await contentRepository.delete(contentId);
      await this.logActivity(adminId, 'delete', 'content', contentId);
      logger.info('Content deleted', { contentId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete content', { contentId, error });
      throw new AppError('Failed to delete content', 500);
    }
  }

  /**
   * Get published content (public)
   */
  async getPublishedContents(options = {}) {
    try {
      return await contentRepository.findPublished(options);
    } catch (error) {
      logger.error('Failed to get published contents', { error });
      throw new AppError('Failed to get contents', 500);
    }
  }

  // ============================================
  // Gov Aides Management
  // ============================================

  /**
   * Get all gov aides
   */
  async getGovAides(page = 1, limit = 20, filters = {}) {
    try {
      return await govAidesRepository.findAllPaginated({ page, limit, ...filters });
    } catch (error) {
      logger.error('Failed to get gov aides', { error });
      throw new AppError('Failed to get gov aides', 500);
    }
  }

  /**
   * Create gov aide
   */
  async createGovAide(aideData, adminId) {
    try {
      const aide = await govAidesRepository.create(aideData);
      await this.logActivity(adminId, 'create', 'gov_aide', aide.id, { name: aideData.aide_name });
      logger.info('Gov aide created', { aideId: aide.id });
      return aide;
    } catch (error) {
      logger.error('Failed to create gov aide', { error });
      throw new AppError('Failed to create gov aide', 500);
    }
  }

  /**
   * Update gov aide
   */
  async updateGovAide(aideId, updates, adminId) {
    try {
      const aide = await govAidesRepository.update(aideId, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
      await this.logActivity(adminId, 'update', 'gov_aide', aideId, { fields: Object.keys(updates) });
      logger.info('Gov aide updated', { aideId });
      return aide;
    } catch (error) {
      logger.error('Failed to update gov aide', { aideId, error });
      throw new AppError('Failed to update gov aide', 500);
    }
  }

  /**
   * Delete gov aide
   */
  async deleteGovAide(aideId, adminId) {
    try {
      await govAidesRepository.delete(aideId);
      await this.logActivity(adminId, 'delete', 'gov_aide', aideId);
      logger.info('Gov aide deleted', { aideId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete gov aide', { aideId, error });
      throw new AppError('Failed to delete gov aide', 500);
    }
  }

  // ============================================
  // Procedures Management
  // ============================================

  /**
   * Get all procedures
   */
  async getProcedures(page = 1, limit = 20, filters = {}) {
    try {
      return await proceduresRepository.findAllPaginated({ page, limit, ...filters });
    } catch (error) {
      logger.error('Failed to get procedures', { error });
      throw new AppError('Failed to get procedures', 500);
    }
  }

  /**
   * Create procedure
   */
  async createProcedure(procedureData, adminId) {
    try {
      const procedure = await proceduresRepository.create(procedureData);
      await this.logActivity(adminId, 'create', 'procedure', procedure.id, { name: procedureData.procedure_name });
      logger.info('Procedure created', { procedureId: procedure.id });
      return procedure;
    } catch (error) {
      logger.error('Failed to create procedure', { error });
      throw new AppError('Failed to create procedure', 500);
    }
  }

  /**
   * Update procedure
   */
  async updateProcedure(procedureId, updates, adminId) {
    try {
      const procedure = await proceduresRepository.update(procedureId, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
      await this.logActivity(adminId, 'update', 'procedure', procedureId, { fields: Object.keys(updates) });
      logger.info('Procedure updated', { procedureId });
      return procedure;
    } catch (error) {
      logger.error('Failed to update procedure', { procedureId, error });
      throw new AppError('Failed to update procedure', 500);
    }
  }

  /**
   * Delete procedure
   */
  async deleteProcedure(procedureId, adminId) {
    try {
      await proceduresRepository.delete(procedureId);
      await this.logActivity(adminId, 'delete', 'procedure', procedureId);
      logger.info('Procedure deleted', { procedureId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete procedure', { procedureId, error });
      throw new AppError('Failed to delete procedure', 500);
    }
  }

  // ============================================
  // Renting Management
  // ============================================

  /**
   * Get all renting platforms
   */
  async getRentingPlatforms(page = 1, limit = 20, filters = {}) {
    try {
      return await adminRentingRepository.findAllPaginated({ page, limit, ...filters });
    } catch (error) {
      logger.error('Failed to get renting platforms', { error });
      throw new AppError('Failed to get renting platforms', 500);
    }
  }

  /**
   * Create renting platform
   */
  async createRentingPlatform(platformData, adminId) {
    try {
      const platform = await adminRentingRepository.create(platformData);
      await this.logActivity(adminId, 'create', 'renting', platform.id, { name: platformData.platform_name });
      logger.info('Renting platform created', { platformId: platform.id });
      return platform;
    } catch (error) {
      logger.error('Failed to create renting platform', { error });
      throw new AppError('Failed to create renting platform', 500);
    }
  }

  /**
   * Update renting platform
   */
  async updateRentingPlatform(platformId, updates, adminId) {
    try {
      const platform = await adminRentingRepository.update(platformId, {
        ...updates,
        updated_at: new Date().toISOString(),
      });
      await this.logActivity(adminId, 'update', 'renting', platformId, { fields: Object.keys(updates) });
      logger.info('Renting platform updated', { platformId });
      return platform;
    } catch (error) {
      logger.error('Failed to update renting platform', { platformId, error });
      throw new AppError('Failed to update renting platform', 500);
    }
  }

  /**
   * Delete renting platform
   */
  async deleteRentingPlatform(platformId, adminId) {
    try {
      await adminRentingRepository.delete(platformId);
      await this.logActivity(adminId, 'delete', 'renting', platformId);
      logger.info('Renting platform deleted', { platformId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete renting platform', { platformId, error });
      throw new AppError('Failed to delete renting platform', 500);
    }
  }

  // ============================================
  // Bulk Email
  // ============================================

  /**
   * Get users with filters for bulk email
   */
  async getUsersForBulkEmail(filters = {}) {
    try {
      const { 
        all, 
        subscribers_only, 
        profile_type,  // Actually maps to "status" column (student, worker, job_seeker, retiree, tourist, other)
        nationality,   // 'french', 'eu', 'non-eu' - maps to nationality column
        has_subscription, 
        region, 
        saved_aide_id,
        custom_emails 
      } = filters;

      // Handle custom email list
      if (custom_emails) {
        const emailList = custom_emails.split(',').map(e => e.trim()).filter(Boolean);
        if (emailList.length > 0) {
          const { data, error } = await userRepository.db
            .from('profiles')
            .select('id, email, full_name, status, nationality, region, subscription_tier');
          
          if (error) throw error;
          
          // Filter by email list (case-insensitive)
          const emailSet = new Set(emailList.map(e => e.toLowerCase()));
          return (data || []).filter(u => emailSet.has(u.email?.toLowerCase()));
        }
      }

      let query = userRepository.db
        .from('profiles')
        .select('id, email, full_name, status, nationality, region, subscription_tier')
        .eq('is_active', true);

      // Subscribers filter - users who haven't opted out of marketing
      if (!all && subscribers_only) {
        query = query.or('weekly_digest_enabled.is.null,weekly_digest_enabled.eq.true');
      }

      // Profile type filter (maps to "status" column in database)
      // Values: student, worker, job_seeker, retiree, tourist, other
      if (profile_type) {
        query = query.eq('status', profile_type);
      }

      // Nationality filter (maps to "nationality" column)
      // Database values: french, eu_eea, non_eu, other
      if (nationality === 'french') {
        query = query.eq('nationality', 'french');
      } else if (nationality === 'eu') {
        query = query.eq('nationality', 'eu_eea');
      } else if (nationality === 'non-eu') {
        query = query.eq('nationality', 'non_eu');
      }

      // Subscription filter
      if (has_subscription === 'true') {
        query = query.not('subscription_tier', 'is', null).neq('subscription_tier', 'free');
      } else if (has_subscription === 'false') {
        query = query.or('subscription_tier.is.null,subscription_tier.eq.free');
      }

      // Region filter
      if (region) {
        query = query.eq('region', region);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by saved aide if specified
      if (saved_aide_id && data && data.length > 0) {
        const userIds = data.map(u => u.id);
        const { data: savedAides, error: aideError } = await userRepository.db
          .from('saved_aides')
          .select('user_id')
          .eq('aide_id', saved_aide_id)
          .in('user_id', userIds);
        
        if (aideError) throw aideError;
        const savedUserIds = new Set(savedAides?.map(s => s.user_id) || []);
        return data.filter(u => savedUserIds.has(u.id));
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get users for bulk email', { error });
      throw new AppError('Failed to get users', 500);
    }
  }

  /**
   * Create bulk email campaign
   */
  async createBulkEmail(emailData, adminId) {
    try {
      // Get recipients based on filters
      const recipients = await this.getUsersForBulkEmail(emailData.filters);

      if (recipients.length === 0) {
        throw new AppError('No recipients found for the selected filters', 400);
      }

      // Use content fields if body_html not provided
      const bodyHtml = emailData.body_html || emailData.content;
      const bodyText = emailData.body_text || emailData.content?.replace(/<[^>]*>/g, '');

      // Create bulk email record with 'sending' status
      const bulkEmail = await bulkEmailRepository.create({
        admin_id: adminId,
        subject: emailData.subject,
        body_html: bodyHtml,
        body_text: bodyText,
        filters: emailData.filters,
        total_recipients: recipients.length,
        status: emailData.scheduled_at ? 'scheduled' : 'sending',
        scheduled_at: emailData.scheduled_at,
        started_at: emailData.scheduled_at ? null : new Date().toISOString(),
      });

      // Create recipient entries
      if (recipients.length > 0) {
        await bulkEmailRecipientsRepository.createMany(bulkEmail.id, recipients);
      }

      // If not scheduled, send emails immediately
      if (!emailData.scheduled_at) {
        // Send emails asynchronously (don't wait for all to complete)
        this.sendBulkEmailsAsync(bulkEmail.id, recipients, emailData.subject, bodyHtml, bodyText);
      }

      await this.logActivity(adminId, 'create', 'bulk_email', bulkEmail.id, {
        recipients: recipients.length,
        filters: emailData.filters,
      });

      logger.info('Bulk email created', { bulkEmailId: bulkEmail.id, recipients: recipients.length });
      return { ...bulkEmail, recipientCount: recipients.length };
    } catch (error) {
      logger.error('Failed to create bulk email', { error });
      throw error instanceof AppError ? error : new AppError('Failed to create bulk email', 500);
    }
  }

  /**
   * Send bulk emails asynchronously
   */
  async sendBulkEmailsAsync(bulkEmailId, recipients, subject, bodyHtml, bodyText) {
    let sentCount = 0;
    let failedCount = 0;

    try {
      for (const recipient of recipients) {
        try {
          // Personalize the email content
          let personalizedHtml = bodyHtml
            .replace(/\{\{name\}\}/g, recipient.full_name || 'there')
            .replace(/\{\{email\}\}/g, recipient.email || '')
            .replace(/\{\{profile_type\}\}/g, recipient.status || '');

          // Wrap in professional template if not already wrapped
          if (!personalizedHtml.includes('<!DOCTYPE html>')) {
            personalizedHtml = emailService.createBulkEmailHtml(personalizedHtml, subject);
          }

          // Send the email
          await emailService.send({
            to: recipient.email,
            subject,
            html: personalizedHtml,
            text: bodyText,
            userId: recipient.id,
          });

          // Update recipient status to sent
          await bulkEmailRecipientsRepository.updateRecipientStatus(bulkEmailId, recipient.id, 'sent');
          sentCount++;
        } catch (emailError) {
          logger.error('Failed to send bulk email to recipient', { 
            bulkEmailId, 
            recipientId: recipient.id, 
            email: recipient.email,
            error: emailError.message 
          });
          
          // Update recipient status to failed
          await bulkEmailRecipientsRepository.updateRecipientStatus(bulkEmailId, recipient.id, 'failed');
          failedCount++;
        }
      }

      // Update bulk email record with final counts and status
      await bulkEmailRepository.update(bulkEmailId, {
        status: 'sent',
        sent_count: sentCount,
        completed_at: new Date().toISOString(),
      });

      logger.info('Bulk email campaign completed', { bulkEmailId, sentCount, failedCount });
    } catch (error) {
      logger.error('Bulk email campaign failed', { bulkEmailId, error: error.message });
      
      // Update status to indicate partial failure
      await bulkEmailRepository.update(bulkEmailId, {
        status: 'sent',
        sent_count: sentCount,
        completed_at: new Date().toISOString(),
      });
    }
  }

  /**
   * Get bulk emails
   */
  async getBulkEmails(page = 1, limit = 20, filters = {}) {
    try {
      return await bulkEmailRepository.findAllPaginated({ page, limit, ...filters });
    } catch (error) {
      logger.error('Failed to get bulk emails', { error });
      throw new AppError('Failed to get bulk emails', 500);
    }
  }

  // ============================================
  // App Settings
  // ============================================

  /**
   * Get all settings
   */
  async getSettings() {
    try {
      const rawSettings = await appSettingsRepository.getAll();
      
      // Transform flat key-value pairs into nested structure for client
      // e.g., 'general.site_name' => { general: { site_name: value } }
      const settings = {};
      
      for (const row of rawSettings) {
        const parts = row.key.split('.');
        let current = settings;
        
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        
        current[parts[parts.length - 1]] = row.value;
      }
      
      return settings;
    } catch (error) {
      logger.error('Failed to get settings', { error });
      throw new AppError('Failed to get settings', 500);
    }
  }

  /**
   * Update setting
   */
  async updateSetting(key, value, adminId) {
    try {
      const setting = await appSettingsRepository.setByKey(key, value, adminId);
      await this.logActivity(adminId, 'update', 'setting', null, { key, value });
      logger.info('Setting updated', { key });
      return setting;
    } catch (error) {
      logger.error('Failed to update setting', { key, error });
      throw new AppError('Failed to update setting', 500);
    }
  }

  /**
   * Bulk update settings
   */
  async bulkUpdateSettings(settings, adminId) {
    try {
      const results = [];
      
      // Flatten nested settings into key-value pairs
      const flatSettings = this._flattenSettings(settings);
      
      for (const [key, value] of Object.entries(flatSettings)) {
        const setting = await appSettingsRepository.setByKey(key, value, adminId);
        results.push(setting);
      }
      
      await this.logActivity(adminId, 'update', 'settings', null, { count: results.length });
      logger.info('Bulk settings updated', { count: results.length });
      return results;
    } catch (error) {
      logger.error('Failed to bulk update settings', { error });
      throw new AppError('Failed to update settings', 500);
    }
  }

  /**
   * Flatten nested settings object into key-value pairs
   * e.g., { general: { site_name: 'AIDE+' } } => { 'general.site_name': 'AIDE+' }
   */
  _flattenSettings(obj, prefix = '') {
    const result = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this._flattenSettings(value, newKey));
      } else {
        result[newKey] = value;
      }
    }
    
    return result;
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Generate URL slug from title
   */
  _generateSlug(title) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100);
  }
}

export const adminService = new AdminService();
export default adminService;
