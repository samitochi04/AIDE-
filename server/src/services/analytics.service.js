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
          const [users, subscriptions, engagement, ai, simulations, revenue, usersByProfile, conversions, geography] = await Promise.all([
            this.getUserAnalytics(start, end),
            this.getSubscriptionAnalytics(start, end),
            this.getEngagementAnalytics(start, end),
            this.getAIAnalytics(start, end),
            this.getSimulationAnalytics(start, end),
            this.getRevenueAnalytics(start, end),
            this.getUsersByProfileType(),
            this.getConversionRates(start, end),
            this.getGeographyStats(),
          ]);
          return { users, subscriptions, engagement, ai, simulations, revenue, usersByProfile, conversions, geography };
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
      // Get active subscriptions from stripe_subscriptions table
      const { count: active } = await this.db
        .from('stripe_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get subscriptions by tier
      const { data: byTierData } = await this.db
        .from('stripe_subscriptions')
        .select('tier')
        .eq('status', 'active');

      const byTier = {};
      (byTierData || []).forEach((sub) => {
        byTier[sub.tier] = (byTier[sub.tier] || 0) + 1;
      });

      // Get new subscriptions in period
      const { count: newSubs } = await this.db
        .from('stripe_subscriptions')
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
      // Get total revenue from stripe_subscriptions and stripe_invoices
      const { data: subs } = await this.db
        .from('stripe_subscriptions')
        .select('tier, status, current_period_start, current_period_end');

      // Calculate MRR (Monthly Recurring Revenue)
      const tierPrices = { basic: 4.99, plus: 9.99, premium: 19.99 };
      const activeSubs = (subs || []).filter(s => s.status === 'active');
      const monthly = activeSubs.reduce((sum, sub) => sum + (tierPrices[sub.tier] || 0), 0);
      
      // Get actual revenue from invoices in period
      const { data: invoices } = await this.db
        .from('stripe_invoices')
        .select('amount_paid')
        .eq('status', 'paid')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      // Sum paid invoices (amount is in cents)
      const totalRevenue = (invoices || []).reduce((sum, inv) => sum + (inv.amount_paid || 0), 0) / 100;

      return {
        total: Math.round(totalRevenue * 100) / 100,
        monthly: Math.round(monthly * 100) / 100,
      };
    } catch (error) {
      logger.error('Failed to get revenue analytics', { error: error.message });
      return { total: 0, monthly: 0 };
    }
  }

  /**
   * Get users by profile type
   * Uses 'status' column which is user_status enum: student, worker, job_seeker, retiree, tourist, other
   */
  async getUsersByProfileType() {
    try {
      const { data: profiles } = await this.db
        .from('profiles')
        .select('status')
        .eq('is_active', true);

      const byProfile = {
        students: 0,
        workers: 0,
        jobSeekers: 0,
        retirees: 0,
        tourists: 0,
        other: 0,
      };

      (profiles || []).forEach((p) => {
        const status = p.status || 'other';
        switch (status) {
          case 'student':
            byProfile.students++;
            break;
          case 'worker':
            byProfile.workers++;
            break;
          case 'job_seeker':
            byProfile.jobSeekers++;
            break;
          case 'retiree':
            byProfile.retirees++;
            break;
          case 'tourist':
            byProfile.tourists++;
            break;
          default:
            byProfile.other++;
        }
      });

      return byProfile;
    } catch (error) {
      logger.error('Failed to get users by profile type', { error: error.message });
      return { students: 0, workers: 0, jobSeekers: 0, retirees: 0, tourists: 0, other: 0 };
    }
  }

  /**
   * Get engagement analytics
   */
  async getEngagementAnalytics(startDate, endDate) {
    try {
      // Get saved aides count
      const { count: savedAides } = await this.db
        .from('saved_aides')
        .select('*', { count: 'exact', head: true });

      // Get procedures started
      const { count: proceduresStarted } = await this.db
        .from('user_procedures')
        .select('*', { count: 'exact', head: true });

      // Get chat messages (table may not exist)
      let chatMessages = 0;
      try {
        const { count } = await this.db
          .from('chat_messages')
          .select('*', { count: 'exact', head: true });
        chatMessages = count || 0;
      } catch {
        // chat_messages table may not exist
      }

      // Calculate average session time (simplified - from sessions table if exists)
      let avgSessionTime = '0m';
      try {
        const { data: sessions } = await this.db
          .from('user_sessions')
          .select('duration_seconds')
          .not('duration_seconds', 'is', null)
          .limit(1000);
        
        if (sessions && sessions.length > 0) {
          const avgSeconds = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / sessions.length;
          const avgMinutes = Math.round(avgSeconds / 60);
          avgSessionTime = `${avgMinutes}m`;
        }
      } catch {
        // user_sessions table may not exist
      }

      return {
        savedAides: savedAides || 0,
        proceduresStarted: proceduresStarted || 0,
        chatMessages,
        avgSessionTime,
      };
    } catch (error) {
      logger.error('Failed to get engagement analytics', { error: error.message });
      return { savedAides: 0, proceduresStarted: 0, chatMessages: 0, avgSessionTime: '0m' };
    }
  }

  /**
   * Get conversion rates
   */
  async getConversionRates(startDate, endDate) {
    try {
      // Total users
      const { count: totalUsers } = await this.db
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Users who ran at least one simulation
      const { data: usersWithSimulations } = await this.db
        .from('simulations')
        .select('user_id')
        .not('user_id', 'is', null);
      
      const uniqueUsersWithSim = new Set((usersWithSimulations || []).map(s => s.user_id)).size;

      // Premium users (non-free subscription)
      const { count: premiumUsers } = await this.db
        .from('stripe_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // 30-day retention: users who signed up 30+ days ago and were active in last 7 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const { count: oldUsers } = await this.db
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .lte('created_at', thirtyDaysAgo.toISOString())
        .eq('is_active', true);
      
      const { count: retainedUsers } = await this.db
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .lte('created_at', thirtyDaysAgo.toISOString())
        .gte('last_seen_at', sevenDaysAgo.toISOString())
        .eq('is_active', true);

      // Calculate percentages
      const signupToSimulation = totalUsers > 0 ? Math.round((uniqueUsersWithSim / totalUsers) * 100) : 0;
      const freeToPremium = totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0;
      const retention30Day = oldUsers > 0 ? Math.round((retainedUsers / oldUsers) * 100) : 0;

      return {
        signupToSimulation,
        freeToPremium,
        retention30Day,
      };
    } catch (error) {
      logger.error('Failed to get conversion rates', { error: error.message });
      return { signupToSimulation: 0, freeToPremium: 0, retention30Day: 0 };
    }
  }

  /**
   * Get geography stats by user nationality
   */
  async getGeographyStats() {
    try {
      const { data: profiles } = await this.db
        .from('profiles')
        .select('nationality, country_of_origin')
        .eq('is_active', true);

      // Count by nationality
      const nationalityCounts = {};
      (profiles || []).forEach((p) => {
        const nat = p.nationality || 'other';
        nationalityCounts[nat] = (nationalityCounts[nat] || 0) + 1;
      });

      // Map nationalities to display format
      const nationalityMap = {
        french: { country: 'France', flag: '🇫🇷' },
        eu_eea: { country: 'EU/EEA', flag: '🇪🇺' },
        non_eu: { country: 'Non-EU', flag: '🌍' },
        other: { country: 'Other', flag: '🏳️' },
      };

      const geography = Object.entries(nationalityCounts)
        .map(([key, count]) => ({
          country: nationalityMap[key]?.country || key,
          flag: nationalityMap[key]?.flag || '🏳️',
          count,
        }))
        .sort((a, b) => b.count - a.count);

      return geography;
    } catch (error) {
      logger.error('Failed to get geography stats', { error: error.message });
      return [];
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

  /**
   * Track anonymous visitor
   */
  async trackAnonymousVisitor(data) {
    const {
      deviceFingerprint,
      ip,
      userAgent,
      deviceType,
      browser,
      os,
      source,
      medium,
      campaign,
      referrer,
      landingPage,
    } = data;

    try {
      // Check if visitor already exists
      const { data: existing } = await this.db
        .from('anonymous_visitors')
        .select('id, total_page_views, total_sessions')
        .eq('device_fingerprint', deviceFingerprint)
        .single();

      if (existing) {
        // Update existing visitor
        const { error } = await this.db
          .from('anonymous_visitors')
          .update({
            current_ip: ip,
            last_seen_at: new Date().toISOString(),
            total_page_views: (existing.total_page_views || 0) + 1,
            total_sessions: (existing.total_sessions || 0) + 1,
          })
          .eq('id', existing.id);

        if (error) throw error;
        return { success: true, visitorId: existing.id, isNew: false };
      }

      // Create new visitor
      const { data: newVisitor, error } = await this.db
        .from('anonymous_visitors')
        .insert({
          device_fingerprint: deviceFingerprint,
          first_ip: ip,
          current_ip: ip,
          user_agent: userAgent,
          device_type: deviceType,
          browser,
          os,
          first_source: source,
          first_medium: medium,
          first_campaign: campaign,
          first_referrer: referrer,
          landing_page: landingPage,
          total_page_views: 1,
          total_sessions: 1,
        })
        .select('id')
        .single();

      if (error) throw error;
      return { success: true, visitorId: newVisitor.id, isNew: true };
    } catch (error) {
      logger.error('Failed to track anonymous visitor', { error: error.message });
      return { success: false };
    }
  }

  /**
   * Update visitor page view
   */
  async updateVisitorPageView(data) {
    const { deviceFingerprint, pageUrl, timeOnPage } = data;

    try {
      const { data: visitor } = await this.db
        .from('anonymous_visitors')
        .select('id, total_page_views, total_time_seconds')
        .eq('device_fingerprint', deviceFingerprint)
        .single();

      if (!visitor) {
        return { success: false, error: 'Visitor not found' };
      }

      const { error } = await this.db
        .from('anonymous_visitors')
        .update({
          last_seen_at: new Date().toISOString(),
          total_page_views: (visitor.total_page_views || 0) + 1,
          total_time_seconds: (visitor.total_time_seconds || 0) + (timeOnPage || 0),
        })
        .eq('id', visitor.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      logger.error('Failed to update visitor page view', { error: error.message });
      return { success: false };
    }
  }

  /**
   * Convert anonymous visitor to user
   */
  async convertVisitorToUser(deviceFingerprint, userId) {
    try {
      const { data: visitor } = await this.db
        .from('anonymous_visitors')
        .select('id')
        .eq('device_fingerprint', deviceFingerprint)
        .single();

      if (!visitor) {
        return { success: false, error: 'Visitor not found' };
      }

      const { error } = await this.db
        .from('anonymous_visitors')
        .update({
          converted_to_user_id: userId,
          converted_at: new Date().toISOString(),
        })
        .eq('id', visitor.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      logger.error('Failed to convert visitor to user', { error: error.message });
      return { success: false };
    }
  }

  /**
   * Get anonymous visitor stats (for admin)
   */
  async getAnonymousVisitorStats() {
    try {
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - 7);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get total visitors
      const { count: totalVisitors } = await this.db
        .from('anonymous_visitors')
        .select('*', { count: 'exact', head: true });

      // Get today's visitors
      const { count: todayVisitors } = await this.db
        .from('anonymous_visitors')
        .select('*', { count: 'exact', head: true })
        .gte('first_seen_at', today.toISOString());

      // Get this week's visitors
      const { count: weekVisitors } = await this.db
        .from('anonymous_visitors')
        .select('*', { count: 'exact', head: true })
        .gte('first_seen_at', thisWeek.toISOString());

      // Get this month's visitors
      const { count: monthVisitors } = await this.db
        .from('anonymous_visitors')
        .select('*', { count: 'exact', head: true })
        .gte('first_seen_at', thisMonth.toISOString());

      // Get converted visitors
      const { count: convertedVisitors } = await this.db
        .from('anonymous_visitors')
        .select('*', { count: 'exact', head: true })
        .not('converted_to_user_id', 'is', null);

      // Get device breakdown
      const { data: deviceData } = await this.db
        .from('anonymous_visitors')
        .select('device_type');

      const deviceBreakdown = {};
      deviceData?.forEach((v) => {
        const type = v.device_type || 'unknown';
        deviceBreakdown[type] = (deviceBreakdown[type] || 0) + 1;
      });

      // Get top landing pages
      const { data: landingData } = await this.db
        .from('anonymous_visitors')
        .select('landing_page')
        .not('landing_page', 'is', null);

      const landingPages = {};
      landingData?.forEach((v) => {
        const page = v.landing_page;
        if (page) {
          landingPages[page] = (landingPages[page] || 0) + 1;
        }
      });

      const topLandingPages = Object.entries(landingPages)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Get traffic sources
      const { data: sourceData } = await this.db
        .from('anonymous_visitors')
        .select('first_source, first_medium');

      const sources = {};
      sourceData?.forEach((v) => {
        const source = v.first_source || 'direct';
        sources[source] = (sources[source] || 0) + 1;
      });

      const trafficSources = Object.entries(sources)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count);

      return {
        total: totalVisitors || 0,
        today: todayVisitors || 0,
        thisWeek: weekVisitors || 0,
        thisMonth: monthVisitors || 0,
        converted: convertedVisitors || 0,
        conversionRate: totalVisitors ? ((convertedVisitors || 0) / totalVisitors * 100).toFixed(1) : 0,
        deviceBreakdown,
        topLandingPages,
        trafficSources,
      };
    } catch (error) {
      logger.error('Failed to get anonymous visitor stats', { error: error.message });
      return {
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        converted: 0,
        conversionRate: 0,
        deviceBreakdown: {},
        topLandingPages: [],
        trafficSources: [],
      };
    }
  }

  /**
   * Get recent anonymous visitors (for admin)
   */
  async getRecentVisitors(options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    try {
      const { data, count, error } = await this.db
        .from('anonymous_visitors')
        .select('*', { count: 'exact' })
        .order('last_seen_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        visitors: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to get recent visitors', { error: error.message });
      return { visitors: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
