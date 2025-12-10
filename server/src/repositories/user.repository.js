import { BaseRepository } from './base.repository.js';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * User Repository
 * Handles user profile data access
 */
class UserRepository extends BaseRepository {
  constructor() {
    super('profiles');
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return this.findOne({ email });
  }

  /**
   * Find user by Stripe customer ID
   */
  async findByStripeCustomerId(stripeCustomerId) {
    return this.findOne({ stripe_customer_id: stripeCustomerId });
  }

  /**
   * Update Stripe customer ID
   */
  async updateStripeCustomerId(userId, stripeCustomerId) {
    return this.update(userId, { stripe_customer_id: stripeCustomerId });
  }

  /**
   * Update subscription tier
   */
  async updateSubscriptionTier(userId, tier) {
    return this.update(userId, { subscription_tier: tier });
  }

  /**
   * Find user with subscription
   */
  async findWithSubscription(userId) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        *,
        subscription:subscriptions!user_id(*)
      `)
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  /**
   * Search users
   */
  async search(query, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const { data, error, count } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Get users by subscription tier
   */
  async findByTier(tier, options = {}) {
    return this.findAll({
      ...options,
      filters: { subscription_tier: tier },
    });
  }

  /**
   * Get recently active users
   */
  async findRecentlyActive(days = 7, limit = 100) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .gte('last_active_at', since.toISOString())
      .order('last_active_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Update last active timestamp
   */
  async updateLastActive(userId) {
    return this.update(userId, { last_active_at: new Date().toISOString() });
  }

  /**
   * Soft delete user
   */
  async softDelete(userId) {
    return this.update(userId, {
      is_active: false,
      deleted_at: new Date().toISOString(),
    });
  }

  /**
   * Find users created in a period
   */
  async findCreatedInPeriod(startDate, endDate) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;
    return data || [];
  }

  /**
   * Get user stats for admin
   */
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [total, activeToday, newThisMonth, byTier] = await Promise.all([
      this.count(),
      this.count({ is_active: true }),
      this.db
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonth.toISOString()),
      this.db
        .from(this.tableName)
        .select('subscription_tier'),
    ]);

    const tierCounts = {};
    byTier.data?.forEach((u) => {
      tierCounts[u.subscription_tier] = (tierCounts[u.subscription_tier] || 0) + 1;
    });

    return {
      total,
      active: activeToday,
      newThisMonth: newThisMonth.count || 0,
      byTier: tierCounts,
    };
  }

  /**
   * Count users created since a date
   */
  async countCreatedSince(since) {
    const { count, error } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since.toISOString());

    if (error) throw error;
    return count || 0;
  }

  /**
   * Count users created between dates
   */
  async countCreatedBetween(startDate, endDate) {
    const { count, error } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString());

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get recent signups with pagination
   */
  async findRecentSignups(limit = 10) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('id, email, first_name, last_name, created_at, subscription_tier')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Find all users with filters and pagination
   */
  async findAllPaginated(options = {}) {
    const { page = 1, limit = 20, filters = {}, orderBy = 'created_at', ascending = false } = options;
    const offset = (page - 1) * limit;

    let query = this.db
      .from(this.tableName)
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.search) {
      query = query.or(`email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
    }
    if (filters.tier) {
      query = query.eq('subscription_tier', filters.tier);
    }
    if (filters.status) {
      query = query.eq('is_active', filters.status === 'active');
    }

    const { data, error, count } = await query
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      users: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }
}

export const userRepository = new UserRepository();
export { UserRepository };
export default userRepository;
