// ===========================================
// Application Constants
// ===========================================

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
  ULTIMATE: 'ultimate',
};

// Subscription pricing (EUR)
export const SUBSCRIPTION_PRICING = {
  free: { monthly: 0, yearly: 0 },
  basic: { monthly: 4.99, yearly: 49.99 },
  premium: { monthly: 9.99, yearly: 99.99 },
  ultimate: { monthly: 14.99, yearly: 149.99 },
};

// ===========================================
// TIER LIMITS - Complete feature limits per tier
// ===========================================
export const TIER_LIMITS = {
  free: {
    // Benefits/Aides
    aides: 3,                    // Number of aides visible
    allAides: false,             // Access to all aides
    
    // Simulation
    simulationsPerDay: 5,        // Simulations per day
    unlimitedSimulations: false,
    
    // Housing
    guarantorServices: 1,        // Guarantor services available
    housingSites: 5,             // Housing sites/platforms visible
    allHousingSites: false,
    
    // Favorites/Saves
    savedAides: 4,               // Max saved/favorite aides
    savedHousing: 4,             // Max saved housing platforms
    unlimitedSaves: false,
    
    // Procedures
    procedures: 2,               // Tracked procedures
    unlimitedProcedures: false,
    
    // Content (Tutorials, etc.)
    contentsAccess: 5,           // Number of tutorials/content accessible
    allContents: false,
    
    // AI Assistant
    aiMessagesPerDay: 3,         // AI messages per day
    
    // Export
    dataExport: false,           // Can export data
    
    // Support
    supportLevel: 'community',   // community | priority
    
    // Labels for UI
    label: 'Gratuit',
    labelEn: 'Free',
  },
  
  basic: {
    aides: Infinity,
    allAides: true,
    
    simulationsPerDay: Infinity,
    unlimitedSimulations: true,
    
    guarantorServices: Infinity,
    housingSites: 15,
    allHousingSites: false,
    
    savedAides: 10,
    savedHousing: 10,
    unlimitedSaves: false,
    
    procedures: 10,
    unlimitedProcedures: false,
    
    contentsAccess: 15,
    allContents: false,
    
    aiMessagesPerDay: 20,
    
    dataExport: false,
    
    supportLevel: 'community',
    
    label: 'Basic',
    labelEn: 'Basic',
  },
  
  premium: {
    aides: Infinity,
    allAides: true,
    
    simulationsPerDay: Infinity,
    unlimitedSimulations: true,
    
    guarantorServices: Infinity,
    housingSites: Infinity,
    allHousingSites: true,
    
    savedAides: Infinity,
    savedHousing: Infinity,
    unlimitedSaves: true,
    
    procedures: Infinity,
    unlimitedProcedures: true,
    
    contentsAccess: Infinity,
    allContents: true,
    
    aiMessagesPerDay: 60,
    
    dataExport: false,
    
    supportLevel: 'priority',
    
    label: 'Premium',
    labelEn: 'Premium',
    popular: true,
  },
  
  ultimate: {
    aides: Infinity,
    allAides: true,
    
    simulationsPerDay: Infinity,
    unlimitedSimulations: true,
    
    guarantorServices: Infinity,
    housingSites: Infinity,
    allHousingSites: true,
    
    savedAides: Infinity,
    savedHousing: Infinity,
    unlimitedSaves: true,
    
    procedures: Infinity,
    unlimitedProcedures: true,
    
    contentsAccess: Infinity,
    allContents: true,
    
    aiMessagesPerDay: 300,
    
    dataExport: true,
    
    supportLevel: 'priority',
    
    label: 'Ultimate',
    labelEn: 'Ultimate',
  },
};

// Legacy AI limits (kept for backward compatibility)
export const AI_MESSAGE_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: TIER_LIMITS.free.aiMessagesPerDay,
  [SUBSCRIPTION_TIERS.BASIC]: TIER_LIMITS.basic.aiMessagesPerDay,
  [SUBSCRIPTION_TIERS.PREMIUM]: TIER_LIMITS.premium.aiMessagesPerDay,
  [SUBSCRIPTION_TIERS.ULTIMATE]: TIER_LIMITS.ultimate.aiMessagesPerDay,
};

// AI limits configuration (used by ai.service.js)
export const AI_LIMITS = {
  free: {
    messagesPerMonth: TIER_LIMITS.free.aiMessagesPerDay * 30,
    messagesPerDay: TIER_LIMITS.free.aiMessagesPerDay,
    maxTokens: 1000,
  },
  basic: {
    messagesPerMonth: TIER_LIMITS.basic.aiMessagesPerDay * 30,
    messagesPerDay: TIER_LIMITS.basic.aiMessagesPerDay,
    maxTokens: 2000,
  },
  premium: {
    messagesPerMonth: TIER_LIMITS.premium.aiMessagesPerDay * 30,
    messagesPerDay: TIER_LIMITS.premium.aiMessagesPerDay,
    maxTokens: 4000,
  },
  ultimate: {
    messagesPerMonth: TIER_LIMITS.ultimate.aiMessagesPerDay * 30,
    messagesPerDay: TIER_LIMITS.ultimate.aiMessagesPerDay,
    maxTokens: 8000,
  },
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
  TUTORIAL: 'tutorial',
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
