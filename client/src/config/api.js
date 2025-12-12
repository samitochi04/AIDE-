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
    CREATE_CHECKOUT: '/api/v1/stripe/checkout',
    CREATE_PORTAL: '/api/v1/stripe/portal',
    GET_SUBSCRIPTION: '/api/v1/stripe/subscription',
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
}

export default api
