# AIDE+ Frontend (Client) Documentation

## Overview

AIDE+ is a web application helping foreigners in France discover and access government aids (aides), understand administrative procedures, and find housing. The frontend is built with **React 19 + Vite**, inspired by Squarespace's clean, modern design aesthetic.

**Design Philosophy:**
- Clean, minimalist UI with generous whitespace
- Smooth animations and micro-interactions
- Mobile-first responsive design (primary users are students on phones)
- Accessibility-focused (WCAG 2.1 AA)
- Performance-optimized (Core Web Vitals)

---

## File Structure

```
client/
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   ├── sitemap.xml
│   └── locales/
│       ├── fr/
│       │   └── translation.json
│       └── en/
│           └── translation.json
├── src/
│   ├── main.jsx                      # App entry point
│   ├── App.jsx                       # Root component with router
│   │
│   ├── assets/
│   │   ├── icons/                    # Custom SVG icons
│   │   ├── images/                   # Static images
│   │   └── fonts/                    # Custom fonts (if any)
│   │
│   ├── styles/
│   │   ├── index.css                 # Global styles & CSS variables
│   │   ├── reset.css                 # CSS reset/normalize
│   │   ├── typography.css            # Font styles
│   │   ├── animations.css            # Reusable animations
│   │   └── utilities.css             # Utility classes
│   │
│   ├── config/
│   │   ├── constants.js              # App constants
│   │   ├── routes.js                 # Route definitions
│   │   └── api.js                    # API endpoints config
│   │
│   ├── lib/
│   │   ├── supabaseClient.js         # Supabase client instance
│   │   └── apiClient.js              # Axios/fetch wrapper for backend API
│   │
│   ├── hooks/
│   │   ├── useAuth.js                # Authentication hook
│   │   ├── useUser.js                # User profile hook
│   │   ├── useTheme.js               # Dark/light mode hook
│   │   ├── useLanguage.js            # i18n language hook
│   │   ├── useMediaQuery.js          # Responsive breakpoints
│   │   ├── useLocalStorage.js        # LocalStorage wrapper
│   │   ├── useDebounce.js            # Debounce hook
│   │   └── useIntersectionObserver.js # Scroll animations
│   │
│   ├── context/
│   │   ├── AuthContext.jsx           # Auth state provider
│   │   ├── ThemeContext.jsx          # Theme provider
│   │   ├── LanguageContext.jsx       # i18n provider
│   │   ├── SimulationContext.jsx     # Simulation state (guest & logged in)
│   │   └── ToastContext.jsx          # Toast notifications
│   │
│   ├── components/
│   │   ├── ui/                       # Base UI components (design system)
│   │   │   ├── Button/
│   │   │   │   ├── Button.jsx
│   │   │   │   └── Button.module.css
│   │   │   ├── Input/
│   │   │   ├── Card/
│   │   │   ├── Modal/
│   │   │   ├── Dropdown/
│   │   │   ├── Badge/
│   │   │   ├── Avatar/
│   │   │   ├── Tooltip/
│   │   │   ├── Skeleton/
│   │   │   ├── Spinner/
│   │   │   ├── Toast/
│   │   │   ├── Toggle/
│   │   │   ├── Tabs/
│   │   │   ├── Accordion/
│   │   │   ├── ProgressBar/
│   │   │   └── index.js              # Barrel export
│   │   │
│   │   ├── layout/                   # Layout components
│   │   │   ├── Navbar/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Navbar.module.css
│   │   │   │   └── NavLinks.jsx
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Sidebar.module.css
│   │   │   │   └── SidebarItem.jsx
│   │   │   ├── Footer/
│   │   │   ├── Container/
│   │   │   ├── Section/
│   │   │   └── DashboardLayout/
│   │   │
│   │   ├── common/                   # Shared components
│   │   │   ├── Logo/
│   │   │   ├── LanguageSelector/
│   │   │   ├── ThemeToggle/
│   │   │   ├── SearchBar/
│   │   │   ├── Pagination/
│   │   │   ├── EmptyState/
│   │   │   ├── ErrorBoundary/
│   │   │   ├── LoadingScreen/
│   │   │   ├── SEO/                  # Meta tags, Open Graph
│   │   │   └── ProtectedRoute/
│   │   │
│   │   └── forms/                    # Form components
│   │       ├── AuthForm/
│   │       ├── ProfileForm/
│   │       ├── SimulationForm/
│   │       └── ContactForm/
│   │
│   ├── features/                     # Feature modules
│   │   ├── landing/
│   │   │   ├── components/
│   │   │   │   ├── Hero/
│   │   │   │   ├── Stats/
│   │   │   │   ├── Features/
│   │   │   │   ├── HowItWorks/
│   │   │   │   ├── Testimonials/
│   │   │   │   ├── Pricing/
│   │   │   │   ├── FAQ/
│   │   │   │   ├── CTA/
│   │   │   │   └── ContactSection/
│   │   │   ├── LandingPage.jsx
│   │   │   └── LandingPage.module.css
│   │   │
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm/
│   │   │   │   ├── RegisterForm/
│   │   │   │   ├── ForgotPassword/
│   │   │   │   └── OAuthButtons/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── AuthCallback.jsx      # Handle OAuth/magic link redirects
│   │   │
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── WelcomeCard/
│   │   │   │   ├── QuickActions/
│   │   │   │   ├── RecentAides/
│   │   │   │   ├── SimulationSummary/
│   │   │   │   └── PremiumBanner/
│   │   │   ├── DashboardPage.jsx
│   │   │   └── DashboardPage.module.css
│   │   │
│   │   ├── aides/
│   │   │   ├── components/
│   │   │   │   ├── AideCard/
│   │   │   │   ├── AideList/
│   │   │   │   ├── AideFilters/
│   │   │   │   ├── AideDetail/
│   │   │   │   ├── EligibilityBadge/
│   │   │   │   └── SaveAideButton/
│   │   │   ├── hooks/
│   │   │   │   └── useAides.js
│   │   │   ├── AidesPage.jsx
│   │   │   ├── AideDetailPage.jsx
│   │   │   └── SavedAidesPage.jsx
│   │   │
│   │   ├── simulation/
│   │   │   ├── components/
│   │   │   │   ├── SimulationWizard/
│   │   │   │   ├── StepIndicator/
│   │   │   │   ├── QuestionCard/
│   │   │   │   ├── ResultsPreview/
│   │   │   │   ├── ResultsComplete/
│   │   │   │   └── RegisterPrompt/
│   │   │   ├── hooks/
│   │   │   │   └── useSimulation.js
│   │   │   ├── SimulationPage.jsx
│   │   │   └── ResultsPage.jsx
│   │   │
│   │   ├── housing/
│   │   │   ├── components/
│   │   │   │   ├── PlatformCard/
│   │   │   │   ├── PlatformList/
│   │   │   │   ├── HousingFilters/
│   │   │   │   └── HousingTips/
│   │   │   ├── hooks/
│   │   │   │   └── useHousing.js
│   │   │   ├── HousingPage.jsx
│   │   │   └── HousingDetailPage.jsx
│   │   │
│   │   ├── procedures/
│   │   │   ├── components/
│   │   │   │   ├── ProcedureCard/
│   │   │   │   ├── ProcedureSteps/
│   │   │   │   ├── DocumentChecklist/
│   │   │   │   └── ProcedureTimeline/
│   │   │   ├── hooks/
│   │   │   │   └── useProcedures.js
│   │   │   ├── ProceduresPage.jsx
│   │   │   └── ProcedureDetailPage.jsx
│   │   │
│   │   ├── chat/
│   │   │   ├── components/
│   │   │   │   ├── ChatWindow/
│   │   │   │   ├── MessageBubble/
│   │   │   │   ├── ChatInput/
│   │   │   │   ├── ConversationList/
│   │   │   │   ├── TypingIndicator/
│   │   │   │   └── PremiumLimit/
│   │   │   ├── hooks/
│   │   │   │   └── useChat.js
│   │   │   └── ChatPage.jsx
│   │   │
│   │   ├── premium/
│   │   │   ├── components/
│   │   │   │   ├── PricingCard/
│   │   │   │   ├── FeatureComparison/
│   │   │   │   ├── PaymentForm/
│   │   │   │   └── SubscriptionStatus/
│   │   │   ├── hooks/
│   │   │   │   └── useSubscription.js
│   │   │   ├── PricingPage.jsx
│   │   │   └── CheckoutPage.jsx
│   │   │
│   │   ├── profile/
│   │   │   ├── components/
│   │   │   │   ├── ProfileHeader/
│   │   │   │   ├── ProfileForm/
│   │   │   │   ├── NotificationSettings/
│   │   │   │   └── AccountDeletion/
│   │   │   ├── ProfilePage.jsx
│   │   │   └── SettingsPage.jsx
│   │   │
│   │   ├── blog/
│   │   │   ├── components/
│   │   │   │   ├── BlogCard/
│   │   │   │   ├── BlogList/
│   │   │   │   ├── BlogAuthor/
│   │   │   │   ├── BlogShare/
│   │   │   │   └── RelatedPosts/
│   │   │   ├── hooks/
│   │   │   │   └── useBlog.js
│   │   │   ├── BlogPage.jsx
│   │   │   └── BlogPostPage.jsx
│   │   │
│   │   └── legal/
│   │       ├── PrivacyPage.jsx
│   │       ├── TermsPage.jsx
│   │       └── CookiePage.jsx
│   │
│   ├── pages/                        # Page components (route entries)
│   │   ├── NotFoundPage.jsx
│   │   └── ErrorPage.jsx
│   │
│   ├── services/                     # API service layer
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── aidesService.js
│   │   ├── simulationService.js
│   │   ├── housingService.js
│   │   ├── procedureService.js
│   │   ├── chatService.js
│   │   ├── subscriptionService.js
│   │   ├── blogService.js
│   │   └── analyticsService.js
│   │
│   └── utils/
│       ├── formatters.js             # Date, currency, number formatters
│       ├── validators.js             # Form validation helpers
│       ├── storage.js                # LocalStorage helpers
│       ├── analytics.js              # Event tracking
│       ├── seo.js                    # SEO helpers
│       └── translations.js           # i18n helpers
│
├── .env
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js (optional)
└── notes.md
```

---

## Features Logic

### 1. Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Landing Page                                               │
│       │                                                     │
│       ├──► "Commencer" ──► Simulation (Guest Mode)          │
│       │         │                                           │
│       │         ▼                                           │
│       │    Partial Results ──► Register Prompt              │
│       │                              │                      │
│       │                              ▼                      │
│       └──► "Se connecter" ──► Auth Modal                    │
│                 │                                           │
│                 ├── Magic Link (Email OTP)                  │
│                 ├── Google OAuth                            │
│                 └── Email/Password                          │
│                              │                              │
│                              ▼                              │
│                    Auth Callback Page                       │
│                              │                              │
│                              ▼                              │
│                       Dashboard                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Frontend → Supabase Direct:**
- Sign up/in with email
- OAuth (Google, GitHub)
- Password reset
- Session management

**Frontend → Backend API:**
- Send welcome email
- Custom verification emails
- Account deletion (GDPR)

---

### 2. Simulation Flow (Key Feature)

```
┌─────────────────────────────────────────────────────────────┐
│                    SIMULATION FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  GUEST MODE (Not logged in):                                │
│  ─────────────────────────────                              │
│  1. User clicks "Commencer" on landing                      │
│  2. Simulation wizard starts                                │
│  3. Questions: Age, Nationality, Status, Income, etc.       │
│  4. Results calculated locally + API                        │
│  5. Show PARTIAL results (3-5 aides, blurred rest)          │
│  6. Register prompt: "Create account to see all X aides"    │
│  7. On register: Save simulation to profile                 │
│                                                             │
│  LOGGED IN MODE:                                            │
│  ─────────────────                                          │
│  1. Full simulation wizard                                  │
│  2. Results saved to user profile                           │
│  3. Show ALL eligible aides                                 │
│  4. Personalized recommendations                            │
│  5. Save favorite aides                                     │
│                                                             │
│  Data Flow:                                                 │
│  ──────────                                                 │
│  - Guest: localStorage + SimulationContext                  │
│  - Logged in: Supabase + user_simulations table             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Premium Tiers & Feature Gates

```
┌─────────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION TIERS                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FREE TIER:                                                 │
│  ──────────                                                 │
│  ✓ Basic simulation (limited results)                       │
│  ✓ View 5 aides per day                                     │
│  ✓ Basic procedure info                                     │
│  ✓ Limited housing listings                                 │
│  ✓ 3 AI chat messages/day                                   │
│  ✗ Save favorites (limited to 3)                            │
│  ✗ Full eligibility details                                 │
│  ✗ Document checklists                                      │
│                                                             │
│  BASIC (€4.99/mo):                                          │
│  ─────────────────                                          │
│  ✓ Full simulation results                                  │
│  ✓ Unlimited aide views                                     │
│  ✓ Full procedure guides                                    │
│  ✓ All housing listings                                     │
│  ✓ 20 AI chat messages/day                                  │
│  ✓ Save unlimited favorites                                 │
│  ✓ Email notifications                                      │
│                                                             │
│  PLUS (€9.99/mo):                                           │
│  ─────────────────                                          │
│  ✓ Everything in Basic                                      │
│  ✓ Unlimited AI chat                                        │
│  ✓ Document templates                                       │
│  ✓ Priority support                                         │
│  ✓ Personalized aide alerts                                 │
│                                                             │
│  PREMIUM (€14.99/mo):                                       │
│  ─────────────────────                                      │
│  ✓ Everything in Plus                                       │
│  ✓ 1-on-1 consultation (1/month)                           │
│  ✓ Application assistance                                   │
│  ✓ Document review                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Implementation:**
```javascript
// useSubscription hook
const { tier, canAccess, showUpgrade } = useSubscription()

// Feature gate component
<FeatureGate feature="unlimited_chat" fallback={<UpgradePrompt />}>
  <ChatInput />
</FeatureGate>
```

---

### 4. Internationalization (i18n)

```
┌─────────────────────────────────────────────────────────────┐
│                    LANGUAGE HANDLING                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STATIC CONTENT (UI):                                       │
│  ────────────────────                                       │
│  - Use react-i18next                                        │
│  - Translation files in public/locales/                     │
│  - Auto-detect from browser (navigator.language)            │
│  - User can override in settings                            │
│  - Store preference: localStorage + user_profiles           │
│                                                             │
│  DYNAMIC CONTENT (Database):                                │
│  ──────────────────────────                                 │
│  - Aides, Procedures, Housing have both FR & EN fields:     │
│                                                             │
│    aides table:                                             │
│    ├── name_fr: "Allocation de rentrée scolaire"           │
│    ├── name_en: "Back-to-school allowance"                 │
│    ├── description_fr: "..."                               │
│    └── description_en: "..."                               │
│                                                             │
│  - Query based on user's language preference:               │
│    SELECT name_${lang}, description_${lang} FROM aides      │
│                                                             │
│  - OR use a translation service (fallback):                 │
│    - DeepL API for on-demand translation                    │
│    - Cache translations in Redis/localStorage               │
│                                                             │
│  RECOMMENDATION:                                            │
│  ───────────────                                            │
│  Store content in both languages in DB (best UX/SEO)        │
│  Admin can manage translations in CMS                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 5. Theme System (Dark/Light)

```javascript
// ThemeContext.jsx
const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Priority: localStorage > system preference > 'light'
    const stored = localStorage.getItem('theme')
    if (stored) return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

---

### 6. SEO Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    SEO IMPLEMENTATION                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FILES:                                                     │
│  ──────                                                     │
│  public/robots.txt:                                         │
│    User-agent: *                                            │
│    Allow: /                                                 │
│    Disallow: /dashboard                                     │
│    Disallow: /profile                                       │
│    Disallow: /checkout                                      │
│    Sitemap: https://aideplus.fr/sitemap.xml                │
│                                                             │
│  public/sitemap.xml:                                        │
│    - Static pages (landing, pricing, blog, legal)           │
│    - Dynamic pages generated at build or via API            │
│    - Blog posts with lastmod dates                          │
│                                                             │
│  META TAGS (per page):                                      │
│  ─────────────────────                                      │
│  <SEO                                                       │
│    title="Aides en France | AIDE+"                         │
│    description="Découvrez les aides..."                    │
│    canonical="https://aideplus.fr/aides"                   │
│    ogImage="/og-image.png"                                 │
│  />                                                         │
│                                                             │
│  STRUCTURED DATA:                                           │
│  ────────────────                                           │
│  - Organization schema                                      │
│  - FAQ schema on landing                                    │
│  - Article schema on blog posts                             │
│  - BreadcrumbList                                           │
│                                                             │
│  PERFORMANCE:                                               │
│  ────────────                                               │
│  - Code splitting per route                                 │
│  - Image optimization (webp, lazy loading)                  │
│  - Preload critical assets                                  │
│  - SSG/SSR for blog pages (consider Next.js if needed)      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 7. API Integration Patterns

```javascript
// Frontend → Supabase (Direct)
// ─────────────────────────────
import { supabase } from '@/lib/supabaseClient'

// Auth
await supabase.auth.signInWithOtp({ email })
await supabase.auth.signInWithOAuth({ provider: 'google' })

// Read public data
const { data } = await supabase
  .from('aides')
  .select('*')
  .eq('is_active', true)

// Read own profile (RLS enforced)
const { data } = await supabase
  .from('user_profiles')
  .select('*')
  .single()


// Frontend → Backend API (Secure)
// ────────────────────────────────
import { apiClient } from '@/lib/apiClient'

// AI Chat (requires auth + rate limiting)
const { data } = await apiClient.post('/api/chat/message', {
  message: 'What aids am I eligible for?',
  conversationId: '...'
})

// Create checkout session (Stripe secret key)
const { data } = await apiClient.post('/api/stripe/checkout', {
  tier: 'plus',
  successUrl: '/dashboard?success=true'
})
```

---

### 8. State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    STATE ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  GLOBAL STATE (Context):                                    │
│  ───────────────────────                                    │
│  - AuthContext: user, session, login/logout                 │
│  - ThemeContext: theme, toggle                              │
│  - LanguageContext: locale, setLocale                       │
│  - ToastContext: notifications queue                        │
│                                                             │
│  FEATURE STATE (Local + Hooks):                             │
│  ──────────────────────────────                             │
│  - useAides: fetch, filter, paginate aides                  │
│  - useSimulation: wizard state, results                     │
│  - useChat: messages, send, conversations                   │
│                                                             │
│  SERVER STATE (React Query optional):                       │
│  ─────────────────────────────────────                      │
│  - Cache API responses                                      │
│  - Auto-refetch on focus                                    │
│  - Optimistic updates                                       │
│                                                             │
│  FORM STATE:                                                │
│  ───────────                                                │
│  - React Hook Form for complex forms                        │
│  - Controlled inputs for simple forms                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Design System

### Colors

```css
:root {
  /* Primary */
  --color-primary: #0A6CFF;           /* AIDE blue */
  --color-primary-dark: #0554CC;
  --color-primary-light: #E6F0FF;
  
  /* Accent */
  --color-accent: #FF375F;            /* + red */
  --color-accent-dark: #E6294D;
  --color-accent-light: #FFEEF1;
  
  /* Neutrals */
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-300: #D1D5DB;
  --color-gray-400: #9CA3AF;
  --color-gray-500: #6B7280;
  --color-gray-600: #4B5563;
  --color-gray-700: #374151;
  --color-gray-800: #1F2937;
  --color-gray-900: #111827;
  
  /* Semantic */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  
  /* Backgrounds */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F9FAFB;
  --bg-tertiary: #F3F4F6;
}

[data-theme="dark"] {
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --bg-tertiary: #334155;
  --color-gray-50: #1E293B;
  /* ... inverted scale */
}
```

### Typography

```css
:root {
  /* Font Family */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-display: 'Plus Jakarta Sans', var(--font-sans);
  
  /* Font Sizes */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
  --text-5xl: 3rem;        /* 48px */
  --text-6xl: 3.75rem;     /* 60px */
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Spacing

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

### Breakpoints

```css
/* Mobile first */
--bp-sm: 640px;   /* Small tablets */
--bp-md: 768px;   /* Tablets */
--bp-lg: 1024px;  /* Laptops */
--bp-xl: 1280px;  /* Desktops */
--bp-2xl: 1536px; /* Large screens */
```

### Shadows

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}
```

### Animations

```css
:root {
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateY(10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes scaleIn {
  from { 
    opacity: 0; 
    transform: scale(0.95); 
  }
  to { 
    opacity: 1; 
    transform: scale(1); 
  }
}
```

---

## Page Routes

```javascript
// config/routes.js
export const ROUTES = {
  // Public
  HOME: '/',
  PRICING: '/pricing',
  BLOG: '/blog',
  BLOG_POST: '/blog/:slug',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  COOKIES: '/cookies',
  
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  AUTH_CALLBACK: '/auth/callback',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Simulation (public start, auth for full)
  SIMULATION: '/simulation',
  SIMULATION_RESULTS: '/simulation/results',
  
  // Protected (requires auth)
  DASHBOARD: '/dashboard',
  AIDES: '/dashboard/aides',
  AIDE_DETAIL: '/dashboard/aides/:id',
  HOUSING: '/dashboard/housing',
  HOUSING_DETAIL: '/dashboard/housing/:id',
  PROCEDURES: '/dashboard/procedures',
  PROCEDURE_DETAIL: '/dashboard/procedures/:id',
  CHAT: '/dashboard/chat',
  PROFILE: '/dashboard/profile',
  SETTINGS: '/dashboard/settings',
  
  // Premium
  CHECKOUT: '/checkout',
  CHECKOUT_SUCCESS: '/checkout/success',
  CHECKOUT_CANCEL: '/checkout/cancel',
}
```

---

## Database Content Translation Strategy

**Recommended Approach:** Store bilingual content in database

```sql
-- Add language columns to existing tables
ALTER TABLE aides ADD COLUMN name_en TEXT;
ALTER TABLE aides ADD COLUMN description_en TEXT;
ALTER TABLE aides ADD COLUMN eligibility_en JSONB;

-- Query based on language
SELECT 
  id,
  CASE WHEN $1 = 'en' THEN name_en ELSE name_fr END as name,
  CASE WHEN $1 = 'en' THEN description_en ELSE description_fr END as description
FROM aides
WHERE is_active = true;
```

**Alternative: On-demand Translation**
```javascript
// For missing translations, use DeepL API
async function getTranslatedContent(text, targetLang) {
  // Check cache first
  const cached = await redis.get(`translation:${hash(text)}:${targetLang}`)
  if (cached) return cached
  
  // Call DeepL API
  const translated = await deepl.translate(text, targetLang)
  
  // Cache result
  await redis.set(`translation:${hash(text)}:${targetLang}`, translated)
  
  return translated
}
```

---

## Mobile-First Components

All components are designed mobile-first with these principles:

1. **Touch-friendly**: Minimum tap targets of 44x44px
2. **Swipeable**: Use gestures where appropriate (carousel, drawer)
3. **Bottom navigation**: Dashboard uses bottom nav on mobile
4. **Reduced motion**: Respect `prefers-reduced-motion`
5. **Offline support**: Cache critical data with service worker

---

## Performance Optimizations

1. **Code Splitting**: Each route lazy-loaded
2. **Image Optimization**: WebP with fallbacks, lazy loading
3. **Font Loading**: `font-display: swap`, preload critical fonts
4. **Bundle Size**: Tree-shaking, no unused dependencies
5. **Caching**: Service worker for static assets
6. **API**: Request deduplication, SWR pattern

---

## Security Considerations

1. **XSS Prevention**: Sanitize user input, CSP headers
2. **CSRF**: Supabase handles with tokens
3. **Auth Tokens**: HttpOnly cookies preferred
4. **API Keys**: Only anon key exposed, sensitive via backend
5. **Input Validation**: Client + server-side validation

---

## Development Workflow

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Backend API
VITE_API_URL=http://localhost:5000

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CHAT=true

# Stripe (publishable key only)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```
