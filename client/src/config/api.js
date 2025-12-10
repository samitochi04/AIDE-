// API configuration and client

import { API_URL } from './constants'

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    SEND_MAGIC_LINK: '/api/auth/send-magic-link',
    SEND_WELCOME_EMAIL: '/api/auth/send-welcome-email',
    SEND_PASSWORD_RESET: '/api/auth/send-password-reset',
    RESEND_VERIFICATION: '/api/auth/resend-verification',
  },
  
  // Chat
  CHAT: {
    SEND_MESSAGE: '/api/chat/message',
    GET_CONVERSATIONS: '/api/chat/conversations',
    GET_CONVERSATION: (id) => `/api/chat/conversations/${id}`,
    DELETE_CONVERSATION: (id) => `/api/chat/conversations/${id}`,
  },
  
  // Stripe
  STRIPE: {
    CREATE_CHECKOUT: '/api/stripe/checkout',
    CREATE_PORTAL: '/api/stripe/portal',
    GET_SUBSCRIPTION: '/api/stripe/subscription',
  },
  
  // Analytics
  ANALYTICS: {
    TRACK_EVENT: '/api/analytics/event',
    TRACK_VIEW: '/api/analytics/aide-view',
  },
  
  // Contact
  CONTACT: {
    SEND: '/api/contact',
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
