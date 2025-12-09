import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Price IDs configuration
export const STRIPE_PRICES = {
  basic: {
    monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY,
    yearly: process.env.STRIPE_PRICE_BASIC_YEARLY,
  },
  premium: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
  },
};

// Map Stripe price IDs to subscription tiers
export const getPriceToTier = (priceId) => {
  const priceToTier = {
    [STRIPE_PRICES.basic.monthly]: 'basic',
    [STRIPE_PRICES.basic.yearly]: 'basic',
    [STRIPE_PRICES.premium.monthly]: 'premium',
    [STRIPE_PRICES.premium.yearly]: 'premium',
  };
  return priceToTier[priceId] || 'free';
};

export default stripe;
