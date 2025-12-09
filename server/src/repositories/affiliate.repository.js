import { BaseRepository } from './base.repository.js';

/**
 * Affiliate Repository
 */
class AffiliateRepository extends BaseRepository {
  constructor() {
    super('affiliates');
  }

  /**
   * Find affiliate by user ID
   */
  async findByUser(userId) {
    return this.findOne({ user_id: userId });
  }

  /**
   * Find affiliate by referral code
   */
  async findByCode(referralCode) {
    return this.findOne({ referral_code: referralCode });
  }

  /**
   * Find approved affiliates
   */
  async findApproved(options = {}) {
    return this.findAll({
      ...options,
      filters: { status: 'approved' },
    });
  }

  /**
   * Find pending affiliates (for admin approval)
   */
  async findPending(options = {}) {
    return this.findAll({
      ...options,
      filters: { status: 'pending' },
    });
  }

  /**
   * Check if referral code is unique
   */
  async isCodeUnique(code) {
    const exists = await this.exists({ referral_code: code });
    return !exists;
  }

  /**
   * Update affiliate status
   */
  async updateStatus(affiliateId, status) {
    return this.update(affiliateId, { status });
  }

  /**
   * Update commission rate
   */
  async updateCommissionRate(affiliateId, rate) {
    return this.update(affiliateId, { commission_rate: rate });
  }

  /**
   * Find all affiliates with pagination (admin)
   */
  async findAllPaginated(options = {}) {
    const { page = 1, limit = 20, status } = options;
    const offset = (page - 1) * limit;

    let query = this.db
      .from(this.tableName)
      .select('*, user:user_id(email)', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      affiliates: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }
}

/**
 * Affiliate Click Repository
 */
class AffiliateClickRepository extends BaseRepository {
  constructor() {
    super('affiliate_clicks');
  }

  /**
   * Count clicks for affiliate
   */
  async countByAffiliate(affiliateId, since = null) {
    const filters = { affiliate_id: affiliateId };
    
    if (since) {
      const { count, error } = await this.db
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('affiliate_id', affiliateId)
        .gte('created_at', since.toISOString());
      
      if (error) throw error;
      return count || 0;
    }

    return this.count(filters);
  }

  /**
   * Get clicks by day for affiliate
   */
  async getClicksByDay(affiliateId, startDate, endDate) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('created_at')
      .eq('affiliate_id', affiliateId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    // Group by day
    const byDay = {};
    data?.forEach((click) => {
      const day = click.created_at.split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    return byDay;
  }
}

/**
 * Affiliate Referral Repository
 */
class AffiliateReferralRepository extends BaseRepository {
  constructor() {
    super('affiliate_referrals');
  }

  /**
   * Find referrals for affiliate
   */
  async findByAffiliate(affiliateId, options = {}) {
    return this.findAll({
      ...options,
      filters: { affiliate_id: affiliateId },
    });
  }

  /**
   * Find referral by referred user
   */
  async findByReferredUser(userId) {
    return this.findOne({ referred_user_id: userId });
  }

  /**
   * Count converted referrals
   */
  async countConverted(affiliateId) {
    return this.count({ affiliate_id: affiliateId, status: 'converted' });
  }

  /**
   * Mark referral as converted
   */
  async markConverted(referralId) {
    return this.update(referralId, {
      status: 'converted',
      converted_at: new Date().toISOString(),
    });
  }

  /**
   * Find referrals with pagination
   */
  async findByAffiliatePaginated(affiliateId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const { data, error, count } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      referrals: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }
}

/**
 * Affiliate Earning Repository
 */
class AffiliateEarningRepository extends BaseRepository {
  constructor() {
    super('affiliate_earnings');
  }

  /**
   * Find earnings for affiliate
   */
  async findByAffiliate(affiliateId, options = {}) {
    return this.findAll({
      ...options,
      filters: { affiliate_id: affiliateId },
    });
  }

  /**
   * Get total earnings
   */
  async getTotalEarnings(affiliateId) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('amount, status')
      .eq('affiliate_id', affiliateId);

    if (error) throw error;

    return {
      total: data?.reduce((sum, e) => sum + e.amount, 0) || 0,
      pending: data?.filter((e) => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0) || 0,
      paid: data?.filter((e) => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0) || 0,
    };
  }

  /**
   * Mark earnings as paid
   */
  async markAsPaid(earningIds) {
    return this.updateMany(
      { id: { operator: 'in', value: earningIds } },
      { status: 'paid' }
    );
  }

  /**
   * Find earnings with pagination
   */
  async findByAffiliatePaginated(affiliateId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const { data, error, count } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      earnings: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }
}

/**
 * Affiliate Payout Repository
 */
class AffiliatePayoutRepository extends BaseRepository {
  constructor() {
    super('affiliate_payouts');
  }

  /**
   * Find payouts for affiliate
   */
  async findByAffiliate(affiliateId, options = {}) {
    return this.findAll({
      ...options,
      filters: { affiliate_id: affiliateId },
    });
  }

  /**
   * Find pending payouts
   */
  async findPending(options = {}) {
    return this.findAll({
      ...options,
      filters: { status: 'requested' },
    });
  }

  /**
   * Mark payout as completed
   */
  async markCompleted(payoutId, transactionId) {
    return this.update(payoutId, {
      status: 'completed',
      transaction_id: transactionId,
      processed_at: new Date().toISOString(),
    });
  }

  /**
   * Find payouts with pagination
   */
  async findByAffiliatePaginated(affiliateId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const { data, error, count } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      payouts: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }
}

export const affiliateRepository = new AffiliateRepository();
export const affiliateClickRepository = new AffiliateClickRepository();
export const affiliateReferralRepository = new AffiliateReferralRepository();
export const affiliateEarningRepository = new AffiliateEarningRepository();
export const affiliatePayoutRepository = new AffiliatePayoutRepository();

export {
  AffiliateRepository,
  AffiliateClickRepository,
  AffiliateReferralRepository,
  AffiliateEarningRepository,
  AffiliatePayoutRepository,
};

export default {
  affiliates: affiliateRepository,
  clicks: affiliateClickRepository,
  referrals: affiliateReferralRepository,
  earnings: affiliateEarningRepository,
  payouts: affiliatePayoutRepository,
};
