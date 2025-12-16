import { subscriptionRepository, userRepository } from '../repositories/index.js';
import { TIER_LIMITS, SUBSCRIPTION_TIERS, SUBSCRIPTION_PRICING } from '../utils/constants.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * Subscription Service
 * Handles subscription limit checking and enforcement
 */
class SubscriptionService {
  constructor() {
    this.db = supabaseAdmin;
  }

  /**
   * Get user's current subscription tier
   */
  async getUserTier(userId) {
    try {
      const subscription = await subscriptionRepository.findActiveByUserId(userId);
      return subscription?.tier || 'free';
    } catch (error) {
      logger.error('Failed to get user tier', { userId, error: error.message });
      return 'free';
    }
  }

  /**
   * Get user's tier limits
   */
  async getUserLimits(userId) {
    const tier = await this.getUserTier(userId);
    return {
      tier,
      limits: TIER_LIMITS[tier] || TIER_LIMITS.free,
      pricing: SUBSCRIPTION_PRICING[tier] || SUBSCRIPTION_PRICING.free,
    };
  }

  /**
   * Get all tier information for pricing display
   */
  getAllTiers() {
    return Object.entries(TIER_LIMITS).map(([tier, limits]) => ({
      tier,
      ...limits,
      pricing: SUBSCRIPTION_PRICING[tier],
    }));
  }

  // ===========================================
  // Usage Tracking Methods
  // ===========================================

  /**
   * Get user's daily AI message count
   * Note: chat_messages doesn't have user_id, need to join via conversations
   */
  async getAIMessageCount(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // First get user's conversation IDs
      const { data: conversations, error: convError } = await this.db
        .from('chat_conversations')
        .select('id')
        .eq('user_id', userId);

      if (convError || !conversations?.length) {
        return 0;
      }

      const conversationIds = conversations.map(c => c.id);

      // Now count messages in those conversations
      const { count, error } = await this.db
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .eq('role', 'user')
        .gte('created_at', today.toISOString());

      if (error) {
        logger.error('Failed to get AI message count', { userId, error: error.message });
        return 0;
      }

      return count || 0;
    } catch (err) {
      logger.error('Failed to get AI message count', { userId, error: err.message });
      return 0;
    }
  }

  /**
   * Get user's daily simulation count
   */
  async getSimulationCount(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await this.db
      .from('simulations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());

    if (error) {
      logger.error('Failed to get simulation count', { userId, error: error.message });
      return 0;
    }

    return count || 0;
  }

  /**
   * Get user's saved aides count
   */
  async getSavedAidesCount(userId) {
    const { count, error } = await this.db
      .from('saved_aides')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to get saved aides count', { userId, error: error.message });
      return 0;
    }

    return count || 0;
  }

  /**
   * Get user's saved housing platforms count
   */
  async getSavedHousingCount(userId) {
    const { count, error } = await this.db
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('item_type', 'renting');

    if (error) {
      logger.error('Failed to get saved housing count', { userId, error: error.message });
      return 0;
    }

    return count || 0;
  }

  /**
   * Get user's tracked procedures count
   */
  async getProceduresCount(userId) {
    const { count, error } = await this.db
      .from('user_procedures')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to get procedures count', { userId, error: error.message });
      return 0;
    }

    return count || 0;
  }

  /**
   * Get user's content/tutorial access count (today only)
   */
  async getContentAccessCount(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await this.db
      .from('content_views')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());

    if (error) {
      logger.error('Failed to get content access count', { userId, error: error.message });
      return 0;
    }

    return count || 0;
  }

  // ===========================================
  // Limit Checking Methods
  // ===========================================

  /**
   * Check if user can send AI message
   */
  async canSendAIMessage(userId) {
    const { tier, limits } = await this.getUserLimits(userId);
    const count = await this.getAIMessageCount(userId);
    
    const canSend = count < limits.aiMessagesPerDay;
    
    return {
      allowed: canSend,
      current: count,
      limit: limits.aiMessagesPerDay,
      remaining: Math.max(0, limits.aiMessagesPerDay - count),
      tier,
      upgradeRequired: !canSend,
      message: canSend 
        ? null 
        : `Vous avez atteint votre limite quotidienne de ${limits.aiMessagesPerDay} messages IA.`,
      messageEn: canSend
        ? null
        : `You have reached your daily limit of ${limits.aiMessagesPerDay} AI messages.`,
    };
  }

  /**
   * Check if user can run simulation
   */
  async canRunSimulation(userId) {
    const { tier, limits } = await this.getUserLimits(userId);
    
    if (limits.unlimitedSimulations) {
      return { allowed: true, current: 0, limit: Infinity, remaining: Infinity, tier };
    }
    
    const count = await this.getSimulationCount(userId);
    const canRun = count < limits.simulationsPerDay;
    
    return {
      allowed: canRun,
      current: count,
      limit: limits.simulationsPerDay,
      remaining: Math.max(0, limits.simulationsPerDay - count),
      tier,
      upgradeRequired: !canRun,
      message: canRun 
        ? null 
        : `Vous avez atteint votre limite quotidienne de ${limits.simulationsPerDay} simulations.`,
      messageEn: canRun
        ? null
        : `You have reached your daily limit of ${limits.simulationsPerDay} simulations.`,
    };
  }

  /**
   * Check if user can save an aide
   */
  async canSaveAide(userId) {
    const { tier, limits } = await this.getUserLimits(userId);
    
    if (limits.unlimitedSaves) {
      return { allowed: true, current: 0, limit: Infinity, remaining: Infinity, tier };
    }
    
    const count = await this.getSavedAidesCount(userId);
    const canSave = count < limits.savedAides;
    
    return {
      allowed: canSave,
      current: count,
      limit: limits.savedAides,
      remaining: Math.max(0, limits.savedAides - count),
      tier,
      upgradeRequired: !canSave,
      message: canSave 
        ? null 
        : `Vous avez atteint votre limite de ${limits.savedAides} aides sauvegardées.`,
      messageEn: canSave
        ? null
        : `You have reached your limit of ${limits.savedAides} saved aides.`,
    };
  }

  /**
   * Check if user can save a housing platform
   */
  async canSaveHousing(userId) {
    const { tier, limits } = await this.getUserLimits(userId);
    
    // savedHousing limit (use savedAides as fallback)
    const saveLimit = limits.savedHousing ?? limits.savedAides;
    
    if (limits.unlimitedSaves || saveLimit === -1) {
      return { allowed: true, current: 0, limit: Infinity, remaining: Infinity, tier };
    }
    
    const count = await this.getSavedHousingCount(userId);
    const canSave = count < saveLimit;
    
    return {
      allowed: canSave,
      current: count,
      limit: saveLimit,
      remaining: Math.max(0, saveLimit - count),
      tier,
      upgradeRequired: !canSave,
      message: canSave 
        ? null 
        : `Vous avez atteint votre limite de ${saveLimit} logements sauvegardés.`,
      messageEn: canSave
        ? null
        : `You have reached your limit of ${saveLimit} saved housing platforms.`,
    };
  }

  /**
   * Check if user can track a procedure
   */
  async canTrackProcedure(userId) {
    const { tier, limits } = await this.getUserLimits(userId);
    
    if (limits.unlimitedProcedures) {
      return { allowed: true, current: 0, limit: Infinity, remaining: Infinity, tier };
    }
    
    const count = await this.getProceduresCount(userId);
    const canTrack = count < limits.procedures;
    
    return {
      allowed: canTrack,
      current: count,
      limit: limits.procedures,
      remaining: Math.max(0, limits.procedures - count),
      tier,
      upgradeRequired: !canTrack,
      message: canTrack 
        ? null 
        : `Vous avez atteint votre limite de ${limits.procedures} procédures suivies.`,
      messageEn: canTrack
        ? null
        : `You have reached your limit of ${limits.procedures} tracked procedures.`,
    };
  }

  /**
   * Check if user can access content
   */
  async canAccessContent(userId, contentId = null) {
    const { tier, limits } = await this.getUserLimits(userId);
    
    if (limits.allContents) {
      return { allowed: true, current: 0, limit: Infinity, remaining: Infinity, tier };
    }
    
    const count = await this.getContentAccessCount(userId);
    const canAccess = count < limits.contentsAccess;
    
    return {
      allowed: canAccess,
      current: count,
      limit: limits.contentsAccess,
      remaining: Math.max(0, limits.contentsAccess - count),
      tier,
      upgradeRequired: !canAccess,
      message: canAccess 
        ? null 
        : `Vous avez atteint votre limite de ${limits.contentsAccess} contenus accessibles.`,
      messageEn: canAccess
        ? null
        : `You have reached your limit of ${limits.contentsAccess} accessible contents.`,
    };
  }

  /**
   * Check if user can export data
   */
  async canExportData(userId) {
    const { tier, limits } = await this.getUserLimits(userId);
    
    return {
      allowed: limits.dataExport,
      tier,
      upgradeRequired: !limits.dataExport,
      message: limits.dataExport 
        ? null 
        : 'L\'export de données n\'est disponible qu\'avec le plan Ultimate.',
      messageEn: limits.dataExport 
        ? null 
        : 'Data export is only available with the Ultimate plan.',
    };
  }

  /**
   * Get housing sites limit for user
   */
  async getHousingLimit(userId) {
    const { tier, limits } = await this.getUserLimits(userId);
    
    return {
      limit: limits.housingSites,
      allSites: limits.allHousingSites,
      guarantorServices: limits.guarantorServices,
      tier,
    };
  }

  /**
   * Get aides limit for user
   */
  async getAidesLimit(userId) {
    const { tier, limits } = await this.getUserLimits(userId);
    
    return {
      limit: limits.aides,
      allAides: limits.allAides,
      tier,
    };
  }

  /**
   * Track content access for daily limit
   */
  async trackContentAccess(userId, contentId) {
    try {
      // Check if user already viewed this content today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: existingView } = await this.db
        .from('content_views')
        .select('id')
        .eq('user_id', userId)
        .eq('content_id', contentId)
        .gte('created_at', today.toISOString())
        .single();
      
      // Only count new views for the day
      if (!existingView) {
        await this.db
          .from('content_views')
          .insert({
            user_id: userId,
            content_id: contentId,
            created_at: new Date().toISOString(),
          });
      }
      
      return true;
    } catch (error) {
      // Log but don't fail the request
      logger.error('Failed to track content access', { userId, contentId, error: error.message });
      return false;
    }
  }

  // ===========================================
  // Full Usage Summary
  // ===========================================

  /**
   * Get comprehensive usage summary for user
   */
  async getUsageSummary(userId) {
    const { tier, limits } = await this.getUserLimits(userId);
    
    const [aiCount, simCount, savedCount, procCount, contentCount] = await Promise.all([
      this.getAIMessageCount(userId),
      this.getSimulationCount(userId),
      this.getSavedAidesCount(userId),
      this.getProceduresCount(userId),
      this.getContentAccessCount(userId),
    ]);

    return {
      tier,
      limits,
      usage: {
        aiMessages: {
          current: aiCount,
          limit: limits.aiMessagesPerDay,
          remaining: Math.max(0, limits.aiMessagesPerDay - aiCount),
          percentage: limits.aiMessagesPerDay === Infinity ? 0 : Math.round((aiCount / limits.aiMessagesPerDay) * 100),
        },
        simulations: {
          current: simCount,
          limit: limits.simulationsPerDay,
          remaining: limits.unlimitedSimulations ? Infinity : Math.max(0, limits.simulationsPerDay - simCount),
          percentage: limits.unlimitedSimulations ? 0 : Math.round((simCount / limits.simulationsPerDay) * 100),
          unlimited: limits.unlimitedSimulations,
        },
        savedAides: {
          current: savedCount,
          limit: limits.savedAides,
          remaining: limits.unlimitedSaves ? Infinity : Math.max(0, limits.savedAides - savedCount),
          percentage: limits.unlimitedSaves ? 0 : Math.round((savedCount / limits.savedAides) * 100),
          unlimited: limits.unlimitedSaves,
        },
        procedures: {
          current: procCount,
          limit: limits.procedures,
          remaining: limits.unlimitedProcedures ? Infinity : Math.max(0, limits.procedures - procCount),
          percentage: limits.unlimitedProcedures ? 0 : Math.round((procCount / limits.procedures) * 100),
          unlimited: limits.unlimitedProcedures,
        },
        contents: {
          current: contentCount,
          limit: limits.contentsAccess,
          remaining: limits.allContents ? Infinity : Math.max(0, limits.contentsAccess - contentCount),
          percentage: limits.allContents ? 0 : Math.round((contentCount / limits.contentsAccess) * 100),
          unlimited: limits.allContents,
        },
      },
      features: {
        dataExport: limits.dataExport,
        prioritySupport: limits.supportLevel === 'priority',
        allHousingSites: limits.allHousingSites,
        allAides: limits.allAides,
        allContents: limits.allContents,
      },
    };
  }

  /**
   * Get upgrade recommendation based on usage
   */
  async getUpgradeRecommendation(userId) {
    const summary = await this.getUsageSummary(userId);
    const { tier, usage } = summary;

    // Already on ultimate, no upgrade needed
    if (tier === 'ultimate') {
      return { recommendedTier: null, reasons: [] };
    }

    const reasons = [];
    let recommendedTier = null;

    // Check which limits are being hit
    if (usage.aiMessages.percentage >= 80) {
      reasons.push({
        feature: 'aiMessages',
        message: 'Vous utilisez fréquemment l\'assistant IA',
        messageEn: 'You frequently use the AI assistant',
      });
    }

    if (!usage.simulations.unlimited && usage.simulations.percentage >= 80) {
      reasons.push({
        feature: 'simulations',
        message: 'Vous effectuez de nombreuses simulations',
        messageEn: 'You run many simulations',
      });
    }

    if (!usage.savedAides.unlimited && usage.savedAides.percentage >= 80) {
      reasons.push({
        feature: 'savedAides',
        message: 'Vous sauvegardez beaucoup d\'aides',
        messageEn: 'You save many aides',
      });
    }

    if (!usage.procedures.unlimited && usage.procedures.percentage >= 80) {
      reasons.push({
        feature: 'procedures',
        message: 'Vous suivez de nombreuses procédures',
        messageEn: 'You track many procedures',
      });
    }

    // Determine recommended tier based on current tier and reasons
    if (reasons.length > 0) {
      if (tier === 'free') {
        recommendedTier = reasons.length >= 3 ? 'premium' : 'basic';
      } else if (tier === 'basic') {
        recommendedTier = 'premium';
      } else if (tier === 'premium') {
        recommendedTier = 'ultimate';
      }
    }

    return {
      currentTier: tier,
      recommendedTier,
      reasons,
      tiers: this.getAllTiers(),
    };
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
