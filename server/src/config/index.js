// ===========================================
// Configuration Aggregator
// ===========================================

export { supabaseAdmin, createSupabaseClient } from './supabase.js';
export { stripe, stripeConfig, getPriceToTier } from './stripe.js';
export { openai, AI_CONFIG, SYSTEM_PROMPT } from './openai.js';
export { transporter, EMAIL_CONFIG } from './email.js';

// General app configuration
export const APP_CONFIG = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  frontendUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  },
  
  // JWT
  jwtSecret: process.env.JWT_SECRET,
};
