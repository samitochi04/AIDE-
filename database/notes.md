# AIDE+ Database Documentation

## Overview
This document provides a comprehensive guide to the AIDE+ database structure for backend developers. The database is designed for Supabase (PostgreSQL) and includes support for RAG (Retrieval-Augmented Generation) AI features.

---

## Quick Start

### Running the Scripts
```sql
-- 1. First, run main.sql (creates tables, indexes, RLS policies)
-- 2. Then, run functions.sql (creates triggers, functions)
-- 3. Create your first super admin:
SELECT create_first_super_admin('your-email@example.com');
```

### Required Extensions
- `uuid-ossp` - UUID generation
- `pgcrypto` - Cryptographic functions
- `vector` - Vector embeddings for RAG/AI

---

## Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER MANAGEMENT                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │  auth.users  │────▶│   profiles   │◀────│   admins     │                │
│  │  (Supabase)  │     │              │     │              │                │
│  └──────────────┘     └──────┬───────┘     └──────────────┘                │
│                              │                                              │
│                              │ referred_by                                  │
│                              ▼                                              │
│                       ┌──────────────┐                                      │
│                       │  affiliates  │                                      │
│                       └──────────────┘                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           KNOWLEDGE BASE (RAG)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │  gov_aides   │     │  procedures  │     │   renting    │                │
│  │  (18 regions)│     │  (students/  │     │  (platforms) │                │
│  │              │     │   workers)   │     │              │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                    │                    │                         │
│         └────────────────────┴────────────────────┘                         │
│                              │                                              │
│                    vector embeddings (1536d)                                │
│                    + full-text search (French)                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              STRIPE / BILLING                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  profiles ──▶ stripe_customers ──▶ stripe_subscriptions ──▶ stripe_invoices│
│                                            │                                │
│                                            ▼                                │
│                    promo_codes ◀──── affiliate_transactions                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                 AI CHAT                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  profiles ──▶ chat_conversations ──▶ chat_messages                         │
│       │                                    │                                │
│       ▼                                    ▼                                │
│  chat_usage                          rag_sources (JSONB)                    │
│  (rate limiting)                     (references to knowledge base)         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                             SIMULATIONS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  profiles ──▶ simulations ──▶ saved_aides ──▶ user_procedures              │
│                    │               │                  │                     │
│                    │               ▼                  ▼                     │
│                    │         status tracking    steps tracking              │
│                    │         (saved/applied/   (JSONB array)                │
│                    │         received/rejected) progress %                  │
│                    ▼                                                        │
│              results (JSONB) ── eligible aides list                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                               ANALYTICS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  anonymous_visitors ──▶ view_records ◀── profiles                          │
│         │                    │                                              │
│         │                    ▼                                              │
│         │              user_searches                                        │
│         │                                                                   │
│         └──────────▶ converted_to_user_id (on signup)                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tables Reference

### 1. User Management

#### `profiles`
Main user table linked to Supabase auth.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, references `auth.users(id)` |
| `email` | TEXT | User email (unique) |
| `full_name` | TEXT | Display name |
| `phone` | TEXT | Phone number |
| `status` | user_status | `student`, `worker`, `job_seeker`, `retiree`, `tourist`, `other` |
| `nationality` | nationality_type | `french`, `eu_eea`, `non_eu`, `other` |
| `country_of_origin` | TEXT | Country code |
| `date_of_birth` | DATE | For age-based filtering |
| `region` | TEXT | French region |
| `department` | TEXT | French department |
| `city` | TEXT | City name |
| `postal_code` | TEXT | Postal code |
| `language` | TEXT | UI language (`fr`, `en`, `es`, `de`, `it`, `pt`, `ar`, `zh`, `ja`, `ko`) |
| `notification_preferences` | JSONB | `{"email": true, "push": true, "sms": false}` |
| `subscription_tier` | subscription_tier | `free`, `basic`, `premium`, `enterprise` |
| `referred_by` | UUID | References another profile |
| `referral_code` | TEXT | Unique code for referrals |
| `device_id` | TEXT | Last device fingerprint |
| `last_ip` | TEXT | Last known IP |
| `is_active` | BOOLEAN | Soft delete flag |

**Helper Function:**
```sql
-- Get age group dynamically (not stored, calculated on query)
SELECT get_age_group(date_of_birth) FROM profiles;
-- Returns: 'infant', 'child', 'adolescent', 'young_adult', 'adult', 'senior'
```

---

#### `admins`
Admin users with role-based permissions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `profiles(id)` |
| `role` | admin_role | `super_admin`, `admin`, `moderator`, `support` |
| `can_create_promo_codes` | BOOLEAN | Permission to create promo codes |
| `max_discount_percentage` | INTEGER | Max discount they can set (0-100) |
| `permissions` | JSONB | Granular permissions object |
| `created_by` | UUID | Admin who created this admin |

**Permissions JSONB Structure:**
```json
{
  "manage_users": false,
  "manage_content": true,
  "manage_affiliates": false,
  "manage_subscriptions": false,
  "view_analytics": true,
  "manage_admins": false
}
```

---

#### `affiliates`
Affiliate program for referral commissions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `profiles(id)` |
| `affiliate_code` | TEXT | Unique affiliate code |
| `commission_rate` | DECIMAL(5,2) | Percentage (default 10%) |
| `total_referrals` | INTEGER | Total users referred |
| `successful_conversions` | INTEGER | Referrals who subscribed |
| `total_earnings` | DECIMAL(10,2) | Lifetime earnings |
| `pending_earnings` | DECIMAL(10,2) | Not yet paid out |
| `paid_earnings` | DECIMAL(10,2) | Already paid |
| `payout_method` | TEXT | `stripe`, `paypal`, `bank_transfer` |
| `payout_details` | JSONB | Bank/PayPal details |
| `minimum_payout` | DECIMAL(10,2) | Min amount for payout (default €50) |
| `is_active` | BOOLEAN | Active status |
| `verified_at` | TIMESTAMPTZ | When verified |

---

#### `promo_codes`
Promotional discount codes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `code` | TEXT | Unique promo code |
| `discount_type` | TEXT | `percentage` or `fixed` |
| `discount_value` | DECIMAL(10,2) | Amount or percentage |
| `valid_from` | TIMESTAMPTZ | Start date |
| `valid_until` | TIMESTAMPTZ | End date (NULL = no expiry) |
| `max_uses` | INTEGER | Max uses (NULL = unlimited) |
| `current_uses` | INTEGER | Current use count |
| `applicable_tiers` | subscription_tier[] | Which tiers can use |
| `first_time_only` | BOOLEAN | Only for new subscribers |
| `minimum_amount` | DECIMAL(10,2) | Minimum purchase |
| `created_by` | UUID | Admin who created |
| `affiliate_id` | UUID | If affiliate-linked |

---

### 2. Knowledge Base (RAG-Enabled)

All three tables have:
- `content_text` - Flattened text for full-text search
- `embedding` - Vector(1536) for semantic search

#### `gov_aides`
Government aides by region.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `region_id` | TEXT | Region identifier (e.g., `ile-de-france`) |
| `region_name` | TEXT | Region name |
| `region_code` | TEXT | INSEE code |
| `departments` | TEXT[] | Department codes array |
| `profile_type` | TEXT | `french`, `eu`, `non_eu`, `all` |
| `profile_subtype` | TEXT | `student`, `worker`, etc. |
| `aide_id` | TEXT | Unique aide identifier |
| `aide_name` | TEXT | Aide name |
| `aide_description` | TEXT | Description |
| `aide_category` | TEXT | Category |
| `aide_data` | JSONB | Full aide data |
| `content_text` | TEXT | Searchable text |
| `embedding` | vector(1536) | AI embedding |
| `source_url` | TEXT | Official source |

**Unique Constraint:** `(region_id, profile_type, aide_id)`

---

#### `procedures`
Administrative procedures for students/workers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `category` | TEXT | `students` or `workers` |
| `subcategory` | TEXT | `erasmus`, `eu`, `nonEu` |
| `procedure_id` | TEXT | Procedure identifier |
| `procedure_name` | TEXT | Name |
| `procedure_description` | TEXT | Description |
| `section` | TEXT | `preArrival`, `arrival`, `banking`, etc. |
| `subsection` | TEXT | More specific section |
| `procedure_data` | JSONB | Full procedure data |
| `content_text` | TEXT | Searchable text |
| `embedding` | vector(1536) | AI embedding |

**Unique Constraint:** `(category, subcategory, section, procedure_id)`

---

#### `renting`
Rental platforms and resources.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `category` | TEXT | `majorPortals`, `studentHousing`, etc. |
| `platform_id` | TEXT | Platform identifier |
| `platform_name` | TEXT | Name |
| `platform_url` | TEXT | Website URL |
| `platform_description` | TEXT | Description |
| `platform_data` | JSONB | Full platform data |
| `content_text` | TEXT | Searchable text |
| `embedding` | vector(1536) | AI embedding |

**Unique Constraint:** `(category, platform_id)`

---

### 3. Content Management

#### `contents`
Admin-posted educational content.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | TEXT | Content title |
| `description` | TEXT | Description |
| `content_type` | content_type | `video`, `image`, `article`, `tutorial`, `guide`, `infographic` |
| `media_url` | TEXT | Media file URL |
| `thumbnail_url` | TEXT | Thumbnail URL |
| `duration_seconds` | INTEGER | Video duration |
| `tags` | TEXT[] | Tags array for filtering |
| `target_profiles` | user_status[] | Target user statuses |
| `target_nationalities` | nationality_type[] | Target nationalities |
| `target_regions` | TEXT[] | Target regions (NULL = all) |
| `language` | TEXT | Content language |
| `view_count` | INTEGER | View counter |
| `like_count` | INTEGER | Like counter (auto-updated) |
| `share_count` | INTEGER | Share counter |
| `slug` | TEXT | URL-friendly slug |
| `is_published` | BOOLEAN | Published status |
| `is_featured` | BOOLEAN | Featured flag |
| `display_order` | INTEGER | Sort order |
| `created_by` | UUID | Admin author |

**Query by tags:**
```sql
SELECT * FROM contents WHERE 'caf' = ANY(tags) AND is_published = true;
```

---

#### `content_likes`
User likes on content (no comments).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `content_id` | UUID | References `contents(id)` |
| `user_id` | UUID | References `profiles(id)` |
| `created_at` | TIMESTAMPTZ | When liked |

**Unique Constraint:** `(content_id, user_id)` - prevents duplicate likes

---

### 4. Email System

#### `email_templates`
Reusable email templates.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `template_key` | TEXT | Unique key (e.g., `welcome`, `password_reset`) |
| `template_name` | TEXT | Display name |
| `description` | TEXT | Template purpose |
| `subject` | TEXT | Email subject with variables |
| `body_html` | TEXT | HTML body with variables |
| `body_text` | TEXT | Plain text fallback |
| `available_variables` | JSONB | List of variables like `["{{name}}", "{{email}}"]` |
| `language` | TEXT | Default language |
| `translations` | JSONB | Other language versions |
| `is_active` | BOOLEAN | Active status |
| `category` | TEXT | `transactional`, `marketing`, `notification` |
| `send_count` | INTEGER | Times used |

**Pre-loaded Templates:**
- `welcome` - New user welcome
- `password_reset` - Password reset link
- `subscription_welcome` - New subscription
- `subscription_canceled` - Cancellation notice
- `affiliate_payout` - Payout notification

---

#### `email_logs`
Track all sent emails.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `template_id` | UUID | Template used |
| `user_id` | UUID | Recipient user |
| `recipient_email` | TEXT | Email address |
| `subject` | TEXT | Actual subject sent |
| `status` | TEXT | `pending`, `sent`, `delivered`, `bounced`, `failed` |
| `error_message` | TEXT | Error if failed |
| `sent_at` | TIMESTAMPTZ | When sent |
| `delivered_at` | TIMESTAMPTZ | When delivered |
| `opened_at` | TIMESTAMPTZ | When opened (if tracked) |
| `clicked_at` | TIMESTAMPTZ | When link clicked |

---

### 5. Stripe Integration

#### `stripe_customers`
Link profiles to Stripe.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `profiles(id)` |
| `stripe_customer_id` | TEXT | Stripe customer ID |
| `default_payment_method` | TEXT | Default payment method |
| `currency` | TEXT | Currency (default `eur`) |

---

#### `stripe_products`
Subscription plans.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `stripe_product_id` | TEXT | Stripe product ID |
| `stripe_price_id` | TEXT | Stripe price ID |
| `name` | TEXT | Plan name |
| `description` | TEXT | Description |
| `tier` | subscription_tier | `free`, `basic`, `premium`, `enterprise` |
| `price_amount` | INTEGER | Price in cents |
| `currency` | TEXT | Currency |
| `interval` | TEXT | `month` or `year` |
| `interval_count` | INTEGER | Billing interval |
| `features` | JSONB | Feature list |
| `ai_messages_limit` | INTEGER | Daily AI messages (NULL = unlimited) |
| `is_active` | BOOLEAN | Active status |

---

#### `stripe_subscriptions`
Active subscriptions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `profiles(id)` |
| `stripe_customer_id` | TEXT | References `stripe_customers` |
| `stripe_subscription_id` | TEXT | Stripe subscription ID |
| `stripe_price_id` | TEXT | Price ID |
| `status` | subscription_status | Current status |
| `tier` | subscription_tier | Subscription tier |
| `current_period_start` | TIMESTAMPTZ | Period start |
| `current_period_end` | TIMESTAMPTZ | Period end |
| `cancel_at_period_end` | BOOLEAN | Scheduled cancellation |
| `canceled_at` | TIMESTAMPTZ | When canceled |
| `trial_start` | TIMESTAMPTZ | Trial start |
| `trial_end` | TIMESTAMPTZ | Trial end |
| `promo_code_id` | UUID | Applied promo code |
| `affiliate_id` | UUID | Referring affiliate |

**Status Values:**
- `active` - Currently active
- `canceled` - Canceled
- `past_due` - Payment failed
- `unpaid` - Not paid
- `trialing` - In trial period
- `incomplete` - Setup incomplete
- `incomplete_expired` - Setup expired
- `paused` - Paused

---

#### `stripe_invoices`
Invoice history.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `profiles(id)` |
| `stripe_invoice_id` | TEXT | Stripe invoice ID |
| `stripe_subscription_id` | TEXT | Related subscription |
| `amount_due` | INTEGER | Amount due (cents) |
| `amount_paid` | INTEGER | Amount paid (cents) |
| `currency` | TEXT | Currency |
| `status` | TEXT | Invoice status |
| `hosted_invoice_url` | TEXT | Stripe hosted invoice |
| `invoice_pdf` | TEXT | PDF download URL |
| `period_start` | TIMESTAMPTZ | Billing period start |
| `period_end` | TIMESTAMPTZ | Billing period end |
| `due_date` | TIMESTAMPTZ | Due date |
| `paid_at` | TIMESTAMPTZ | When paid |

---

#### `affiliate_transactions`
Track affiliate earnings and payouts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `affiliate_id` | UUID | References `affiliates(id)` |
| `subscription_id` | UUID | Related subscription |
| `referred_user_id` | UUID | User who subscribed |
| `transaction_type` | TEXT | `commission`, `payout`, `adjustment` |
| `amount` | DECIMAL(10,2) | Transaction amount |
| `currency` | TEXT | Currency |
| `subscription_amount` | DECIMAL(10,2) | Original subscription amount |
| `commission_rate` | DECIMAL(5,2) | Rate applied |
| `status` | payout_status | `pending`, `processing`, `completed`, `failed`, `cancelled` |
| `payout_id` | TEXT | External payout reference |
| `payout_date` | TIMESTAMPTZ | When paid out |

---

### 6. AI Chat

#### `chat_conversations`
Chat sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `profiles(id)` (NULL for anonymous) |
| `anonymous_id` | TEXT | Anonymous user identifier |
| `device_id` | TEXT | Device fingerprint |
| `title` | TEXT | Conversation title |
| `summary` | TEXT | AI-generated summary |
| `context` | JSONB | User context snapshot |
| `message_count` | INTEGER | Total messages (auto-updated) |
| `is_active` | BOOLEAN | Active status |
| `last_message_at` | TIMESTAMPTZ | Last activity |

---

#### `chat_messages`
Individual messages.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `conversation_id` | UUID | References `chat_conversations(id)` |
| `role` | chat_role | `user`, `assistant`, `system` |
| `content` | TEXT | Message content |
| `model` | TEXT | AI model used (e.g., `gpt-4`) |
| `tokens_used` | INTEGER | Tokens consumed |
| `rag_sources` | JSONB | Knowledge base sources used |
| `feedback_rating` | INTEGER | User rating (1-5) |
| `feedback_text` | TEXT | User feedback |

**rag_sources Example:**
```json
{
  "gov_aides": ["uuid-1", "uuid-2"],
  "procedures": ["uuid-3"],
  "renting": []
}
```

---

#### `chat_usage`
Rate limiting per user.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `profiles(id)` |
| `period_start` | TIMESTAMPTZ | Period start (daily) |
| `period_end` | TIMESTAMPTZ | Period end |
| `messages_count` | INTEGER | Messages sent |
| `tokens_used` | INTEGER | Total tokens used |
| `messages_limit` | INTEGER | Limit from subscription |

**Unique Constraint:** `(user_id, period_start)`

---

### 7. Simulations

#### `simulations`
Stores user eligibility simulations and their results.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `profiles(id)` |
| `user_type` | TEXT | `student` or `worker` |
| `situation` | JSONB | User situation data (location, income, etc.) |
| `results` | JSONB | Simulation results (eligible aides) |
| `total_monthly` | DECIMAL(10,2) | Total monthly amount eligible |
| `total_annual` | DECIMAL(10,2) | Total annual amount eligible |
| `eligible_aides_count` | INTEGER | Number of eligible aides |
| `created_at` | TIMESTAMPTZ | When simulation was run |
| `updated_at` | TIMESTAMPTZ | Last update |

**situation Example:**
```json
{
  "region": "ile-de-france",
  "city": "Paris",
  "housing": "location",
  "rent": 800,
  "income": 15000,
  "age": 22,
  "hasDisability": false,
  "studyLevel": "licence"
}
```

**results Example:**
```json
{
  "eligible": [
    {
      "id": "aide-uuid",
      "name": "APL",
      "description": "Aide personnalisée au logement",
      "category": "logement",
      "monthlyAmount": 200,
      "annualAmount": 2400,
      "sourceUrl": "https://...",
      "applicationUrl": "https://..."
    }
  ],
  "ineligible": [],
  "summary": {
    "totalMonthly": 350,
    "totalAnnual": 4200,
    "count": 3
  }
}
```

---

#### `saved_aides`
Bookmarked/saved aides from simulations with status tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `profiles(id)` |
| `aide_id` | TEXT | Aide identifier (from simulation results) |
| `aide_name` | TEXT | Aide name |
| `aide_description` | TEXT | Aide description |
| `aide_category` | TEXT | `logement`, `mobilite`, `sante`, `education`, `emploi`, `transport`, `other` |
| `monthly_amount` | DECIMAL(10,2) | Monthly amount |
| `source_url` | TEXT | Information URL |
| `application_url` | TEXT | Application URL |
| `status` | TEXT | `saved`, `applied`, `received`, `rejected` |
| `applied_at` | TIMESTAMPTZ | When user applied |
| `notes` | TEXT | User notes |
| `simulation_id` | UUID | References `simulations(id)` |
| `created_at` | TIMESTAMPTZ | When saved |
| `updated_at` | TIMESTAMPTZ | Last update |

**Unique Constraint:** `(user_id, aide_id)` - User can only save each aide once

**Status Workflow:**
- `saved` → User bookmarked the aide
- `applied` → User submitted application
- `received` → Application approved
- `rejected` → Application denied

---

#### `user_procedures`
Track user's administrative procedures with step-by-step progress.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `profiles(id)` |
| `procedure_type` | TEXT | `aide_application`, `document_request`, `account_creation`, `renewal`, `appeal`, `other` |
| `procedure_name` | TEXT | User-defined name |
| `related_aide_id` | TEXT | Linked aide identifier (optional) |
| `status` | TEXT | `not_started`, `in_progress`, `pending`, `completed`, `rejected` |
| `current_step` | INTEGER | Current step index (0-based) |
| `total_steps` | INTEGER | Total number of steps |
| `steps` | JSONB | Array of step objects |
| `documents` | JSONB | Array of document objects |
| `provider` | TEXT | Organization name (CAF, CPAM, etc.) |
| `deadline` | DATE | Optional deadline |
| `notes` | TEXT | User notes |
| `created_at` | TIMESTAMPTZ | When created |
| `updated_at` | TIMESTAMPTZ | Last update |

**Steps JSONB Structure:**
```json
[
  {
    "name": "Create CAF account",
    "completed": true,
    "date": "2024-01-10T10:00:00Z"
  },
  {
    "name": "Fill application form",
    "completed": false,
    "date": null
  }
]
```

**Documents JSONB Structure:**
```json
[
  {
    "name": "ID Document",
    "required": true,
    "uploaded": true,
    "uploaded_at": "2024-01-10T10:00:00Z"
  },
  {
    "name": "Proof of residence",
    "required": true,
    "uploaded": false
  }
]
```

**Status Workflow:**
- `not_started` → No steps completed
- `in_progress` → Some steps completed
- `pending` → All steps done, waiting for response
- `completed` → Application approved
- `rejected` → Application denied

**Index:** `user_id, status` for efficient filtering

---

### 8. Analytics

#### `anonymous_visitors`
Track visitors before signup.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `device_fingerprint` | TEXT | Browser fingerprint |
| `first_ip` | TEXT | First IP seen |
| `current_ip` | TEXT | Most recent IP |
| `user_agent` | TEXT | Browser user agent |
| `device_type` | TEXT | `desktop`, `mobile`, `tablet` |
| `browser` | TEXT | Browser name |
| `os` | TEXT | Operating system |
| `first_source` | TEXT | UTM source |
| `first_medium` | TEXT | UTM medium |
| `first_campaign` | TEXT | UTM campaign |
| `first_referrer` | TEXT | Referrer URL |
| `landing_page` | TEXT | First page visited |
| `converted_to_user_id` | UUID | If signed up |
| `converted_at` | TIMESTAMPTZ | When signed up |
| `total_page_views` | INTEGER | Page views |
| `total_sessions` | INTEGER | Sessions count |
| `total_time_seconds` | INTEGER | Time spent |

---

#### `view_records`
Detailed activity tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Logged-in user (or NULL) |
| `anonymous_visitor_id` | UUID | Anonymous visitor (or NULL) |
| `session_id` | TEXT | Session identifier |
| `ip_address` | TEXT | IP address |
| `user_agent` | TEXT | User agent |
| `device_fingerprint` | TEXT | Device fingerprint |
| `page_url` | TEXT | Page visited |
| `page_title` | TEXT | Page title |
| `action_type` | TEXT | `page_view`, `api_call`, `search`, `click`, `form_submit` |
| `action_details` | JSONB | Action-specific data |
| `api_endpoint` | TEXT | API endpoint called |
| `api_method` | TEXT | HTTP method |
| `api_params` | JSONB | API parameters |
| `api_response_status` | INTEGER | Response status code |
| `api_response_time_ms` | INTEGER | Response time |
| `search_query` | TEXT | Search query |
| `search_results_count` | INTEGER | Results returned |
| `search_filters` | JSONB | Filters applied |
| `time_on_page_seconds` | INTEGER | Time on page |
| `scroll_depth_percent` | INTEGER | Scroll depth |
| `referrer` | TEXT | Referrer URL |
| `utm_source` | TEXT | UTM source |
| `utm_medium` | TEXT | UTM medium |
| `utm_campaign` | TEXT | UTM campaign |
| `country` | TEXT | Country (from IP) |
| `region` | TEXT | Region (from IP) |
| `city` | TEXT | City (from IP) |

---

#### `user_searches`
Search analytics.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | User (or NULL) |
| `anonymous_visitor_id` | UUID | Anonymous visitor |
| `query` | TEXT | Search query |
| `search_type` | TEXT | `aides`, `procedures`, `renting`, `general` |
| `filters` | JSONB | Applied filters |
| `results_count` | INTEGER | Results returned |
| `clicked_result_id` | TEXT | Result clicked |
| `clicked_result_type` | TEXT | Type of result |

---

### 9. Other Tables

#### `user_favorites`
Saved items.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `profiles(id)` |
| `item_type` | TEXT | `aide`, `procedure`, `renting`, `content` |
| `item_id` | UUID | Item ID |
| `notes` | TEXT | User notes |

---

#### `notifications`
User notifications.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `profiles(id)` |
| `title` | TEXT | Notification title |
| `body` | TEXT | Notification body |
| `notification_type` | TEXT | `aide_update`, `subscription`, `content`, `system` |
| `related_type` | TEXT | Related item type |
| `related_id` | UUID | Related item ID |
| `action_url` | TEXT | Action link |
| `is_read` | BOOLEAN | Read status |
| `read_at` | TIMESTAMPTZ | When read |

---

#### `system_settings`
Application settings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `key` | TEXT | Setting key |
| `value` | JSONB | Setting value |
| `description` | TEXT | Description |
| `updated_by` | UUID | Admin who updated |

**Pre-loaded Settings:**
| Key | Default | Description |
|-----|---------|-------------|
| `ai_model` | `"gpt-4"` | Default AI model |
| `free_tier_messages` | `10` | Daily messages for free tier |
| `basic_tier_messages` | `50` | Daily messages for basic tier |
| `premium_tier_messages` | `200` | Daily messages for premium tier |
| `default_commission_rate` | `10` | Default affiliate commission % |
| `minimum_payout` | `50` | Minimum payout in EUR |

---

## Functions Reference

### Authentication & User Management

#### `handle_new_user()` [TRIGGER]
**Triggered:** After INSERT on `auth.users`

**What it does:**
1. Generates unique referral code
2. Creates profile from auth user data
3. Links referral if user signed up with referral code
4. Updates affiliate referral count

**Auto-extracted from metadata:**
- `full_name` or `name`
- `avatar_url`
- `language`
- `referral_code` (for tracking)

---

#### `create_first_super_admin(email TEXT)`
**Usage:** `SELECT create_first_super_admin('admin@example.com');`

**What it does:**
- Creates the first super admin (only works once)
- Grants all permissions

---

#### `make_admin(user_id UUID, role admin_role, created_by UUID)`
**Usage:** `SELECT make_admin('user-uuid', 'moderator', 'admin-uuid');`

**What it does:**
- Promotes user to admin with specified role
- Updates if already admin

---

#### `get_age_group(dob DATE)`
**Usage:** `SELECT get_age_group(date_of_birth) FROM profiles;`

**Returns:**
- `infant` (0-3)
- `child` (4-11)
- `adolescent` (12-17)
- `young_adult` (18-25)
- `adult` (26-59)
- `senior` (60+)

---

### Subscription & Billing

#### `sync_subscription_to_profile()` [TRIGGER]
**Triggered:** After INSERT/UPDATE on `stripe_subscriptions`

**What it does:**
- Updates `profiles.subscription_tier` to match subscription

---

#### `process_affiliate_commission()` [TRIGGER]
**Triggered:** After INSERT on `stripe_subscriptions`

**What it does:**
1. Checks if subscription has affiliate_id
2. Calculates commission based on rate
3. Creates `affiliate_transactions` record
4. Updates affiliate stats (conversions, earnings)

---

#### `validate_promo_code(code, user_id, tier, amount)`
**Usage:**
```sql
SELECT * FROM validate_promo_code('SAVE20', 'user-uuid', 'premium', 29.99);
```

**Returns:**
| Column | Type | Description |
|--------|------|-------------|
| `is_valid` | BOOLEAN | If code is valid |
| `discount_type` | TEXT | `percentage` or `fixed` |
| `discount_value` | DECIMAL | Discount amount |
| `final_amount` | DECIMAL | Price after discount |
| `error_message` | TEXT | Error if invalid |

**Validations:**
- Code exists and is active
- Within validity period
- Under max uses
- Applicable to tier
- Meets minimum amount
- First-time only check

---

#### `use_promo_code(code TEXT)`
**Usage:** `SELECT use_promo_code('SAVE20');`

**What it does:**
- Increments `current_uses` counter

---

### AI Chat

#### `can_send_chat_message(user_id UUID)`
**Usage:**
```sql
SELECT * FROM can_send_chat_message('user-uuid');
```

**Returns:**
| Column | Type | Description |
|--------|------|-------------|
| `allowed` | BOOLEAN | Can send message |
| `remaining_messages` | INTEGER | Messages left today |
| `reset_at` | TIMESTAMPTZ | When limit resets |
| `error_message` | TEXT | Error if not allowed |

**Limits by tier:**
- Free: 10/day
- Basic: 50/day
- Premium: 200/day
- Enterprise: Unlimited

---

#### `update_conversation_on_message()` [TRIGGER]
**Triggered:** After INSERT on `chat_messages`

**What it does:**
- Increments `message_count`
- Updates `last_message_at`

---

#### `track_ai_usage()` [TRIGGER]
**Triggered:** After INSERT on `chat_messages` (assistant role only)

**What it does:**
- Creates/updates `chat_usage` record
- Tracks daily message count and tokens

---

### RAG Search Functions

#### `search_gov_aides(embedding, threshold, count, region, profile)`
**Usage:**
```sql
SELECT * FROM search_gov_aides(
    '[0.1, 0.2, ...]'::vector,  -- Query embedding
    0.7,                         -- Similarity threshold
    10,                          -- Max results
    'ile-de-france',            -- Filter by region (optional)
    'student'                    -- Filter by profile (optional)
);
```

**Returns:** Matching aides with similarity score

---

#### `search_procedures(embedding, threshold, count, category, subcategory)`
**Usage:**
```sql
SELECT * FROM search_procedures(
    '[0.1, 0.2, ...]'::vector,
    0.7,
    10,
    'students',  -- Optional
    'erasmus'    -- Optional
);
```

---

#### `search_renting(embedding, threshold, count, category)`
**Usage:**
```sql
SELECT * FROM search_renting(
    '[0.1, 0.2, ...]'::vector,
    0.7,
    10,
    'studentHousing'  -- Optional
);
```

---

#### `search_all_knowledge(embedding, threshold, count)`
**Usage:**
```sql
SELECT * FROM search_all_knowledge(
    '[0.1, 0.2, ...]'::vector,
    0.7,
    10
);
```

**Returns:** Combined results from all three knowledge bases with `source_type`

---

#### `fulltext_search_knowledge(query TEXT, max_results INT)`
**Usage:**
```sql
SELECT * FROM fulltext_search_knowledge('APL logement étudiant', 20);
```

**What it does:**
- French full-text search across all knowledge bases
- No embeddings needed
- Uses PostgreSQL `websearch_to_tsquery`

---

### Analytics

#### `get_or_create_anonymous_visitor(...)`
**Usage:**
```sql
SELECT get_or_create_anonymous_visitor(
    'fingerprint-hash',
    '192.168.1.1',
    'Mozilla/5.0...',
    'google',      -- UTM source
    'cpc',         -- UTM medium
    'summer2025',  -- UTM campaign
    'https://google.com',
    '/landing-page'
);
```

**Returns:** UUID of visitor (new or existing)

---

#### `link_anonymous_visitor_to_user()` [TRIGGER]
**Triggered:** After INSERT on `auth.users`

**What it does:**
- Links anonymous visitor to new user
- Updates `view_records` with user_id

---

#### `record_view(...)`
**Usage:**
```sql
SELECT record_view(
    user_id := 'uuid',
    page_url := '/aides/caf',
    action_type := 'page_view'
    -- ... many optional params
);
```

**Returns:** UUID of created view record

---

#### `get_conversion_funnel(start_date, end_date)`
**Usage:**
```sql
SELECT * FROM get_conversion_funnel(NOW() - interval '30 days', NOW());
```

**Returns:**
| Column | Description |
|--------|-------------|
| `total_visitors` | Anonymous visitors |
| `visitors_with_search` | Who searched |
| `visitors_with_chat` | Who used chat |
| `registered_users` | Who signed up |
| `subscribed_users` | Who subscribed |
| `conversion_rate` | Signup rate % |

---

#### `get_popular_searches(limit, days)`
**Usage:**
```sql
SELECT * FROM get_popular_searches(20, 30);
```

**Returns:** Top search queries with counts

---

### Email

#### `get_email_template(key, language, variables)`
**Usage:**
```sql
SELECT * FROM get_email_template(
    'welcome',
    'fr',
    '{"name": "Jean", "email": "jean@example.com", "app_url": "https://aide.plus"}'::jsonb
);
```

**Returns:** `subject`, `body_html`, `body_text` with variables replaced

---

### Content

#### `update_content_like_count()` [TRIGGER]
**Triggered:** After INSERT/DELETE on `content_likes`

**What it does:**
- Auto-updates `contents.like_count`

---

## Row Level Security (RLS)

All tables have RLS enabled. Key policies:

### Public Access (No Auth Required)
- `gov_aides` - SELECT
- `procedures` - SELECT
- `renting` - SELECT
- `stripe_products` - SELECT (active only)
- `contents` - SELECT (published only)
- `content_likes` - SELECT

### User Access (Own Data Only)
- `profiles` - SELECT/UPDATE own
- `affiliates` - SELECT own
- `stripe_customers` - SELECT own
- `stripe_subscriptions` - SELECT own
- `stripe_invoices` - SELECT own
- `chat_conversations` - SELECT/INSERT own
- `chat_messages` - SELECT/INSERT in own conversations
- `chat_usage` - SELECT own
- `simulations` - SELECT/INSERT/DELETE own
- `saved_aides` - ALL own
- `notifications` - SELECT/UPDATE own
- `user_favorites` - ALL own
- `content_likes` - INSERT/DELETE own

### Admin Access
- All knowledge base tables - ALL
- `contents` - ALL
- `admins` - SELECT (super_admin can manage)
- `affiliates` - ALL

### Service Role Only
- `view_records` - ALL
- `anonymous_visitors` - ALL
- All Stripe tables - ALL (for backend webhooks)

---

## Enums Reference

```sql
-- User status
user_status: 'student', 'worker', 'job_seeker', 'retiree', 'tourist', 'other'

-- Nationality
nationality_type: 'french', 'eu_eea', 'non_eu', 'other'

-- Subscription status (matches Stripe)
subscription_status: 'active', 'canceled', 'past_due', 'unpaid', 'trialing', 
                     'incomplete', 'incomplete_expired', 'paused'

-- Subscription tier
subscription_tier: 'free', 'basic', 'premium', 'enterprise'

-- Content type
content_type: 'video', 'image', 'article', 'guide', 'infographic'

-- Admin role
admin_role: 'super_admin', 'admin', 'moderator', 'support'

-- Payout status
payout_status: 'pending', 'processing', 'completed', 'failed', 'cancelled'

-- Chat role
chat_role: 'user', 'assistant', 'system'
```

---

## Common Queries

### Get user with all related data
```sql
SELECT 
    p.*,
    get_age_group(p.date_of_birth) as age_group,
    a.role as admin_role,
    af.affiliate_code,
    af.total_earnings as affiliate_earnings,
    ss.status as subscription_status,
    ss.current_period_end as subscription_ends
FROM profiles p
LEFT JOIN admins a ON a.user_id = p.id
LEFT JOIN affiliates af ON af.user_id = p.id
LEFT JOIN stripe_subscriptions ss ON ss.user_id = p.id AND ss.status = 'active'
WHERE p.id = 'user-uuid';
```

### Get aides for a user profile
```sql
SELECT * FROM gov_aides
WHERE region_id = 'ile-de-france'
AND (profile_type = 'student' OR profile_type = 'all')
ORDER BY aide_category, aide_name;
```

### Get content by tags
```sql
SELECT * FROM contents
WHERE is_published = true
AND ('caf' = ANY(tags) OR 'logement' = ANY(tags))
ORDER BY published_at DESC;
```

### Check subscription access
```sql
SELECT 
    p.subscription_tier,
    CASE 
        WHEN p.subscription_tier IN ('premium', 'enterprise') THEN true
        ELSE false
    END as has_premium_access
FROM profiles p
WHERE p.id = 'user-uuid';
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-09 | Initial schema with all tables, functions, and RLS |
