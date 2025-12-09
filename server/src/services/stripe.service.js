import Stripe from 'stripe';
import { stripeConfig } from '../config/stripe.js';
import { userRepository, subscriptionRepository, paymentRepository } from '../repositories/index.js';
import { emailService } from './email.service.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import { SUBSCRIPTION_TIERS } from '../utils/constants.js';
import { APP_CONFIG } from '../config/index.js';

const stripe = new Stripe(stripeConfig.secretKey);

/**
 * Map Stripe price IDs to subscription tiers
 */
const priceToTier = {
  [stripeConfig.prices.basic]: 'basic',
  [stripeConfig.prices.plus]: 'plus',
  [stripeConfig.prices.premium]: 'premium',
};

/**
 * Map subscription tiers to Stripe price IDs
 */
const tierToPrice = {
  basic: stripeConfig.prices.basic,
  plus: stripeConfig.prices.plus,
  premium: stripeConfig.prices.premium,
};

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

    logger.info('Created Stripe customer', { userId, customerId: customer.id });
    return customer.id;
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(userId, email, name, tier) {
    const priceId = tierToPrice[tier];
    if (!priceId) {
      throw new AppError('Invalid subscription tier', 400);
    }

    const customerId = await this.getOrCreateCustomer(userId, email, name);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_CONFIG.frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_CONFIG.frontendUrl}/pricing`,
      metadata: { userId, tier },
      subscription_data: { metadata: { userId, tier } },
      allow_promotion_codes: true,
    });

    logger.info('Created checkout session', { userId, tier, sessionId: session.id });
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

    return prices.data.map((price) => ({
      id: price.id,
      tier: priceToTier[price.id] || 'unknown',
      amount: price.unit_amount / 100,
      currency: price.currency,
      interval: price.recurring?.interval,
      features: SUBSCRIPTION_TIERS[priceToTier[price.id]] || {},
    }));
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
    const tier = priceToTier[subscription.items.data[0]?.price.id];

    if (!userId) {
      // Try to find user by customer ID
      const profile = await userRepository.findByStripeCustomerId(subscription.customer);

      if (!profile) {
        logger.warn('Subscription updated without userId', { subscriptionId: subscription.id });
        return;
      }
      userId = profile.id;
    }

    const subscriptionData = {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
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

    logger.info('Subscription updated', { userId, tier, status: subscription.status });

    // Send confirmation email for new active subscriptions
    if (subscription.status === 'active') {
      const profile = await userRepository.findById(userId);

      if (profile?.email) {
        await emailService.sendSubscriptionConfirmation(profile.email, {
          planName: tier?.charAt(0).toUpperCase() + tier?.slice(1),
          price: subscription.items.data[0]?.price.unit_amount / 100,
          nextBillingDate: new Date(subscription.current_period_end * 1000).toLocaleDateString('fr-FR'),
          features: SUBSCRIPTION_TIERS[tier]?.features || [],
        }).catch(err => logger.error('Failed to send subscription email', { error: err.message }));
      }
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

    // Record payment in database
    await paymentRepository.create({
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: invoice.subscription,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
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

    // Record failed payment
    await paymentRepository.create({
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: invoice.subscription,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
    });

    // TODO: Send payment failed notification email
  }
}

export const stripeService = new StripeService();
export default stripeService;
