// ===========================================
// Application Constants
// ===========================================

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
};

// Daily AI message limits by tier
export const AI_MESSAGE_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: 10,
  [SUBSCRIPTION_TIERS.BASIC]: 50,
  [SUBSCRIPTION_TIERS.PREMIUM]: 200,
  [SUBSCRIPTION_TIERS.ENTERPRISE]: Infinity,
};

// User statuses
export const USER_STATUS = {
  STUDENT: 'student',
  WORKER: 'worker',
  JOB_SEEKER: 'job_seeker',
  RETIREE: 'retiree',
  TOURIST: 'tourist',
  OTHER: 'other',
};

// Nationality types
export const NATIONALITY_TYPES = {
  FRENCH: 'french',
  EU_EEA: 'eu_eea',
  NON_EU: 'non_eu',
  OTHER: 'other',
};

// Admin roles
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  SUPPORT: 'support',
};

// Content types
export const CONTENT_TYPES = {
  VIDEO: 'video',
  IMAGE: 'image',
  ARTICLE: 'article',
  GUIDE: 'guide',
  INFOGRAPHIC: 'infographic',
};

// Subscription statuses (Stripe)
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  PAST_DUE: 'past_due',
  UNPAID: 'unpaid',
  TRIALING: 'trialing',
  INCOMPLETE: 'incomplete',
  INCOMPLETE_EXPIRED: 'incomplete_expired',
  PAUSED: 'paused',
};

// Payout statuses
export const PAYOUT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// Email template keys
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  SUBSCRIPTION_WELCOME: 'subscription_welcome',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
  AFFILIATE_PAYOUT: 'affiliate_payout',
  EMAIL_VERIFICATION: 'email_verification',
};

// Action types for analytics
export const ACTION_TYPES = {
  PAGE_VIEW: 'page_view',
  API_CALL: 'api_call',
  SEARCH: 'search',
  CLICK: 'click',
  FORM_SUBMIT: 'form_submit',
};

// Search types
export const SEARCH_TYPES = {
  AIDES: 'aides',
  PROCEDURES: 'procedures',
  RENTING: 'renting',
  GENERAL: 'general',
};

// Supported languages
export const SUPPORTED_LANGUAGES = ['fr', 'en', 'es', 'de', 'it', 'pt', 'ar', 'zh', 'ja', 'ko'];

// Default language
export const DEFAULT_LANGUAGE = 'fr';

// French regions
export const FRENCH_REGIONS = [
  'ile-de-france',
  'auvergne-rhone-alpes',
  'bourgogne-franche-comte',
  'bretagne',
  'centre-val-de-loire',
  'corse',
  'grand-est',
  'hauts-de-france',
  'normandie',
  'nouvelle-aquitaine',
  'occitanie',
  'pays-de-la-loire',
  'provence-alpes-cote-dazur',
  'guadeloupe',
  'martinique',
  'guyane',
  'reunion',
  'mayotte',
];
