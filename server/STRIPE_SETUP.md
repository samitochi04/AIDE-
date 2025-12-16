# Stripe Integration Setup Guide

This document explains how to set up Stripe for the AIDE+ subscription system.

## Table of Contents
1. [Overview](#overview)
2. [Test Mode Setup](#test-mode-setup)
3. [Creating Products and Prices](#creating-products-and-prices)
4. [Webhook Configuration](#webhook-configuration)
5. [Environment Variables](#environment-variables)
6. [Testing Payments](#testing-payments)
7. [Production Migration](#production-migration)

---

## Overview

AIDE+ uses Stripe for subscription billing with four tiers:
- **Free** (0€) - Basic access with limits
- **Basic** (4.99€/month or 49.99€/year) - Enhanced limits
- **Premium** (9.99€/month or 99.99€/year) - Priority features
- **Ultimate** (14.99€/month or 149.99€/year) - Full access + data export

---

## Test Mode Setup

### 1. Create a Stripe Account
1. Go to [stripe.com](https://stripe.com) and create an account
2. Verify your email address
3. Make sure you're in **Test Mode** (toggle in dashboard header)

### 2. Get API Keys
1. Go to **Developers > API Keys**
2. Copy your **Publishable key** (`pk_test_...`)
3. Copy your **Secret key** (`sk_test_...`)

---

## Creating Products and Prices

### 1. Create a Product
1. Go to **Products** in Stripe Dashboard
2. Click **+ Add product**
3. Set:
   - Name: `AIDE+ Subscription`
   - Description: `Accès aux fonctionnalités premium d'AIDE+`
4. Save and copy the **Product ID** (`prod_...`)

### 2. Create Prices

Create **6 prices** for the product (3 tiers × 2 intervals):

#### Basic Monthly
- Price: €4.99
- Billing: Recurring - Monthly
- Metadata: `tier: basic, interval: monthly`

#### Basic Yearly
- Price: €49.99
- Billing: Recurring - Yearly
- Metadata: `tier: basic, interval: yearly`

#### Premium Monthly
- Price: €9.99
- Billing: Recurring - Monthly
- Metadata: `tier: premium, interval: monthly`

#### Premium Yearly
- Price: €99.99
- Billing: Recurring - Yearly
- Metadata: `tier: premium, interval: yearly`

#### Ultimate Monthly
- Price: €14.99
- Billing: Recurring - Monthly
- Metadata: `tier: ultimate, interval: monthly`

#### Ultimate Yearly
- Price: €149.99
- Billing: Recurring - Yearly
- Metadata: `tier: ultimate, interval: yearly`

### 3. Copy Price IDs
After creating each price, copy the Price ID (`price_...`) for your environment variables.

---

## Webhook Configuration

### 1. Create Webhook Endpoint
1. Go to **Developers > Webhooks**
2. Click **+ Add endpoint**
3. Set the endpoint URL:
   - Development: `http://localhost:3001/api/v1/stripe/webhook`
   - Production: `https://api.your-domain.com/api/v1/stripe/webhook`

### 2. Select Events
Select these events to listen for:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 3. Get Webhook Secret
After creating, click on the webhook and copy the **Signing secret** (`whsec_...`)

### 4. Local Testing with Stripe CLI
For local development, use Stripe CLI:

```bash
# Install Stripe CLI
# Windows (with chocolatey)
choco install stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/v1/stripe/webhook

# The CLI will show a webhook signing secret - use this for local dev
```

---

## Environment Variables

Add these to your `.env` file:

```bash
# ===========================================
# Stripe Configuration
# ===========================================

# API Keys (from Developers > API Keys)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Webhook Secret (from Developers > Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Product ID (from Products)
STRIPE_PRODUCT_ID=prod_your_product_id_here

# Price IDs - Monthly
STRIPE_PRICE_BASIC_MONTHLY=price_basic_monthly_id
STRIPE_PRICE_PREMIUM_MONTHLY=price_premium_monthly_id
STRIPE_PRICE_ULTIMATE_MONTHLY=price_ultimate_monthly_id

# Price IDs - Yearly
STRIPE_PRICE_BASIC_YEARLY=price_basic_yearly_id
STRIPE_PRICE_PREMIUM_YEARLY=price_premium_yearly_id
STRIPE_PRICE_ULTIMATE_YEARLY=price_ultimate_yearly_id
```

---

## Testing Payments

### Test Card Numbers
Use these Stripe test cards:

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 3220` | 3D Secure authentication |
| `4000 0000 0000 9995` | Payment declined |
| `4000 0000 0000 0341` | Card expired |

**For all test cards:**
- Use any future expiration date : 12/34
- Use any 3-digit CVC : 123
- Use any 5-digit postal code : 75001

### Testing Subscription Flow

1. **Start Checkout**
```bash
curl -X POST http://localhost:3001/api/v1/stripe/checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tier": "premium", "interval": "monthly"}'
```

2. **Complete Payment**
- Use the returned URL to complete checkout
- Use a test card number

3. **Verify Webhook**
- Check server logs for webhook events
- Verify subscription created in database

4. **Test Customer Portal**
```bash
curl -X POST http://localhost:3001/api/v1/stripe/portal \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

5. **Test Cancellation**
```bash
curl -X POST http://localhost:3001/api/v1/stripe/subscription/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Production Migration

### Checklist Before Going Live

1. **Switch to Live Mode**
   - Toggle to "Live mode" in Stripe Dashboard
   - Get new live API keys (`sk_live_...`, `pk_live_...`)

2. **Recreate Products and Prices**
   - Create the same product structure in live mode
   - Get new price IDs

3. **Update Environment Variables**
   - Replace all test keys with live keys
   - Update webhook secret with live webhook

4. **Configure Live Webhook**
   - Create new webhook endpoint in live mode
   - Point to production URL

5. **Verify Business Settings**
   - Complete business verification
   - Add bank account for payouts
   - Configure tax settings if needed

6. **Test with Real Card**
   - Make a small real payment to verify
   - Process a refund to test that flow

### Security Checklist

- [ ] API keys are not committed to git
- [ ] Webhook signature verification is enabled
- [ ] HTTPS is enforced for webhook endpoint
- [ ] Rate limiting is configured
- [ ] Error handling doesn't expose sensitive data

---

## API Reference

### Create Checkout Session
```http
POST /api/v1/stripe/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "tier": "premium",     // basic, premium, ultimate
  "interval": "monthly"  // monthly, yearly
}

Response:
{
  "success": true,
  "data": {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/..."
  }
}
```

### Get Subscription Status
```http
GET /api/v1/stripe/subscription
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "tier": "premium",
    "status": "active",
    "currentPeriodEnd": "2024-02-01T00:00:00Z",
    "cancelAtPeriodEnd": false
  }
}
```

### Cancel Subscription
```http
POST /api/v1/stripe/subscription/cancel
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": { "success": true }
}
```

### Create Customer Portal
```http
POST /api/v1/stripe/portal
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/..."
  }
}
```

---

## Troubleshooting

### Webhook Not Receiving Events
1. Check webhook endpoint URL is correct
2. Verify webhook signing secret matches
3. Ensure server is running and accessible
4. Check firewall/network settings

### Payment Failing
1. Verify API keys are correct
2. Check price IDs exist and are active
3. Ensure customer email is valid
4. Check Stripe Dashboard for error details

### Subscription Not Updating in Database
1. Verify webhook is configured correctly
2. Check server logs for errors
3. Ensure database migrations are run
4. Verify Supabase connection

---

## Support

For Stripe-specific issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For AIDE+ issues:
- Check server logs
- Review database state
- Contact development team
