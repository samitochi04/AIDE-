import {
  affiliateRepository,
  affiliateClickRepository,
  affiliateReferralRepository,
  affiliateEarningRepository,
  affiliatePayoutRepository,
  userRepository,
} from '../repositories/index.js';
import { emailService } from './email.service.js';
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
        affiliate_code: referralCode, // Database uses affiliate_code column
        status: 'pending',
        commission_rate: 0.1,
      });

      logger.info('New affiliate registered', { userId, affiliateId: affiliate.id });

      // Notify admin about new affiliate application
      const user = await userRepository.findById(userId);
      await emailService.sendAdminAffiliateApplication({
        affiliateId: affiliate.id,
        companyName: companyName || 'Non spécifié',
        contactEmail: contactEmail || user?.email,
        website: website || 'Non spécifié',
        description: description || 'Aucune description',
        userEmail: user?.email,
      }).catch(err => logger.error('Failed to send admin affiliate notification', { error: err.message }));

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
      throw new NotFoundError('Affiliate');
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
      referralCode: affiliate.affiliate_code, // Database uses affiliate_code column
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
    const result = await affiliateReferralRepository.findByAffiliate(affiliateId);
    // findByAffiliate returns { data, pagination } from findAll
    const referrals = result?.data || [];
    const total = referrals.length;
    const converted = referrals.filter(r => r.status === 'converted').length;
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
      throw new NotFoundError('Affiliate');
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
      throw new NotFoundError('Affiliate');
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

  // ============================================
  // Fixed commission rates per tier
  // ============================================
  static COMMISSION_RATES = {
    basic: 0.99,
    premium: 1.99,
    ultimate: 2.99
  };

  /**
   * Process affiliate commission when a referred user subscribes
   * Called from stripe webhook when subscription becomes active
   */
  async processSubscriptionCommission(subscribedUserId, tier) {
    try {
      // Get the user who subscribed
      const subscriber = await userRepository.findById(subscribedUserId);
      if (!subscriber || !subscriber.referred_by) {
        logger.info('No referrer for subscription', { subscribedUserId });
        return null;
      }

      // Get the affiliate (referrer)
      const affiliate = await affiliateRepository.findByUser(subscriber.referred_by);
      if (!affiliate || affiliate.status !== 'approved') {
        logger.info('Referrer is not an active affiliate', { referrerId: subscriber.referred_by });
        return null;
      }

      // Check if we already have a referral record for this user
      const existingReferral = await affiliateReferralRepository.findByReferredUser(subscribedUserId);
      
      // Get commission amount based on tier
      const commission = AffiliateService.COMMISSION_RATES[tier] || AffiliateService.COMMISSION_RATES.basic;

      // Create or update referral record
      let referral;
      if (existingReferral) {
        // Only process if not already converted (first subscription only)
        if (existingReferral.status === 'converted') {
          logger.info('Referral already converted', { referralId: existingReferral.id });
          return null;
        }
        referral = await affiliateReferralRepository.markConverted(existingReferral.id);
      } else {
        // Create new referral record and mark as converted
        referral = await affiliateReferralRepository.create({
          affiliate_id: affiliate.id,
          referred_user_id: subscribedUserId,
          status: 'converted',
          converted_at: new Date().toISOString(),
        });
      }

      // Create earning record
      const earning = await affiliateEarningRepository.create({
        affiliate_id: affiliate.id,
        referral_id: referral.id,
        amount: commission,
        tier: tier,
        status: 'pending',
      });

      // Update affiliate stats
      await affiliateRepository.update(affiliate.id, {
        successful_conversions: (affiliate.successful_conversions || 0) + 1,
        total_earnings: (parseFloat(affiliate.total_earnings) || 0) + commission,
        pending_earnings: (parseFloat(affiliate.pending_earnings) || 0) + commission,
      });

      // Send commission notification email to affiliate
      const referrer = await userRepository.findById(subscriber.referred_by);
      if (referrer?.email) {
        await emailService.sendAffiliateConversion(referrer.email, {
          commission: commission.toFixed(2),
          tier: tier,
          totalEarnings: ((parseFloat(affiliate.total_earnings) || 0) + commission).toFixed(2),
          referredUser: subscriber.email?.split('@')[0] || 'user',
        }).catch(err => logger.error('Failed to send affiliate commission email', { error: err.message }));
      }

      logger.info('Affiliate commission processed', { 
        affiliateId: affiliate.id, 
        subscribedUserId, 
        tier, 
        commission 
      });

      return { affiliate, earning, commission };
    } catch (error) {
      logger.error('Failed to process affiliate commission', { 
        subscribedUserId, 
        tier, 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Get referral link
   */
  async getReferralLink(userId) {
    const affiliate = await this.getByUserId(userId);
    if (!affiliate || affiliate.status !== 'approved') {
      throw new NotFoundError('Active affiliate');
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://aideplus.fr';
    return {
      code: affiliate.affiliate_code, // Database uses affiliate_code column
      link: `${baseUrl}/?ref=${affiliate.affiliate_code}`,
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
      throw new NotFoundError('Active affiliate');
    }

    // Get pending earnings
    const { pending } = await this.getTotalEarnings(affiliate.id);

    if (pending < 9.90) {
      throw new AppError('Minimum payout amount is €9.90 (10 Basic referrals)', 400);
    }

    // Create payout request
    try {
      const payout = await affiliatePayoutRepository.create({
        affiliate_id: affiliate.id,
        amount: pending,
        status: 'requested',
      });

      // Send payout pending email to affiliate
      const user = await userRepository.findById(userId);
      if (user?.email) {
        await emailService.sendAffiliatePayoutPending(user.email, {
          amount: pending,
          requestDate: new Date().toLocaleDateString('fr-FR'),
        }).catch(err => logger.error('Failed to send payout pending email', { error: err.message }));
      }

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
      throw new NotFoundError('Affiliate');
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
      throw new NotFoundError('Affiliate');
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
      // Get affiliate before update to check status change
      const affiliateBefore = await affiliateRepository.findById(affiliateId);
      
      // Transform updates to match database schema
      const dbUpdates = { ...updates };
      
      // Handle is_verified -> verified_at transformation
      if ('is_verified' in dbUpdates) {
        dbUpdates.verified_at = dbUpdates.is_verified ? new Date().toISOString() : null;
        delete dbUpdates.is_verified;
      }
      
      // Handle is_active if present
      if (updates.status === 'approved') {
        dbUpdates.is_active = true;
      } else if (updates.status === 'suspended' || updates.status === 'rejected') {
        dbUpdates.is_active = false;
      }
      
      await affiliateRepository.update(affiliateId, dbUpdates);
      logger.info('Affiliate updated', { affiliateId, updates: dbUpdates });

      // Send welcome email if affiliate was just approved
      if (updates.status === 'approved' && affiliateBefore?.status !== 'approved') {
        const user = await userRepository.findById(affiliateBefore.user_id);
        if (user?.email) {
          const baseUrl = process.env.FRONTEND_URL || 'https://aideplus.fr';
          await emailService.sendAffiliateWelcome(user.email, {
            affiliateLink: `${baseUrl}/?ref=${affiliateBefore.affiliate_code}`, // Database uses affiliate_code column
            commissionRate: (affiliateBefore.commission_rate * 100).toFixed(0),
          }).catch(err => logger.error('Failed to send affiliate welcome email', { error: err.message }));
        }
      }

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
