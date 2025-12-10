import {
  affiliateRepository,
  affiliateClickRepository,
  affiliateReferralRepository,
  affiliateEarningRepository,
  affiliatePayoutRepository,
} from '../repositories/index.js';
import logger from '../utils/logger.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import { generateToken } from '../utils/helpers.js';

/**
 * Affiliate Service
 * Handles affiliate program functionality
 */
class AffiliateService {
  /**
   * Register as an affiliate
   */
  async register(userId, data) {
    const { companyName, website, contactEmail, description } = data;

    // Check if user is already an affiliate
    const existing = await affiliateRepository.findByUser(userId);

    if (existing) {
      throw new AppError('You are already registered as an affiliate', 400);
    }

    // Generate unique referral code
    const referralCode = await this.generateUniqueReferralCode();

    // Create affiliate record
    try {
      const affiliate = await affiliateRepository.create({
        user_id: userId,
        company_name: companyName,
        website,
        contact_email: contactEmail,
        description,
        referral_code: referralCode,
        status: 'pending',
        commission_rate: 0.1,
      });

      logger.info('New affiliate registered', { userId, affiliateId: affiliate.id });
      return affiliate;
    } catch (error) {
      logger.error('Failed to create affiliate', { userId, error: error.message });
      throw new AppError('Failed to register as affiliate', 500);
    }
  }

  /**
   * Generate unique referral code
   */
  async generateUniqueReferralCode() {
    let code;
    let isUnique = false;

    while (!isUnique) {
      code = generateToken(8).toUpperCase();
      isUnique = await affiliateRepository.isCodeUnique(code);
    }

    return code;
  }

  /**
   * Get affiliate by user ID
   */
  async getByUserId(userId) {
    return affiliateRepository.findByUser(userId);
  }

  /**
   * Get affiliate dashboard data
   */
  async getDashboard(userId) {
    const affiliate = await this.getByUserId(userId);

    if (!affiliate) {
      throw new NotFoundError('Affiliate not found');
    }

    if (affiliate.status !== 'approved') {
      return {
        status: affiliate.status,
        message: affiliate.status === 'pending'
          ? 'Your affiliate application is pending review'
          : 'Your affiliate application was not approved',
      };
    }

    // Get stats
    const [clicks, referrals, earnings] = await Promise.all([
      this.getTotalClicks(affiliate.id),
      this.getTotalReferrals(affiliate.id),
      this.getTotalEarnings(affiliate.id),
    ]);

    // Get recent activity
    const recentReferrals = await this.getRecentReferrals(affiliate.id, 5);

    return {
      status: affiliate.status,
      referralCode: affiliate.referral_code,
      commissionRate: affiliate.commission_rate,
      stats: {
        totalClicks: clicks,
        totalReferrals: referrals.total,
        convertedReferrals: referrals.converted,
        conversionRate: clicks > 0 ? (referrals.converted / clicks * 100).toFixed(2) : 0,
        totalEarnings: earnings.total,
        pendingEarnings: earnings.pending,
        paidEarnings: earnings.paid,
      },
      recentReferrals,
    };
  }

  /**
   * Get total clicks
   */
  async getTotalClicks(affiliateId) {
    return affiliateClickRepository.countByAffiliate(affiliateId);
  }

  /**
   * Get total referrals
   */
  async getTotalReferrals(affiliateId) {
    const referrals = await affiliateReferralRepository.findByAffiliate(affiliateId);
    const total = referrals?.length || 0;
    const converted = referrals?.filter(r => r.status === 'converted').length || 0;
    return { total, converted };
  }

  /**
   * Get total earnings
   */
  async getTotalEarnings(affiliateId) {
    return affiliateEarningRepository.getTotalEarnings(affiliateId);
  }

  /**
   * Get recent referrals
   */
  async getRecentReferrals(affiliateId, limit = 10) {
    const result = await affiliateReferralRepository.findByAffiliate(affiliateId, {
      limit,
      orderBy: 'created_at',
      ascending: false,
    });
    return result || [];
  }

  /**
   * Get paginated referrals
   */
  async getReferrals(userId, page = 1, limit = 20) {
    const affiliate = await this.getByUserId(userId);
    if (!affiliate) {
      throw new NotFoundError('Affiliate not found');
    }

    try {
      const result = await affiliateReferralRepository.findByAffiliatePaginated(
        affiliate.id,
        { page, limit }
      );
      return result;
    } catch (error) {
      logger.error('Failed to get referrals', { error: error.message });
      throw new AppError('Failed to get referrals', 500);
    }
  }

  /**
   * Get paginated earnings
   */
  async getEarnings(userId, page = 1, limit = 20) {
    const affiliate = await this.getByUserId(userId);
    if (!affiliate) {
      throw new NotFoundError('Affiliate not found');
    }

    try {
      const result = await affiliateEarningRepository.findByAffiliatePaginated(
        affiliate.id,
        { page, limit }
      );
      return result;
    } catch (error) {
      logger.error('Failed to get earnings', { error: error.message });
      throw new AppError('Failed to get earnings', 500);
    }
  }

  /**
   * Get referral link
   */
  async getReferralLink(userId) {
    const affiliate = await this.getByUserId(userId);
    if (!affiliate || affiliate.status !== 'approved') {
      throw new NotFoundError('Active affiliate not found');
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://aideplus.fr';
    return {
      code: affiliate.referral_code,
      link: `${baseUrl}/?ref=${affiliate.referral_code}`,
    };
  }

  /**
   * Track affiliate click
   */
  async trackClick(referralCode, metadata = {}) {
    const affiliate = await affiliateRepository.findByCode(referralCode);

    if (!affiliate || affiliate.status !== 'approved') {
      return { success: false, reason: 'Invalid or inactive affiliate code' };
    }

    await affiliateClickRepository.create({
      affiliate_id: affiliate.id,
      ip_address: metadata.ipAddress,
      user_agent: metadata.userAgent,
      referrer: metadata.referrer,
    });

    return { success: true, affiliateId: affiliate.id };
  }

  /**
   * Request payout
   */
  async requestPayout(userId) {
    const affiliate = await this.getByUserId(userId);
    if (!affiliate || affiliate.status !== 'approved') {
      throw new NotFoundError('Active affiliate not found');
    }

    // Get pending earnings
    const { pending } = await this.getTotalEarnings(affiliate.id);

    if (pending < 50) {
      throw new AppError('Minimum payout amount is €50', 400);
    }

    // Create payout request
    try {
      const payout = await affiliatePayoutRepository.create({
        affiliate_id: affiliate.id,
        amount: pending,
        status: 'requested',
      });

      logger.info('Payout requested', { affiliateId: affiliate.id, amount: pending });
      return payout;
    } catch (error) {
      logger.error('Failed to create payout request', { error: error.message });
      throw new AppError('Failed to request payout', 500);
    }
  }

  /**
   * Get payout history
   */
  async getPayouts(userId, page = 1, limit = 20) {
    const affiliate = await this.getByUserId(userId);
    if (!affiliate) {
      throw new NotFoundError('Affiliate not found');
    }

    try {
      const result = await affiliatePayoutRepository.findByAffiliatePaginated(
        affiliate.id,
        { page, limit }
      );
      return result;
    } catch (error) {
      logger.error('Failed to get payouts', { error: error.message });
      throw new AppError('Failed to get payouts', 500);
    }
  }

  /**
   * Update affiliate settings
   */
  async updateSettings(userId, settings) {
    const affiliate = await this.getByUserId(userId);
    if (!affiliate) {
      throw new NotFoundError('Affiliate not found');
    }

    try {
      await affiliateRepository.update(affiliate.id, {
        payout_method: settings.payoutMethod,
        payout_details: settings.payoutDetails,
      });
      return { success: true };
    } catch (error) {
      logger.error('Failed to update settings', { error: error.message });
      throw new AppError('Failed to update settings', 500);
    }
  }

  // ============================================
  // Admin methods
  // ============================================

  /**
   * Get all affiliates (admin)
   */
  async getAllAffiliates(page = 1, limit = 20, status = null) {
    try {
      const result = await affiliateRepository.findAllPaginated({ page, limit, status });
      return result;
    } catch (error) {
      logger.error('Failed to get affiliates', { error: error.message });
      throw new AppError('Failed to get affiliates', 500);
    }
  }

  /**
   * Update affiliate status (admin)
   */
  async updateAffiliate(affiliateId, updates) {
    try {
      await affiliateRepository.update(affiliateId, updates);
      logger.info('Affiliate updated', { affiliateId, updates });
      return { success: true };
    } catch (error) {
      logger.error('Failed to update affiliate', { affiliateId, error: error.message });
      throw new AppError('Failed to update affiliate', 500);
    }
  }

  /**
   * Get affiliate stats (admin)
   */
  async getAffiliateStats(affiliateId) {
    const [clicks, referrals, earnings] = await Promise.all([
      this.getTotalClicks(affiliateId),
      this.getTotalReferrals(affiliateId),
      this.getTotalEarnings(affiliateId),
    ]);

    return {
      clicks,
      referrals,
      earnings,
      conversionRate: clicks > 0 ? (referrals.converted / clicks * 100).toFixed(2) : 0,
    };
  }
}

export const affiliateService = new AffiliateService();
export default affiliateService;
