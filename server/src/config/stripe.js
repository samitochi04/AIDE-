import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Stripe configuration object
export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  productId: process.env.STRIPE_PRODUCT_ID,
  prices: {
    basic: {
      monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY,
      yearly: process.env.STRIPE_PRICE_BASIC_YEARLY,
    },
    premium: {
      monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
    },
    ultimate: {
      monthly: process.env.STRIPE_PRICE_ULTIMATE_MONTHLY,
      yearly: process.env.STRIPE_PRICE_ULTIMATE_YEARLY,
    },
  },
};

// Map Stripe price IDs to subscription tiers
export const getPriceToTier = (priceId) => {
  const priceToTier = {
    [stripeConfig.prices.basic.monthly]: 'basic',
    [stripeConfig.prices.basic.yearly]: 'basic',
    [stripeConfig.prices.premium.monthly]: 'premium',
    [stripeConfig.prices.premium.yearly]: 'premium',
    [stripeConfig.prices.ultimate.monthly]: 'ultimate',
    [stripeConfig.prices.ultimate.yearly]: 'ultimate',
  };
  return priceToTier[priceId] || 'free';
};

// Map tier + interval to Stripe price ID
export const getTierToPrice = (tier, interval = 'monthly') => {
  return stripeConfig.prices[tier]?.[interval] || null;
};

export default stripe;
