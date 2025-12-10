// Route definitions

export const ROUTES = {
  // Public
  HOME: '/',
  PRICING: '/pricing',
  BLOG: '/blog',
  BLOG_POST: '/blog/:slug',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  COOKIES: '/cookies',
  CONTACT: '/contact',
  
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  AUTH_CALLBACK: '/auth/callback',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Simulation (public start, auth for full results)
  SIMULATION: '/simulation',
  SIMULATION_RESULTS: '/simulation/results',
  
  // Protected (requires auth)
  DASHBOARD: '/dashboard',
  AIDES: '/dashboard/aides',
  AIDE_DETAIL: '/dashboard/aides/:id',
  SAVED_AIDES: '/dashboard/aides/saved',
  HOUSING: '/dashboard/housing',
  HOUSING_DETAIL: '/dashboard/housing/:id',
  PROCEDURES: '/dashboard/procedures',
  PROCEDURE_DETAIL: '/dashboard/procedures/:id',
  CHAT: '/dashboard/chat',
  CHAT_CONVERSATION: '/dashboard/chat/:conversationId',
  PROFILE: '/dashboard/profile',
  SETTINGS: '/dashboard/settings',
  
  // Premium
  CHECKOUT: '/checkout',
  CHECKOUT_SUCCESS: '/checkout/success',
  CHECKOUT_CANCEL: '/checkout/cancel',
}

// Helper to generate paths with params
export const generatePath = (route, params = {}) => {
  let path = route
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, value)
  })
  return path
}

// Public routes (no auth required)
export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.PRICING,
  ROUTES.BLOG,
  ROUTES.PRIVACY,
  ROUTES.TERMS,
  ROUTES.COOKIES,
  ROUTES.CONTACT,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.AUTH_CALLBACK,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.SIMULATION,
]

// Protected routes (auth required)
export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.AIDES,
  ROUTES.SAVED_AIDES,
  ROUTES.HOUSING,
  ROUTES.PROCEDURES,
  ROUTES.CHAT,
  ROUTES.PROFILE,
  ROUTES.SETTINGS,
  ROUTES.CHECKOUT,
]

// Dashboard navigation items
export const DASHBOARD_NAV = [
  {
    key: 'home',
    labelKey: 'nav.home',
    icon: 'ri-home-4-line',
    path: ROUTES.DASHBOARD,
  },
  {
    key: 'aides',
    labelKey: 'nav.aides',
    icon: 'ri-hand-heart-line',
    path: ROUTES.AIDES,
  },
  {
    key: 'housing',
    labelKey: 'nav.housing',
    icon: 'ri-home-2-line',
    path: ROUTES.HOUSING,
  },
  {
    key: 'procedures',
    labelKey: 'nav.procedures',
    icon: 'ri-file-list-3-line',
    path: ROUTES.PROCEDURES,
  },
  {
    key: 'chat',
    labelKey: 'nav.chat',
    icon: 'ri-chat-1-line',
    path: ROUTES.CHAT,
    premium: true,
  },
]

export const DASHBOARD_NAV_BOTTOM = [
  {
    key: 'premium',
    labelKey: 'nav.premium',
    icon: 'ri-vip-crown-line',
    path: ROUTES.PRICING,
    highlight: true,
  },
  {
    key: 'settings',
    labelKey: 'nav.settings',
    icon: 'ri-settings-3-line',
    path: ROUTES.SETTINGS,
  },
]
