import { analyticsService } from '../services/analytics.service.js';
import { formatResponse } from '../utils/helpers.js';

/**
 * Track a generic event
 */
export const trackEvent = async (req, res, next) => {
  try {
    const { event_type, event_data, page_url, referrer, session_id } = req.body;

    await analyticsService.trackEvent({
      userId: req.user?.id,
      eventType: event_type,
      eventData: event_data,
      pageUrl: page_url,
      referrer,
      sessionId: session_id,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    res.json(formatResponse({ success: true }));
  } catch (error) {
    next(error);
  }
};

/**
 * Track aide view
 */
export const trackAideView = async (req, res, next) => {
  try {
    const { aide_id, session_id } = req.body;

    await analyticsService.trackAideView(aide_id, req.user?.id, session_id);

    res.json(formatResponse({ success: true }));
  } catch (error) {
    next(error);
  }
};

/**
 * Track aide click (apply/learn more)
 */
export const trackAideClick = async (req, res, next) => {
  try {
    const { aide_id, click_type } = req.body;

    await analyticsService.trackAideClick(aide_id, req.user?.id, click_type);

    res.json(formatResponse({ success: true }));
  } catch (error) {
    next(error);
  }
};

/**
 * Track search query
 */
export const trackSearch = async (req, res, next) => {
  try {
    const { query, results_count, filters } = req.body;

    await analyticsService.trackSearch(query, results_count, req.user?.id, filters);

    res.json(formatResponse({ success: true }));
  } catch (error) {
    next(error);
  }
};

/**
 * Track session start
 */
export const trackSessionStart = async (req, res, next) => {
  try {
    const { session_id, referrer, landing_page } = req.body;

    const result = await analyticsService.trackSessionStart({
      sessionId: session_id,
      userId: req.user?.id,
      userAgent: req.headers['user-agent'],
      referrer,
      landingPage: landing_page,
    });

    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

/**
 * Track session end
 */
export const trackSessionEnd = async (req, res, next) => {
  try {
    const { session_id, duration } = req.body;

    await analyticsService.trackSessionEnd(session_id, duration);

    res.json(formatResponse({ success: true }));
  } catch (error) {
    next(error);
  }
};

/**
 * Track anonymous visitor
 * POST /analytics/visitor
 */
export const trackAnonymousVisitor = async (req, res, next) => {
  try {
    const {
      device_fingerprint,
      device_type,
      browser,
      os,
      source,
      medium,
      campaign,
      referrer,
      landing_page,
    } = req.body;

    const result = await analyticsService.trackAnonymousVisitor({
      deviceFingerprint: device_fingerprint,
      ip: req.ip || req.headers['x-forwarded-for']?.split(',')[0],
      userAgent: req.headers['user-agent'],
      deviceType: device_type,
      browser,
      os,
      source,
      medium,
      campaign,
      referrer,
      landingPage: landing_page,
    });

    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

/**
 * Update anonymous visitor page view
 * POST /analytics/visitor/pageview
 */
export const trackVisitorPageView = async (req, res, next) => {
  try {
    const { device_fingerprint, page_url, time_on_page } = req.body;

    const result = await analyticsService.updateVisitorPageView({
      deviceFingerprint: device_fingerprint,
      pageUrl: page_url,
      timeOnPage: time_on_page,
    });

    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

/**
 * Convert anonymous visitor to user
 * Called after signup to link anonymous data to user profile
 */
export const convertVisitorToUser = async (req, res, next) => {
  try {
    const { device_fingerprint } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const result = await analyticsService.convertVisitorToUser(device_fingerprint, userId);

    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};
