import Joi from 'joi';

/**
 * Analytics validation schemas
 */

// Event types
export const EVENT_TYPES = [
  'page_view',
  'aide_view',
  'aide_click',
  'search',
  'chat_message',
  'signup',
  'login',
  'subscription_start',
  'subscription_cancel',
  'profile_update',
  'favorite_add',
  'favorite_remove',
  'share',
  'download',
];

// Analytics event schema
export const analyticsEventSchema = Joi.object({
  id: Joi.string().uuid(),
  user_id: Joi.string().uuid().allow(null),
  session_id: Joi.string().uuid().allow(null),
  event_type: Joi.string().valid(...EVENT_TYPES).required(),
  event_data: Joi.object().default({}),
  page_url: Joi.string().uri().max(500).allow(null),
  referrer: Joi.string().uri().max(500).allow('', null),
  user_agent: Joi.string().max(500).allow(null),
  ip_address: Joi.string().ip().allow(null),
  country: Joi.string().max(100).allow(null),
  city: Joi.string().max(100).allow(null),
  device_type: Joi.string().valid('desktop', 'mobile', 'tablet').allow(null),
  browser: Joi.string().max(100).allow(null),
  os: Joi.string().max(100).allow(null),
  created_at: Joi.date(),
});

// Track event request schema
export const trackEventRequestSchema = Joi.object({
  event_type: Joi.string().required(),
  event_data: Joi.object(),
  page_url: Joi.string().uri().max(500),
  referrer: Joi.string().uri().max(500).allow(''),
  session_id: Joi.string(),
});

// Session schema
export const sessionSchema = Joi.object({
  id: Joi.string().uuid(),
  user_id: Joi.string().uuid().allow(null),
  started_at: Joi.date().required(),
  ended_at: Joi.date().allow(null),
  duration_seconds: Joi.number().integer().min(0).allow(null),
  page_views: Joi.number().integer().min(0).default(0),
  landing_page: Joi.string().uri().max(500),
  exit_page: Joi.string().uri().max(500).allow(null),
  referrer: Joi.string().uri().max(500).allow('', null),
  user_agent: Joi.string().max(500).allow(null),
  ip_address: Joi.string().ip().allow(null),
  country: Joi.string().max(100).allow(null),
});

// Aide view schema
export const aideViewSchema = Joi.object({
  id: Joi.string().uuid(),
  aide_id: Joi.string().uuid().required(),
  user_id: Joi.string().uuid().allow(null),
  session_id: Joi.string().uuid().allow(null),
  created_at: Joi.date(),
});

// Aide click schema
export const aideClickSchema = Joi.object({
  id: Joi.string().uuid(),
  aide_id: Joi.string().uuid().required(),
  user_id: Joi.string().uuid().allow(null),
  click_type: Joi.string().valid('apply', 'learn_more', 'official_site', 'share').default('apply'),
  created_at: Joi.date(),
});

// Search analytics schema
export const searchAnalyticsSchema = Joi.object({
  id: Joi.string().uuid(),
  user_id: Joi.string().uuid().allow(null),
  search_query: Joi.string().max(500).required(),
  results_count: Joi.number().integer().min(0).required(),
  filters: Joi.object({
    region: Joi.string(),
    category: Joi.string(),
    tags: Joi.array().items(Joi.string()),
  }),
  clicked_result_id: Joi.string().uuid().allow(null),
  created_at: Joi.date(),
});

// Analytics date range schema
export const dateRangeSchema = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref('startDate')).required(),
  granularity: Joi.string().valid('hour', 'day', 'week', 'month').default('day'),
});

// Dashboard stats request schema
export const dashboardStatsRequestSchema = Joi.object({
  period: Joi.string().valid('today', 'yesterday', 'week', 'month', 'year', 'custom').default('month'),
  startDate: Joi.date().when('period', {
    is: 'custom',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  endDate: Joi.date().when('period', {
    is: 'custom',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

export default {
  EVENT_TYPES,
  analyticsEventSchema,
  trackEventRequestSchema,
  sessionSchema,
  aideViewSchema,
  aideClickSchema,
  searchAnalyticsSchema,
  dateRangeSchema,
  dashboardStatsRequestSchema,
};
