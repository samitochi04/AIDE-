// API configuration and client

import { API_URL } from './constants'

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    SEND_MAGIC_LINK: '/api/v1/auth/send-magic-link',
    SEND_WELCOME_EMAIL: '/api/v1/auth/send-welcome-email',
    SEND_PASSWORD_RESET: '/api/v1/auth/send-password-reset',
    RESEND_VERIFICATION: '/api/v1/auth/resend-verification',
  },
  
  // Simulation
  SIMULATION: {
    RUN: '/api/v1/simulation/run',
    HISTORY: '/api/v1/simulation/history',
    LATEST: '/api/v1/simulation/latest',
    GET: (id) => `/api/v1/simulation/${id}`,
    SAVED_AIDES: '/api/v1/simulation/saved-aides',
    SAVE_AIDE: '/api/v1/simulation/save-aide',
    UNSAVE_AIDE: (aideId) => `/api/v1/simulation/saved-aides/${aideId}`,
    UPDATE_AIDE_STATUS: (aideId) => `/api/v1/simulation/saved-aides/${aideId}/status`,
  },

  // Procedures
  PROCEDURES: {
    LIST: '/api/v1/procedures',
    RECOMMENDED: '/api/v1/procedures/recommended',
    KNOWLEDGE: (category) => `/api/v1/procedures/knowledge/${category}`,
    GET: (id) => `/api/v1/procedures/${id}`,
    CREATE: '/api/v1/procedures',
    UPDATE: (id) => `/api/v1/procedures/${id}`,
    COMPLETE_STEP: (id) => `/api/v1/procedures/${id}/step`,
    UPLOAD_DOCUMENT: (id) => `/api/v1/procedures/${id}/document`,
    DELETE: (id) => `/api/v1/procedures/${id}`,
  },

  // Housing
  HOUSING: {
    PLATFORMS: '/api/v1/housing/platforms',
    PLATFORMS_BY_CATEGORY: (category) => `/api/v1/housing/platforms/${category}`,
    PLATFORM: (id) => `/api/v1/housing/platform/${id}`,
    SEARCH: '/api/v1/housing/search',
    RESOURCES: '/api/v1/housing/resources',
    GUARANTORS: '/api/v1/housing/guarantors',
    TIPS: '/api/v1/housing/tips',
    CATEGORIES: '/api/v1/housing/categories',
    PREFERENCES: '/api/v1/housing/preferences',
    SAVED: '/api/v1/housing/saved',
    SAVE: '/api/v1/housing/saved',
    UNSAVE: (platformId) => `/api/v1/housing/saved/${platformId}`,
  },
  
  // Chat
  CHAT: {
    SEND_MESSAGE: '/api/v1/ai/chat',
    GET_CONVERSATIONS: '/api/v1/ai/conversations',
    GET_CONVERSATION: (id) => `/api/v1/ai/conversations/${id}`,
    DELETE_CONVERSATION: (id) => `/api/v1/ai/conversations/${id}`,
  },
  
  // Stripe
  STRIPE: {
    CREATE_CHECKOUT: '/api/v1/stripe/create-checkout-session',
    CREATE_PORTAL: '/api/v1/stripe/create-portal-session',
    GET_SUBSCRIPTION: '/api/v1/stripe/subscription-status',
  },

  // Subscription Management
  SUBSCRIPTION: {
    TIERS: '/api/v1/subscription/tiers',
    STATUS: '/api/v1/subscription/status',
    USAGE: '/api/v1/subscription/usage',
    LIMITS: '/api/v1/subscription/limits',
    CHECK: (feature) => `/api/v1/subscription/check/${feature}`,
    RECOMMEND: '/api/v1/subscription/recommend',
    CHECKOUT: '/api/v1/subscription/checkout',
    PORTAL: '/api/v1/subscription/portal',
    CANCEL: '/api/v1/subscription/cancel',
    RESUME: '/api/v1/subscription/resume',
  },
  
  // Analytics
  ANALYTICS: {
    TRACK_EVENT: '/api/v1/analytics/event',
    TRACK_VIEW: '/api/v1/analytics/aide-view',
  },
  
  // Contact
  CONTACT: {
    SEND: '/api/v1/contact',
  },

  // Content (Public - Blog, Tutorials, Guides)
  CONTENT: {
    LIST: '/api/v1/content',
    FEATURED: '/api/v1/content/featured',
    BY_TYPE: (type) => `/api/v1/content/types/${type}`,
    BY_SLUG: (slug) => `/api/v1/content/slug/${slug}`,
    TRACK_VIEW: (id) => `/api/v1/content/${id}/view`,
    LIKE: (id) => `/api/v1/content/${id}/like`,
  },

  // Profile
  PROFILE: {
    GET: '/api/v1/profile',
    UPDATE: '/api/v1/profile',
    DELETE: '/api/v1/profile',
    STATS: '/api/v1/profile/stats',
    UPLOAD_AVATAR: '/api/v1/profile/avatar',
    DELETE_AVATAR: '/api/v1/profile/avatar',
    UPDATE_NOTIFICATIONS: '/api/v1/profile/notifications',
    CHANGE_PASSWORD: '/api/v1/profile/change-password',
    REQUEST_EXPORT: '/api/v1/profile/export',
    GET_EXPORT_STATUS: (exportId) => `/api/v1/profile/export/${exportId}`,
    GET_EXPORTS: '/api/v1/profile/exports',
    GET_SESSIONS: '/api/v1/profile/sessions',
    SIGN_OUT_ALL: '/api/v1/profile/sign-out-all',
  },

  // Affiliate
  AFFILIATE: {
    REGISTER: '/api/v1/affiliate/register',
    DASHBOARD: '/api/v1/affiliate/dashboard',
    REFERRALS: '/api/v1/affiliate/referrals',
    EARNINGS: '/api/v1/affiliate/earnings',
    LINK: '/api/v1/affiliate/link',
    REQUEST_PAYOUT: '/api/v1/affiliate/request-payout',
    PAYOUTS: '/api/v1/affiliate/payouts',
    SETTINGS: '/api/v1/affiliate/settings',
  },

  // Admin
  ADMIN: {
    // Dashboard & Analytics
    DASHBOARD: '/api/v1/admin/dashboard',
    ANALYTICS: '/api/v1/admin/analytics',
    ACTIVITY_LOGS: '/api/v1/admin/activity-logs',

    // Users
    USERS: '/api/v1/admin/users',
    USER: (id) => `/api/v1/admin/users/${id}`,
    USER_ACTIVITY: (id) => `/api/v1/admin/users/${id}/activity`,

    // Subscriptions
    SUBSCRIPTIONS: '/api/v1/admin/subscriptions',
    GRANT_SUBSCRIPTION: '/api/v1/admin/subscriptions/grant',
    REVOKE_SUBSCRIPTION: '/api/v1/admin/subscriptions/revoke',

    // Aides (legacy)
    AIDES: '/api/v1/admin/aides',
    AIDE: (id) => `/api/v1/admin/aides/${id}`,

    // Gov Aides
    GOV_AIDES: '/api/v1/admin/gov-aides',
    GOV_AIDE: (id) => `/api/v1/admin/gov-aides/${id}`,

    // Procedures
    PROCEDURES: '/api/v1/admin/procedures',
    PROCEDURE: (id) => `/api/v1/admin/procedures/${id}`,

    // Renting
    RENTING: '/api/v1/admin/renting',
    RENTING_PLATFORM: (id) => `/api/v1/admin/renting/${id}`,

    // Content (Blog & Tutorials)
    CONTENTS: '/api/v1/admin/contents',
    CONTENT: (id) => `/api/v1/admin/contents/${id}`,

    // Admins
    ADMINS: '/api/v1/admin/admins',
    ADMIN_USER: (id) => `/api/v1/admin/admins/${id}`,

    // Affiliates
    AFFILIATES: '/api/v1/admin/affiliates',
    AFFILIATE: (id) => `/api/v1/admin/affiliates/${id}`,
    AFFILIATE_STATS: (id) => `/api/v1/admin/affiliates/${id}/stats`,

    // Emails
    EMAIL_STATS: '/api/v1/admin/emails/stats',
    EMAIL_RECENT: '/api/v1/admin/emails/recent',
    EMAIL_TEMPLATES: '/api/v1/admin/emails/templates',
    EMAIL_TEMPLATE: (key) => `/api/v1/admin/emails/templates/${key}`,

    // Bulk Email
    BULK_EMAILS: '/api/v1/admin/bulk-emails',
    BULK_EMAIL_RECIPIENTS: '/api/v1/admin/bulk-emails/recipients',

    // Settings
    SETTINGS: '/api/v1/admin/settings',
    SETTING: (key) => `/api/v1/admin/settings/${key}`,

    // System
    LOGS: '/api/v1/admin/logs',
    CLEAR_CACHE: '/api/v1/admin/cache/clear',
    PLATFORM_UPDATE: '/api/v1/admin/notifications/platform-update',
  },
}

// Fetch wrapper with auth token
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`
  
  // Get auth token from Supabase session
  const { supabase } = await import('../lib/supabaseClient')
  const { data: { session } } = await supabase.auth.getSession()
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  // Add auth header if we have a session
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  })
  
  // Handle non-JSON responses
  const contentType = response.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response
  }
  
  const data = await response.json()
  
  if (!response.ok) {
    const error = new Error(data.message || 'API request failed')
    error.status = response.status
    error.data = data
    throw error
  }
  
  return data
}

// Convenience methods
export const api = {
  get: (endpoint, options = {}) => 
    apiFetch(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint, body, options = {}) => 
    apiFetch(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  
  put: (endpoint, body, options = {}) => 
    apiFetch(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  
  patch: (endpoint, body, options = {}) => 
    apiFetch(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  
  delete: (endpoint, options = {}) => 
    apiFetch(endpoint, { ...options, method: 'DELETE' }),

  // Upload method for FormData (doesn't set Content-Type header, browser handles it)
  upload: async (endpoint, formData, options = {}) => {
    const url = `${API_URL}${endpoint}`
    
    const { supabase } = await import('../lib/supabaseClient')
    const { data: { session } } = await supabase.auth.getSession()
    
    const headers = { ...options.headers }
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
    
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers,
      body: formData,
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      const error = new Error(data.message || 'Upload failed')
      error.status = response.status
      error.data = data
      throw error
    }
    
    return data
  },
}

export default api
