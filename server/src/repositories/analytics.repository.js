import { BaseRepository } from './base.repository.js';

/**
 * Analytics Event Repository
 */
class AnalyticsEventRepository extends BaseRepository {
  constructor() {
    super('analytics_events');
  }

  /**
   * Find events by user
   */
  async findByUser(userId, options = {}) {
    return this.findAll({
      ...options,
      filters: { user_id: userId },
    });
  }

  /**
   * Find recent events by user (for admin activity log)
   */
  async findRecentByUser(userId, limit = 50) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Find events by type
   */
  async findByType(eventType, options = {}) {
    return this.findAll({
      ...options,
      filters: { event_type: eventType },
    });
  }

  /**
   * Count events by type in period
   */
  async countByType(eventType, startDate, endDate) {
    const { count, error } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('event_type', eventType)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get events grouped by type
   */
  async getEventsByType(startDate, endDate) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('event_type')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const counts = {};
    data?.forEach((e) => {
      counts[e.event_type] = (counts[e.event_type] || 0) + 1;
    });

    return counts;
  }
}

/**
 * Session Repository
 */
class SessionRepository extends BaseRepository {
  constructor() {
    super('sessions');
  }

  /**
   * Find active sessions
   */
  async findActive() {
    return this.findBy({ ended_at: null });
  }

  /**
   * End session
   */
  async endSession(sessionId, duration) {
    return this.update(sessionId, {
      ended_at: new Date().toISOString(),
      duration_seconds: duration,
    });
  }

  /**
   * Get average session duration
   */
  async getAverageDuration(startDate, endDate) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('duration_seconds')
      .not('duration_seconds', 'is', null)
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString());

    if (error) throw error;

    if (!data || data.length === 0) return 0;

    const total = data.reduce((sum, s) => sum + s.duration_seconds, 0);
    return Math.round(total / data.length);
  }

  /**
   * Get session count by day
   */
  async getSessionsByDay(startDate, endDate) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('started_at')
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString());

    if (error) throw error;

    const byDay = {};
    data?.forEach((s) => {
      const day = s.started_at.split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    return byDay;
  }
}

/**
 * Aide View Repository
 */
class AideViewRepository extends BaseRepository {
  constructor() {
    super('aide_views');
  }

  /**
   * Count views in a period
   */
  async countInPeriod(startDate, endDate) {
    const { count, error } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;
    return count || 0;
  }

  /**
   * Count views for aide
   */
  async countByAide(aideId, since = null) {
    const filters = { aide_id: aideId };

    if (since) {
      const { count, error } = await this.db
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('aide_id', aideId)
        .gte('created_at', since.toISOString());

      if (error) throw error;
      return count || 0;
    }

    return this.count(filters);
  }

  /**
   * Get most viewed aides
   */
  async getMostViewed(limit = 10, since = null) {
    let query = this.db
      .from(this.tableName)
      .select('aide_id');

    if (since) {
      query = query.gte('created_at', since.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Count views per aide
    const counts = {};
    data?.forEach((v) => {
      counts[v.aide_id] = (counts[v.aide_id] || 0) + 1;
    });

    // Sort and limit
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([aideId, count]) => ({ aideId, count }));
  }
}

/**
 * Aide Click Repository
 */
class AideClickRepository extends BaseRepository {
  constructor() {
    super('aide_clicks');
  }

  /**
   * Count clicks in a period
   */
  async countInPeriod(startDate, endDate) {
    const { count, error } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;
    return count || 0;
  }

  /**
   * Count clicks for aide
   */
  async countByAide(aideId, since = null) {
    const filters = { aide_id: aideId };

    if (since) {
      const { count, error } = await this.db
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('aide_id', aideId)
        .gte('created_at', since.toISOString());

      if (error) throw error;
      return count || 0;
    }

    return this.count(filters);
  }

  /**
   * Get click through rate
   */
  async getClickThroughRate(aideId, since) {
    const [views, clicks] = await Promise.all([
      new AideViewRepository().countByAide(aideId, since),
      this.countByAide(aideId, since),
    ]);

    if (views === 0) return 0;
    return (clicks / views) * 100;
  }
}

/**
 * Search Analytics Repository
 */
class SearchAnalyticsRepository extends BaseRepository {
  constructor() {
    super('search_analytics');
  }

  /**
   * Count searches in a period
   */
  async countInPeriod(startDate, endDate) {
    const { count, error } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(limit = 20, since = null) {
    let query = this.db
      .from(this.tableName)
      .select('search_query');

    if (since) {
      query = query.gte('created_at', since.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Count searches
    const counts = {};
    data?.forEach((s) => {
      const query = s.search_query.toLowerCase().trim();
      counts[query] = (counts[query] || 0) + 1;
    });

    // Sort and limit
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));
  }

  /**
   * Get searches with no results
   */
  async getZeroResultSearches(limit = 20, since = null) {
    let query = this.db
      .from(this.tableName)
      .select('search_query')
      .eq('results_count', 0);

    if (since) {
      query = query.gte('created_at', since.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Count and dedupe
    const counts = {};
    data?.forEach((s) => {
      const q = s.search_query.toLowerCase().trim();
      counts[q] = (counts[q] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));
  }
}

export const analyticsEventRepository = new AnalyticsEventRepository();
export const sessionRepository = new SessionRepository();
export const aideViewRepository = new AideViewRepository();
export const aideClickRepository = new AideClickRepository();
export const searchAnalyticsRepository = new SearchAnalyticsRepository();

export {
  AnalyticsEventRepository,
  SessionRepository,
  AideViewRepository,
  AideClickRepository,
  SearchAnalyticsRepository,
};

export default {
  events: analyticsEventRepository,
  sessions: sessionRepository,
  aideViews: aideViewRepository,
  aideClicks: aideClickRepository,
  searches: searchAnalyticsRepository,
};
