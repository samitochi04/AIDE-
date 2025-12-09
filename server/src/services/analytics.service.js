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
import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

/**
 * Analytics Service
 * Handles tracking and analytics data
 */
class AnalyticsService {
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
          // Return all metrics
          const [users, subscriptions, engagement, ai] = await Promise.all([
            this.getUserAnalytics(start, end),
            this.getSubscriptionAnalytics(start, end),
            this.getEngagementAnalytics(start, end),
            this.getAIAnalytics(start, end),
          ]);
          return { users, subscriptions, engagement, ai };
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
    const users = await userRepository.findCreatedInPeriod(startDate, endDate);

    // Group by day
    const byDay = {};
    users.forEach((user) => {
      const day = user.created_at.split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    return {
      total: users.length,
      byDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
    };
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics(startDate, endDate) {
    const subscriptions = await subscriptionRepository.findCreatedInPeriod(startDate, endDate);

    // Group by tier
    const byTier = {};
    subscriptions.forEach((sub) => {
      byTier[sub.tier] = (byTier[sub.tier] || 0) + 1;
    });

    return {
      total: subscriptions.length,
      byTier,
      active: subscriptions.filter((s) => s.status === 'active').length,
    };
  }

  /**
   * Get engagement analytics
   */
  async getEngagementAnalytics(startDate, endDate) {
    const [views, clicks, searches] = await Promise.all([
      aideViewRepository.countInPeriod(startDate, endDate),
      aideClickRepository.countInPeriod(startDate, endDate),
      searchAnalyticsRepository.countInPeriod(startDate, endDate),
    ]);

    return {
      aideViews: views,
      aideClicks: clicks,
      searches: searches,
    };
  }

  /**
   * Get AI usage analytics
   */
  async getAIAnalytics(startDate, endDate) {
    const [messages, conversations] = await Promise.all([
      chatMessageRepository.countInPeriod(startDate, endDate),
      chatConversationRepository.countInPeriod(startDate, endDate),
    ]);

    return {
      totalMessages: messages,
      totalConversations: conversations,
    };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
