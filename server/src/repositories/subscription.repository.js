import { BaseRepository } from './base.repository.js';

/**
 * Subscription Repository
 * Handles subscription data access
 */
class SubscriptionRepository extends BaseRepository {
  constructor() {
    super('stripe_subscriptions');
  }

  /**
   * Find active subscription for user
   */
  async findActiveByUserId(userId) {
    return this.findOne({ user_id: userId, status: 'active' });
  }

  /**
   * Find by Stripe subscription ID
   */
  async findByStripeSubscriptionId(stripeSubscriptionId) {
    return this.findOne({ stripe_subscription_id: stripeSubscriptionId });
  }

  /**
   * Find by user ID with cancel pending
   */
  async findCancelPendingByUserId(userId) {
    return this.findOne({ user_id: userId, cancel_at_period_end: true });
  }

  /**
   * Upsert subscription by Stripe ID
   */
  async upsertByStripeId(data) {
    const { data: result, error } = await this.db
      .from(this.tableName)
      .upsert(data, { onConflict: 'stripe_subscription_id' })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  /**
   * Update status by Stripe subscription ID
   */
  async updateStatusByStripeId(stripeSubscriptionId, status) {
    const { data, error } = await this.db
      .from(this.tableName)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Find by Stripe customer ID
   */
  async findByStripeCustomerId(stripeCustomerId) {
    return this.findAll({ filters: { stripe_customer_id: stripeCustomerId } });
  }

  /**
   * Get expiring subscriptions
   */
  async findExpiring(daysAhead = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data, error } = await this.db
      .from(this.tableName)
      .select('*, user:user_id(email, first_name)')
      .eq('status', 'active')
      .lte('current_period_end', futureDate.toISOString())
      .gte('current_period_end', new Date().toISOString());

    if (error) throw error;
    return data || [];
  }

  /**
   * Get subscriptions by status
   */
  async findByStatus(status, options = {}) {
    return this.findAll({
      ...options,
      filters: { status },
    });
  }

  /**
   * Get subscriptions by tier
   */
  async findByTier(tier, options = {}) {
    return this.findAll({
      ...options,
      filters: { tier, status: 'active' },
    });
  }

  /**
   * Cancel subscription (set cancel_at_period_end)
   */
  async markForCancellation(subscriptionId) {
    return this.update(subscriptionId, { cancel_at_period_end: true });
  }

  /**
   * Resume cancelled subscription
   */
  async resumeSubscription(subscriptionId) {
    return this.update(subscriptionId, { cancel_at_period_end: false });
  }

  /**
   * Find subscriptions created in a period
   */
  async findCreatedInPeriod(startDate, endDate) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('tier, status, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;
    return data || [];
  }

  /**
   * Get subscription stats
   */
  async getStats() {
    const [active, byTier, cancelled, revenue] = await Promise.all([
      this.count({ status: 'active' }),
      this.db
        .from(this.tableName)
        .select('tier')
        .eq('status', 'active'),
      this.count({ status: 'cancelled' }),
      this.db
        .from('stripe_invoices')
        .select('amount_paid')
        .eq('status', 'paid'),
    ]);

    const tierCounts = {};
    byTier.data?.forEach((s) => {
      tierCounts[s.tier] = (tierCounts[s.tier] || 0) + 1;
    });

    const totalRevenue = revenue.data?.reduce((sum, p) => sum + p.amount_paid, 0) || 0;

    return {
      active,
      cancelled,
      byTier: tierCounts,
      totalRevenue: totalRevenue / 100, // Convert from cents
    };
  }

  /**
   * Count active subscriptions
   */
  async countActive() {
    return this.count({ status: 'active' });
  }

  /**
   * Get subscriptions by tier grouped
   */
  async getByTierGrouped() {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('tier')
      .eq('status', 'active');

    if (error) throw error;

    const tierBreakdown = { basic: 0, plus: 0, premium: 0 };
    data?.forEach(sub => {
      if (tierBreakdown.hasOwnProperty(sub.tier)) {
        tierBreakdown[sub.tier]++;
      }
    });

    return tierBreakdown;
  }

  /**
   * Find all subscriptions with filters and pagination
   */
  async findAllPaginated(options = {}) {
    const { page = 1, limit = 20, filters = {}, orderBy = 'created_at', ascending = false } = options;
    const offset = (page - 1) * limit;

    let query = this.db
      .from(this.tableName)
      .select('*, user:user_id(email, first_name, last_name)', { count: 'exact' });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.tier) {
      query = query.eq('tier', filters.tier);
    }

    const { data, error, count } = await query
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      subscriptions: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Update subscription status by user ID
   */
  async updateStatusByUserId(userId, status) {
    const { data, error } = await this.db
      .from(this.tableName)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'active')
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}

/**
 * Payment Repository
 */
class PaymentRepository extends BaseRepository {
  constructor() {
    super('stripe_invoices');
  }

  /**
   * Find by Stripe invoice ID
   */
  async findByInvoiceId(invoiceId) {
    return this.findOne({ stripe_invoice_id: invoiceId });
  }

  /**
   * Find payments for subscription
   */
  async findBySubscription(subscriptionId, options = {}) {
    return this.findAll({
      ...options,
      filters: { stripe_subscription_id: subscriptionId },
    });
  }

  /**
   * Get revenue by period
   */
  async getRevenueByPeriod(startDate, endDate) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('amount_paid, currency, created_at')
      .eq('status', 'paid')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const total = data?.reduce((sum, p) => sum + p.amount_paid, 0) || 0;
    return {
      total: total / 100,
      count: data?.length || 0,
      payments: data,
    };
  }
}

export const subscriptionRepository = new SubscriptionRepository();
export const paymentRepository = new PaymentRepository();

export { SubscriptionRepository, PaymentRepository };

export default {
  subscriptions: subscriptionRepository,
  payments: paymentRepository,
};
