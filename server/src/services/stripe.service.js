import Stripe from 'stripe';
import { stripeConfig, getPriceToTier, getTierToPrice } from '../config/stripe.js';
import { userRepository, subscriptionRepository, paymentRepository } from '../repositories/index.js';
import { emailService } from './email.service.js';
import { affiliateService } from './affiliate.service.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import { SUBSCRIPTION_TIERS, TIER_LIMITS, SUBSCRIPTION_PRICING } from '../utils/constants.js';
import { APP_CONFIG } from '../config/index.js';
import { supabaseAdmin } from '../config/supabase.js';

const stripe = new Stripe(stripeConfig.secretKey);

/**
 * Stripe Service
 */
class StripeService {
  /**
   * Get or create Stripe customer for a user
   */
  async getOrCreateCustomer(userId, email, name) {
    // Check if user already has a Stripe customer ID
    const profile = await userRepository.findById(userId);

    if (!profile) {
      throw new AppError('User not found', 404);
    }

    if (profile.stripe_customer_id) {
      return profile.stripe_customer_id;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { userId },
    });

    // Save customer ID to profile
    await userRepository.updateStripeCustomerId(userId, customer.id);

    // Also create entry in stripe_customers table for foreign key reference
    const { error: customerError } = await supabaseAdmin
      .from('stripe_customers')
      .upsert({
        user_id: userId,
        stripe_customer_id: customer.id,
        currency: 'eur',
      }, { onConflict: 'user_id' });

    if (customerError) {
      logger.error('Failed to create stripe_customers record', { error: customerError.message });
    }

    logger.info('Created Stripe customer', { userId, customerId: customer.id });
    return customer.id;
  }

  /**
   * Create checkout session for subscription
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {string} tier - Subscription tier (basic, premium, ultimate)
   * @param {string} interval - Billing interval (monthly, yearly)
   */
  async createCheckoutSession(userId, email, name, tier, interval = 'monthly') {
    const priceId = getTierToPrice(tier, interval);
    if (!priceId) {
      throw new AppError(`Invalid subscription tier or interval: ${tier}/${interval}`, 400);
    }

    const customerId = await this.getOrCreateCustomer(userId, email, name);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_CONFIG.frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_CONFIG.frontendUrl}/checkout/cancel`,
      metadata: { userId, tier, interval },
      subscription_data: { metadata: { userId, tier, interval } },
      allow_promotion_codes: true,
    });

    logger.info('Created checkout session', { userId, tier, interval, sessionId: session.id });
    return session;
  }

  /**
   * Create customer portal session for managing subscription
   */
  async createPortalSession(userId) {
    const profile = await userRepository.findById(userId);

    if (!profile?.stripe_customer_id) {
      throw new AppError('No subscription found', 400);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${APP_CONFIG.frontendUrl}/dashboard`,
    });

    return session;
  }

  /**
   * Get subscription status for a user
   */
  async getSubscriptionStatus(userId) {
    const subscription = await subscriptionRepository.findActiveByUserId(userId);

    if (!subscription) {
      return {
        tier: 'free',
        status: 'none',
        features: SUBSCRIPTION_TIERS.free,
      };
    }

    return {
      tier: subscription.tier,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      features: SUBSCRIPTION_TIERS[subscription.tier] || SUBSCRIPTION_TIERS.free,
    };
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(userId) {
    const subscription = await subscriptionRepository.findActiveByUserId(userId);

    if (!subscription?.stripe_subscription_id) {
      throw new AppError('No active subscription found', 400);
    }

    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Update local record
    await subscriptionRepository.markForCancellation(subscription.id);

    logger.info('Subscription cancelled', { userId });
    return { success: true };
  }

  /**
   * Resume cancelled subscription
   */
  async resumeSubscription(userId) {
    const subscription = await subscriptionRepository.findCancelPendingByUserId(userId);

    if (!subscription?.stripe_subscription_id) {
      throw new AppError('No cancelled subscription found', 400);
    }

    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    // Update local record
    await subscriptionRepository.resumeSubscription(subscription.id);

    logger.info('Subscription resumed', { userId });
    return { success: true };
  }

  /**
   * Get available prices
   */
  async getPrices() {
    const prices = await stripe.prices.list({
      active: true,
      product: stripeConfig.productId,
      expand: ['data.product'],
    });

    return prices.data.map((price) => {
      const tier = getPriceToTier(price.id);
      return {
        id: price.id,
        tier,
        amount: price.unit_amount / 100,
        currency: price.currency,
        interval: price.recurring?.interval,
        features: TIER_LIMITS[tier] || {},
        pricing: SUBSCRIPTION_PRICING[tier] || {},
      };
    });
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(payload, signature) {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        stripeConfig.webhookSecret
      );
    } catch (err) {
      logger.error('Webhook signature verification failed', { error: err.message });
      throw new AppError('Webhook signature verification failed', 400);
    }

    logger.info('Processing Stripe webhook', { type: event.type });

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;

      default:
        logger.info('Unhandled webhook event type', { type: event.type });
    }

    return { received: true };
  }

  /**
   * Handle checkout session completed
   */
  async handleCheckoutCompleted(session) {
    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier;

    if (!userId) {
      logger.warn('Checkout completed without userId', { sessionId: session.id });
      return;
    }

    logger.info('Checkout completed', { userId, tier });
    // Subscription will be created/updated via subscription webhook
  }

  /**
   * Handle subscription created or updated
   */
  async handleSubscriptionUpdated(subscription) {
    let userId = subscription.metadata?.userId;
    const priceId = subscription.items.data[0]?.price.id;
    const tier = getPriceToTier(priceId);
    const interval = subscription.metadata?.interval || 
      (subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly');

    if (!userId) {
      // Try to find user by customer ID
      const profile = await userRepository.findByStripeCustomerId(subscription.customer);

      if (!profile) {
        logger.warn('Subscription updated without userId', { subscriptionId: subscription.id });
        return;
      }
      userId = profile.id;
    }

    // Ensure stripe_customers entry exists (for foreign key constraint)
    const { error: customerError } = await supabaseAdmin
      .from('stripe_customers')
      .upsert({
        user_id: userId,
        stripe_customer_id: subscription.customer,
        currency: 'eur',
      }, { onConflict: 'stripe_customer_id' });

    if (customerError) {
      logger.error('Failed to ensure stripe_customers record', { error: customerError.message });
    }

    const subscriptionData = {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      stripe_price_id: priceId,
      tier: tier || 'basic',
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    };

    // Upsert subscription
    try {
      await subscriptionRepository.upsertByStripeId(subscriptionData);
    } catch (error) {
      logger.error('Failed to update subscription', { error: error.message });
      return;
    }

    // Update user profile tier
    await userRepository.updateSubscriptionTier(userId, tier || 'basic');

    logger.info('Subscription updated', { userId, tier, interval, status: subscription.status });

    // Send confirmation email for new active subscriptions
    if (subscription.status === 'active') {
      const profile = await userRepository.findById(userId);
      const planName = tier?.charAt(0).toUpperCase() + tier?.slice(1) || 'Basic';
      const price = subscription.items.data[0]?.price.unit_amount / 100;
      const nextBillingDate = new Date(subscription.current_period_end * 1000).toLocaleDateString('fr-FR');
      const tierInfo = TIER_LIMITS[tier] || TIER_LIMITS.basic;

      if (profile?.email) {
        // Send subscription welcome email to user
        await emailService.sendSubscriptionWelcome(profile.email, {
          planName,
          price,
          interval,
          nextBillingDate,
          features: tierInfo.features || [],
        }).catch(err => logger.error('Failed to send subscription welcome email', { error: err.message }));

        // Send admin notification for new subscription
        await emailService.sendAdminNewSubscription({
          userName: profile.full_name || 'Utilisateur',
          userEmail: profile.email,
          planName,
          price,
          interval,
        }).catch(err => logger.error('Failed to send admin subscription notification', { error: err.message }));
      }

      // Process affiliate commission if user was referred
      await affiliateService.processSubscriptionCommission(userId, tier || 'basic')
        .catch(err => logger.error('Failed to process affiliate commission', { error: err.message }));
    }
  }

  /**
   * Handle subscription deleted
   */
  async handleSubscriptionDeleted(subscription) {
    try {
      await subscriptionRepository.updateStatusByStripeId(subscription.id, 'cancelled');
    } catch (error) {
      logger.error('Failed to mark subscription as cancelled', { error: error.message });
      return;
    }

    // Reset user to free tier
    const sub = await subscriptionRepository.findByStripeSubscriptionId(subscription.id);

    if (sub?.user_id) {
      await userRepository.updateSubscriptionTier(sub.user_id, 'free');
      logger.info('Subscription deleted, user reset to free tier', { userId: sub.user_id });

      // Send cancellation email
      const profile = await userRepository.findById(sub.user_id);
      if (profile?.email) {
        await emailService.sendSubscriptionCancelled(profile.email, {
          planName: sub.tier?.charAt(0).toUpperCase() + sub.tier?.slice(1) || 'Basic',
          endDate: new Date().toLocaleDateString('fr-FR'),
        }).catch(err => logger.error('Failed to send cancellation email', { error: err.message }));
      }
    }
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSucceeded(invoice) {
    logger.info('Payment succeeded', {
      invoiceId: invoice.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
    });

    // Get user_id from subscription
    let userId = null;
    if (invoice.subscription) {
      const sub = await subscriptionRepository.findByStripeSubscriptionId(invoice.subscription);
      userId = sub?.user_id;
    }

    if (!userId) {
      // Try to get from customer
      const profile = await userRepository.findByStripeCustomerId(invoice.customer);
      userId = profile?.id;
    }

    if (!userId) {
      logger.warn('Could not find user for invoice', { invoiceId: invoice.id });
      return;
    }

    // Record payment in database
    await paymentRepository.create({
      user_id: userId,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: invoice.subscription,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: 'paid',
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
      paid_at: invoice.status_transitions?.paid_at 
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() 
        : new Date().toISOString(),
    });
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(invoice) {
    logger.warn('Payment failed', {
      invoiceId: invoice.id,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
    });

    // Get user_id from subscription
    let userId = null;
    if (invoice.subscription) {
      const sub = await subscriptionRepository.findByStripeSubscriptionId(invoice.subscription);
      userId = sub?.user_id;
    }

    if (!userId) {
      // Try to get from customer
      const profile = await userRepository.findByStripeCustomerId(invoice.customer);
      userId = profile?.id;
    }

    if (!userId) {
      logger.warn('Could not find user for failed invoice', { invoiceId: invoice.id });
      return;
    }

    // Record failed payment
    await paymentRepository.create({
      user_id: userId,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: invoice.subscription,
      amount_due: invoice.amount_due,
      amount_paid: 0,
      currency: invoice.currency,
      status: 'failed',
    });

    // Send payment failed notification email
    if (invoice.subscription) {
      const sub = await subscriptionRepository.findByStripeSubscriptionId(invoice.subscription);
      if (sub?.user_id) {
        const profile = await userRepository.findById(sub.user_id);
        if (profile?.email) {
          const retryDate = invoice.next_payment_attempt 
            ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString('fr-FR')
            : 'Dans 3 jours';
          
          await emailService.sendPaymentFailed(profile.email, {
            planName: sub.tier?.charAt(0).toUpperCase() + sub.tier?.slice(1) || 'Basic',
            reason: 'Paiement refusé',
            retryDate,
          }).catch(err => logger.error('Failed to send payment failed email', { error: err.message }));
        }
      }
    }
  }
}

export const stripeService = new StripeService();
export default stripeService;
