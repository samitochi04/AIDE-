import { emailService } from '../services/email.service.js';
import { supabaseAdmin } from '../config/supabase.js';
import { formatResponse } from '../utils/helpers.js';
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Send magic link for passwordless login
 */
export const sendMagicLink = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Use Supabase to send magic link
    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL}/auth/callback`,
      },
    });

    if (error) {
      logger.error('Failed to send magic link', { email, error: error.message });
      throw new AppError('Failed to send login link', 500);
    }

    res.json(formatResponse({ message: 'Login link sent to your email' }));
  } catch (error) {
    next(error);
  }
};

/**
 * Send welcome email after signup
 */
export const sendWelcomeEmail = async (req, res, next) => {
  try {
    const { email, name, source } = req.body;

    // Send welcome email to user
    await emailService.sendWelcome(email, { name });

    // Send admin notification for new user
    await emailService.sendAdminNewUser({
      name,
      email,
      source: source || 'Direct',
    }).catch(err => logger.error('Failed to send admin new user notification', { error: err.message }));

    res.json(formatResponse({ message: 'Welcome email sent' }));
  } catch (error) {
    next(error);
  }
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Use Supabase to send password reset
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`,
    });

    if (error) {
      logger.error('Failed to send password reset', { email, error: error.message });
      // Don't reveal if email exists
    }

    // Always return success to prevent email enumeration
    res.json(formatResponse({ message: 'If an account exists, a reset link has been sent' }));
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification email
 */
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    const { error } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL}/auth/callback`,
      },
    });

    if (error) {
      logger.error('Failed to resend verification', { email, error: error.message });
    }

    // Always return success to prevent email enumeration
    res.json(formatResponse({ message: 'Verification email sent if account exists' }));
  } catch (error) {
    next(error);
  }
};
