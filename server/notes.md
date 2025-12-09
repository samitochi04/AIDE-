# AIDE+ Backend (Server) Documentation

## Overview
This document outlines the backend architecture for AIDE+. Since we use Supabase, many operations can be done directly from the frontend for speed, while sensitive operations must go through the backend.

---

## Frontend vs Backend Responsibilities

### ✅ Direct Frontend → Supabase (Fast Path)

These operations can be done directly from the frontend using Supabase client:

#### Authentication
| Operation | Method | Notes |
|-----------|--------|-------|
| Sign up (email/password) | `supabase.auth.signUp()` | Triggers `handle_new_user()` in DB |
| Sign in | `supabase.auth.signInWithPassword()` | |
| Sign in with OAuth | `supabase.auth.signInWithOAuth()` | Google, GitHub, etc. |
| Sign out | `supabase.auth.signOut()` | |
| Reset password request | `supabase.auth.resetPasswordForEmail()` | |
| Update password | `supabase.auth.updateUser()` | |
| Get session | `supabase.auth.getSession()` | |
| Refresh session | `supabase.auth.refreshSession()` | Auto-handled |

#### User Profile (Read/Update Own)
| Operation | Method | Notes |
|-----------|--------|-------|
| Get own profile | `supabase.from('profiles').select()` | RLS enforced |
| Update own profile | `supabase.from('profiles').update()` | RLS enforced |
| Get own favorites | `supabase.from('user_favorites').select()` | |
| Add/remove favorites | `supabase.from('user_favorites').insert/delete()` | |
| Get own notifications | `supabase.from('notifications').select()` | |
| Mark notification read | `supabase.from('notifications').update()` | |

#### Knowledge Base (Public Read)
| Operation | Method | Notes |
|-----------|--------|-------|
| Get gov_aides | `supabase.from('gov_aides').select()` | Public, filterable |
| Get procedures | `supabase.from('procedures').select()` | Public, filterable |
| Get renting | `supabase.from('renting').select()` | Public, filterable |
| Full-text search | `supabase.rpc('fulltext_search_knowledge')` | Uses DB function |

#### Content (Public Read)
| Operation | Method | Notes |
|-----------|--------|-------|
| Get published content | `supabase.from('contents').select()` | `is_published = true` |
| Get content by tags | Filter with `.contains('tags', ['tag'])` | |
| Like content | `supabase.from('content_likes').insert()` | RLS checks user |
| Unlike content | `supabase.from('content_likes').delete()` | RLS checks user |

#### Subscription Info (Read Own)
| Operation | Method | Notes |
|-----------|--------|-------|
| Get own subscription | `supabase.from('stripe_subscriptions').select()` | |
| Get subscription products | `supabase.from('stripe_products').select()` | Public |
| Get own invoices | `supabase.from('stripe_invoices').select()` | |

#### Chat (Own Conversations)
| Operation | Method | Notes |
|-----------|--------|-------|
| Get own conversations | `supabase.from('chat_conversations').select()` | |
| Get messages in conversation | `supabase.from('chat_messages').select()` | |
| Create conversation | `supabase.from('chat_conversations').insert()` | |
| Check rate limit | `supabase.rpc('can_send_chat_message')` | Before sending |

---

### 🔒 Backend API Required (Secure Path)

These operations MUST go through the backend for security:

#### Authentication Hooks
| Operation | Endpoint | Why Backend? |
|-----------|----------|--------------|
| Send welcome email | Webhook/Trigger | Email service credentials |
| Send password reset email | POST `/auth/send-reset` | Custom email templates |
| Send verification email | POST `/auth/send-verification` | Email service credentials |
| Verify email token | POST `/auth/verify-email` | Token validation |

#### AI Chat
| Operation | Endpoint | Why Backend? |
|-----------|----------|--------------|
| Send message to AI | POST `/chat/message` | OpenAI API key, RAG logic, rate limiting |
| Generate embeddings | Internal | OpenAI API key |
| Semantic search | POST `/chat/search` | Embedding generation required |

#### Stripe Payments
| Operation | Endpoint | Why Backend? |
|-----------|----------|--------------|
| Create checkout session | POST `/stripe/checkout` | Stripe secret key |
| Handle webhooks | POST `/stripe/webhook` | Webhook signature verification |
| Create customer portal | POST `/stripe/portal` | Stripe secret key |
| Cancel subscription | POST `/stripe/cancel` | Stripe secret key |
| Apply promo code | POST `/stripe/apply-promo` | Validation + Stripe |

#### Affiliate System
| Operation | Endpoint | Why Backend? |
|-----------|----------|--------------|
| Request affiliate status | POST `/affiliate/request` | Admin approval workflow |
| Process payout | POST `/affiliate/payout` | Stripe Connect / PayPal |
| Generate affiliate report | GET `/affiliate/report` | Complex calculations |

#### Admin Operations
| Operation | Endpoint | Why Backend? |
|-----------|----------|--------------|
| Create admin | POST `/admin/create` | Super admin only |
| Upload content | POST `/admin/content` | File upload + processing |
| Import knowledge base | POST `/admin/import` | Embedding generation |
| Get analytics | GET `/admin/analytics` | Complex queries |
| Send bulk emails | POST `/admin/email/bulk` | Email service |

#### Analytics & Tracking
| Operation | Endpoint | Why Backend? |
|-----------|----------|--------------|
| Track anonymous visitor | POST `/track/visitor` | Fingerprinting, IP lookup |
| Record view | POST `/track/view` | Service role access |
| Get conversion funnel | GET `/admin/analytics/funnel` | Admin only |

#### Email System
| Operation | Endpoint | Why Backend? |
|-----------|----------|--------------|
| Send transactional email | Internal service | Email credentials |
| Send marketing email | POST `/admin/email/send` | Admin only |
| Track email opens/clicks | GET `/email/track/:id` | Pixel tracking |

---

## Backend Architecture (MVC + Repository Pattern)

```
server/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── index.js           # Main config aggregator
│   │   ├── supabase.js        # Supabase client setup
│   │   ├── stripe.js          # Stripe configuration
│   │   ├── openai.js          # OpenAI configuration
│   │   └── email.js           # Email service config (Resend)
│   │
│   ├── middlewares/           # Express middlewares
│   │   ├── index.js           # Middleware exports
│   │   ├── auth.js            # JWT verification, user extraction
│   │   ├── admin.js           # Admin role verification
│   │   ├── rateLimiter.js     # Rate limiting by tier
│   │   ├── validate.js        # Request validation (Joi)
│   │   ├── errorHandler.js    # Global error handler
│   │   └── notFoundHandler.js # 404 handler
│   │
│   ├── models/                # Data models/types (Joi validation schemas)
│   │   ├── index.js           # Model exports
│   │   ├── user.model.js      # User profile, preferences schemas
│   │   ├── chat.model.js      # Chat message, conversation schemas
│   │   ├── subscription.model.js # Checkout, promo code schemas
│   │   ├── content.model.js   # Gov aide, procedure, renting, blog schemas
│   │   ├── affiliate.model.js # Affiliate request, payout schemas
│   │   └── analytics.model.js # Event, search tracking schemas
│   │
│   ├── repositories/          # Data access layer (Supabase queries)
│   │   ├── index.js           # Repository exports
│   │   ├── base.repository.js # Base repository class (CRUD)
│   │   ├── user.repository.js # User profile, admin queries
│   │   ├── chat.repository.js # Conversation, message repositories
│   │   ├── subscription.repository.js # Stripe subscription data
│   │   ├── content.repository.js # Aide, procedure, renting, blog repos
│   │   ├── affiliate.repository.js # Affiliate, clicks, transactions repos
│   │   ├── analytics.repository.js # Events, sessions, views, search repos
│   │   └── knowledgeBase.repository.js # RAG knowledge base queries
│   │
│   ├── services/              # Business logic layer
│   │   ├── index.js           # Service exports
│   │   ├── email.service.js   # Email sending (Resend)
│   │   ├── ai.service.js      # OpenAI chat + RAG logic
│   │   ├── stripe.service.js  # Stripe operations
│   │   ├── admin.service.js   # Admin operations
│   │   ├── analytics.service.js # Analytics tracking
│   │   └── affiliate.service.js # Affiliate program logic
│   │
│   ├── controllers/           # HTTP request handlers
│   │   ├── index.js           # Controller exports
│   │   ├── auth.controller.js # Auth webhook handlers
│   │   ├── ai.controller.js   # AI chat endpoints
│   │   ├── stripe.controller.js # Stripe endpoints
│   │   ├── admin.controller.js # Admin endpoints
│   │   ├── analytics.controller.js # Analytics endpoints
│   │   ├── affiliate.controller.js # Affiliate endpoints
│   │   └── contact.controller.js # Contact form endpoint
│   │
│   ├── routes/                # Route definitions
│   │   ├── index.js           # Route aggregator
│   │   ├── health.routes.js   # Health check endpoint
│   │   ├── auth.routes.js     # Auth routes
│   │   ├── ai.routes.js       # AI chat routes
│   │   ├── stripe.routes.js   # Stripe routes
│   │   ├── admin.routes.js    # Admin routes
│   │   ├── analytics.routes.js # Analytics routes
│   │   ├── affiliate.routes.js # Affiliate routes
│   │   └── contact.routes.js  # Contact form route
│   │
│   ├── utils/                 # Utility functions
│   │   ├── logger.js          # Logging utility (Winston)
│   │   ├── errors.js          # Custom error classes
│   │   ├── helpers.js         # General helpers
│   │   └── constants.js       # App constants
│   │
│   └── app.js                 # Express app setup
│
├── .env.example               # Environment variables template
├── .env                       # Actual env (gitignored)
├── package.json
├── index.js                   # Entry point
└── notes.md                   # This file
```

---

## API Endpoints Reference

### Authentication (`/api/auth`)
```
POST   /api/auth/send-welcome          # Send welcome email (webhook)
POST   /api/auth/send-reset            # Send password reset email
POST   /api/auth/send-verification     # Send email verification
POST   /api/auth/verify-email          # Verify email token
```

### Chat (`/api/chat`)
```
POST   /api/chat/message               # Send message to AI
POST   /api/chat/search                # Semantic search (RAG)
GET    /api/chat/usage                 # Get current usage stats
POST   /api/chat/feedback              # Submit message feedback
```

### Stripe (`/api/stripe`)
```
POST   /api/stripe/checkout            # Create checkout session
POST   /api/stripe/portal              # Create customer portal session
POST   /api/stripe/cancel              # Cancel subscription
POST   /api/stripe/apply-promo         # Validate and apply promo code
GET    /api/stripe/products            # Get available products (cached)
```

### Webhooks (`/api/webhooks`)
```
POST   /api/webhooks/stripe            # Stripe webhook handler
POST   /api/webhooks/supabase          # Supabase webhook handler (auth events)
```

### Affiliate (`/api/affiliate`)
```
POST   /api/affiliate/request          # Request to become affiliate
GET    /api/affiliate/stats            # Get affiliate statistics
GET    /api/affiliate/transactions     # Get transaction history
POST   /api/affiliate/payout           # Request payout
```

### Content (`/api/content`) - Admin
```
POST   /api/content/upload             # Upload new content
PUT    /api/content/:id                # Update content
DELETE /api/content/:id                # Delete content
POST   /api/content/:id/publish        # Publish content
```

### Admin (`/api/admin`)
```
POST   /api/admin/users/:id/admin      # Make user admin
DELETE /api/admin/users/:id/admin      # Remove admin
POST   /api/admin/promo-codes          # Create promo code
GET    /api/admin/analytics/overview   # Dashboard stats
GET    /api/admin/analytics/funnel     # Conversion funnel
POST   /api/admin/import/knowledge     # Import knowledge base
POST   /api/admin/email/send           # Send email to users
```

### Analytics (`/api/analytics`) - Internal
```
POST   /api/analytics/track            # Track page view/action
POST   /api/analytics/visitor          # Register anonymous visitor
```

---

## Implementation Order (Dependencies)

### Phase 1: Foundation (Week 1)
```
1. Project Setup
   ├── Initialize Express app
   ├── Configure environment variables
   ├── Set up Supabase client (service role)
   ├── Set up logging (Winston/Pino)
   └── Configure CORS, helmet, compression

2. Core Middlewares
   ├── Error handler
   ├── Auth middleware (JWT verification)
   ├── Request validation (Joi/Zod)
   └── Rate limiter (express-rate-limit)

3. Base Repository Pattern
   └── Create base repository with common CRUD operations
```

### Phase 2: Email System (Week 1-2)
```
4. Email Service (CRITICAL - needed for auth)
   ├── Configure email provider (Resend recommended)
   ├── Email repository (template fetching)
   ├── Email service (sending logic)
   ├── Email templates integration
   └── Email tracking (opens/clicks)

5. Auth Webhooks
   ├── Welcome email on signup
   ├── Password reset email
   └── Email verification
```

### Phase 3: AI & Chat (Week 2-3)
```
6. OpenAI Integration
   ├── Configure OpenAI client
   ├── Embedding service (text → vector)
   └── Chat completion service

7. RAG System
   ├── Knowledge base repository
   ├── Semantic search function
   ├── Context building for AI
   └── Source citation

8. Chat API
   ├── Chat repository
   ├── Chat service (orchestration)
   ├── Rate limiting integration
   ├── Message streaming (SSE)
   └── Feedback collection
```

### Phase 4: Payments (Week 3-4)
```
9. Stripe Integration
   ├── Configure Stripe client
   ├── Product/price sync
   ├── Checkout session creation
   ├── Customer portal
   └── Subscription management

10. Stripe Webhooks
    ├── checkout.session.completed
    ├── customer.subscription.updated
    ├── customer.subscription.deleted
    ├── invoice.paid
    └── invoice.payment_failed

11. Promo Codes
    ├── Validation logic
    ├── Stripe coupon integration
    └── Usage tracking
```

### Phase 5: Affiliate System (Week 4)
```
12. Affiliate Features
    ├── Affiliate repository
    ├── Commission calculation
    ├── Payout processing
    └── Reporting
```

### Phase 6: Admin & Analytics (Week 5)
```
13. Admin Panel API
    ├── User management
    ├── Content management
    ├── Knowledge base import
    └── Promo code management

14. Analytics
    ├── Anonymous visitor tracking
    ├── View recording
    ├── Conversion funnel
    └── Popular searches
```

### Phase 7: Polish & Deploy (Week 5-6)
```
15. Testing
    ├── Unit tests
    ├── Integration tests
    └── E2E tests (critical paths)

16. Documentation
    ├── API documentation (Swagger)
    └── Deployment guide

17. Deployment
    ├── Docker setup
    ├── CI/CD pipeline
    └── Monitoring (Sentry, etc.)
```

---

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001
CLIENT_URL=http://localhost:5173

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # ⚠️ Keep secret!

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PREMIUM=price_...

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=AIDE+ <noreply@aide.plus>

# Security
JWT_SECRET=your-jwt-secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Analytics (optional)
SENTRY_DSN=https://...
```

---

## Key Design Decisions

### Why Repository Pattern?
- **Abstraction**: Controllers don't know about Supabase
- **Testability**: Easy to mock repositories
- **Flexibility**: Can switch DB without changing services

### Why Service Layer?
- **Business Logic**: Isolated from HTTP concerns
- **Reusability**: Services can call each other
- **Transaction Management**: Complex operations in one place

### Why Backend for AI?
- **API Key Security**: OpenAI key never exposed
- **Rate Limiting**: Server-side enforcement
- **RAG Context**: Building context from multiple sources
- **Cost Control**: Monitor and limit AI usage

### Why Backend for Stripe?
- **Webhook Security**: Signature verification
- **Secret Key**: Never expose to client
- **Business Logic**: Subscription state management
- **Affiliate Tracking**: Commission calculation

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      { "field": "email", "message": "Must be a valid email" }
    ]
  }
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `AI_ERROR` | 503 | AI service unavailable |
| `PAYMENT_ERROR` | 402 | Payment required/failed |

---

## Success Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/*` | 10 req | 15 min |
| `/api/chat/message` | By tier | 24 hours |
| `/api/stripe/*` | 20 req | 15 min |
| `/api/analytics/*` | 100 req | 1 min |
| General API | 100 req | 15 min |

---

## Logging

### Log Levels
- `error`: Errors requiring immediate attention
- `warn`: Unexpected situations (not errors)
- `info`: Important events (startup, requests)
- `debug`: Detailed debugging info

### Log Format
```json
{
  "timestamp": "2025-12-09T10:30:00Z",
  "level": "info",
  "message": "User subscription created",
  "userId": "uuid",
  "subscriptionId": "sub_xxx",
  "tier": "premium"
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-09 | Initial architecture documentation |
