import {
  analyticsEventRepository,
  sessionRepository,
  aideViewRepository,
  aideClickRepository,
  searchAnalyticsRepository,
  userRepository,
  subscriptionRepository,
  chatMessageRepository,
  chatConversationRepository,
} from '../repositories/index.js';
import { supabaseAdmin } from '../config/supabase.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

/**
 * Analytics Service
 * Handles tracking and analytics data
 */
class AnalyticsService {
  constructor() {
    this.db = supabaseAdmin;
  }

  /**
   * Track a generic event
   */
  async trackEvent(eventData) {
    const {
      userId,
      eventType,
      eventData: data,
      pageUrl,
      referrer,
      sessionId,
      userAgent,
      ipAddress,
    } = eventData;

    try {
      await analyticsEventRepository.create({
        user_id: userId || null,
        event_type: eventType,
        event_data: data || {},
        page_url: pageUrl,
        referrer,
        session_id: sessionId,
        user_agent: userAgent,
        ip_address: ipAddress,
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to track event', { eventType, error: error.message });
      return { success: false };
    }
  }

  /**
   * Track aide view
   */
  async trackAideView(aideId, userId = null, sessionId = null) {
    try {
      await aideViewRepository.create({
        aide_id: aideId,
        user_id: userId,
        session_id: sessionId,
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to track aide view', { aideId, error: error.message });
      return { success: false };
    }
  }

  /**
   * Track aide click (user clicks to apply/learn more)
   */
  async trackAideClick(aideId, userId = null, clickType = 'apply') {
    try {
      await aideClickRepository.create({
        aide_id: aideId,
        user_id: userId,
        click_type: clickType,
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to track aide click', { aideId, error: error.message });
      return { success: false };
    }
  }

  /**
   * Track search query
   */
  async trackSearch(query, resultsCount, userId = null, filters = {}) {
    try {
      await searchAnalyticsRepository.create({
        user_id: userId,
        search_query: query,
        results_count: resultsCount,
        filters,
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to track search', { query, error: error.message });
      return { success: false };
    }
  }

  /**
   * Track session start
   */
  async trackSessionStart(sessionData) {
    const { sessionId, userId, userAgent, referrer, landingPage } = sessionData;

    try {
      await sessionRepository.create({
        id: sessionId,
        user_id: userId,
        user_agent: userAgent,
        referrer,
        landing_page: landingPage,
        started_at: new Date().toISOString(),
      });

      return { success: true, sessionId };
    } catch (error) {
      logger.error('Failed to track session start', { error: error.message });
      return { success: false };
    }
  }

  /**
   * Track session end
   */
  async trackSessionEnd(sessionId, duration) {
    try {
      await sessionRepository.endSession(sessionId, duration);
      return { success: true };
    } catch (error) {
      logger.error('Failed to track session end', { sessionId, error: error.message });
      return { success: false };
    }
  }

  /**
   * Get dashboard stats (for admin)
   */
  async getDashboardStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const [userStats, subscriptionStats, aideViews, searches] = await Promise.all([
        userRepository.getStats(),
        subscriptionRepository.getStats(),
        aideViewRepository.countInPeriod(thisMonth, new Date()),
        searchAnalyticsRepository.count(),
      ]);

      return {
        users: userStats,
        subscriptions: subscriptionStats,
        engagement: {
          aideViewsThisMonth: aideViews,
          searchesThisMonth: searches,
        },
      };
    } catch (error) {
      logger.error('Failed to get dashboard stats', { error: error.message });
      throw new AppError('Failed to get dashboard stats', 500);
    }
  }

  /**
   * Get detailed analytics (for admin)
   */
  async getDetailedAnalytics(options = {}) {
    const { startDate, endDate, metric } = options;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    try {
      switch (metric) {
        case 'users':
          return this.getUserAnalytics(start, end);
        case 'subscriptions':
          return this.getSubscriptionAnalytics(start, end);
        case 'engagement':
          return this.getEngagementAnalytics(start, end);
        case 'ai':
          return this.getAIAnalytics(start, end);
        default:
          // Return comprehensive dashboard metrics
          const [users, subscriptions, engagement, ai, simulations, revenue, usersByProfile] = await Promise.all([
            this.getUserAnalytics(start, end),
            this.getSubscriptionAnalytics(start, end),
            this.getEngagementAnalytics(start, end),
            this.getAIAnalytics(start, end),
            this.getSimulationAnalytics(start, end),
            this.getRevenueAnalytics(start, end),
            this.getUsersByProfileType(),
          ]);
          return { users, subscriptions, engagement, ai, simulations, revenue, usersByProfile };
      }
    } catch (error) {
      logger.error('Failed to get detailed analytics', { error: error.message });
      throw new AppError('Failed to get analytics', 500);
    }
  }

  /**
   * Get user growth analytics
   */
  async getUserAnalytics(startDate, endDate) {
    try {
      // Get total users
      const { count: totalUsers } = await this.db
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get new users in period
      const { count: newUsers } = await this.db
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Get users in previous period (for comparison)
      const periodLength = endDate.getTime() - startDate.getTime();
      const prevStart = new Date(startDate.getTime() - periodLength);
      const { count: previousNew } = await this.db
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', prevStart.toISOString())
        .lt('created_at', startDate.toISOString());

      return {
        total: totalUsers || 0,
        new: newUsers || 0,
        previousNew: previousNew || 0,
      };
    } catch (error) {
      logger.error('Failed to get user analytics', { error: error.message });
      return { total: 0, new: 0, previousNew: 0 };
    }
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics(startDate, endDate) {
    try {
      // Get active subscriptions
      const { count: active } = await this.db
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get subscriptions by tier
      const { data: byTierData } = await this.db
        .from('subscriptions')
        .select('tier')
        .eq('status', 'active');

      const byTier = {};
      (byTierData || []).forEach((sub) => {
        byTier[sub.tier] = (byTier[sub.tier] || 0) + 1;
      });

      // Get new subscriptions in period
      const { count: newSubs } = await this.db
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      return {
        total: newSubs || 0,
        active: active || 0,
        byTier,
      };
    } catch (error) {
      logger.error('Failed to get subscription analytics', { error: error.message });
      return { total: 0, active: 0, byTier: {} };
    }
  }

  /**
   * Get simulation analytics
   */
  async getSimulationAnalytics(startDate, endDate) {
    try {
      // Get total simulations
      const { count: total } = await this.db
        .from('simulations')
        .select('*', { count: 'exact', head: true });

      // Get simulations in period
      const { count: recent } = await this.db
        .from('simulations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      return {
        total: total || 0,
        recent: recent || 0,
      };
    } catch (error) {
      logger.error('Failed to get simulation analytics', { error: error.message });
      return { total: 0, recent: 0 };
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(startDate, endDate) {
    try {
      // Get total revenue from subscriptions
      const { data: subs } = await this.db
        .from('subscriptions')
        .select('tier, status, current_period_start, current_period_end');

      // Calculate MRR (Monthly Recurring Revenue)
      const tierPrices = { basic: 4.99, plus: 9.99, premium: 19.99 };
      const activeSubs = (subs || []).filter(s => s.status === 'active');
      const monthly = activeSubs.reduce((sum, sub) => sum + (tierPrices[sub.tier] || 0), 0);
      
      // Estimate total revenue (simplified calculation)
      const total = monthly * 12; // Annualized

      return {
        total: Math.round(total * 100) / 100,
        monthly: Math.round(monthly * 100) / 100,
      };
    } catch (error) {
      logger.error('Failed to get revenue analytics', { error: error.message });
      return { total: 0, monthly: 0 };
    }
  }

  /**
   * Get users by profile type
   */
  async getUsersByProfileType() {
    try {
      const { data: profiles } = await this.db
        .from('profiles')
        .select('profile_type');

      const byProfile = {
        students: 0,
        workers: 0,
        families: 0,
        entrepreneurs: 0,
        other: 0,
      };

      (profiles || []).forEach((p) => {
        const type = p.profile_type || 'other';
        if (type === 'student') byProfile.students++;
        else if (type === 'worker' || type === 'employee') byProfile.workers++;
        else if (type === 'family' || type === 'parent') byProfile.families++;
        else if (type === 'entrepreneur' || type === 'business') byProfile.entrepreneurs++;
        else byProfile.other++;
      });

      return byProfile;
    } catch (error) {
      logger.error('Failed to get users by profile type', { error: error.message });
      return { students: 0, workers: 0, families: 0, entrepreneurs: 0, other: 0 };
    }
  }

  /**
   * Get engagement analytics
   */
  async getEngagementAnalytics(startDate, endDate) {
    try {
      const [views, clicks, searches] = await Promise.all([
        aideViewRepository.countInPeriod(startDate, endDate).catch(() => 0),
        aideClickRepository.countInPeriod(startDate, endDate).catch(() => 0),
        searchAnalyticsRepository.countInPeriod(startDate, endDate).catch(() => 0),
      ]);

      return {
        aideViews: views || 0,
        aideClicks: clicks || 0,
        searches: searches || 0,
      };
    } catch (error) {
      logger.error('Failed to get engagement analytics', { error: error.message });
      return { aideViews: 0, aideClicks: 0, searches: 0 };
    }
  }

  /**
   * Get AI usage analytics
   */
  async getAIAnalytics(startDate, endDate) {
    try {
      const [messages, conversations] = await Promise.all([
        chatMessageRepository.countInPeriod(startDate, endDate).catch(() => 0),
        chatConversationRepository.countInPeriod(startDate, endDate).catch(() => 0),
      ]);

      return {
        totalMessages: messages || 0,
        totalConversations: conversations || 0,
      };
    } catch (error) {
      logger.error('Failed to get AI analytics', { error: error.message });
      return { totalMessages: 0, totalConversations: 0 };
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
