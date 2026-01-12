import { Router } from "express";
import Joi from "joi";
import * as authController from "../controllers/auth.controller.js";
import {
  validateBody,
  schemas,
  authLimiter,
  verifyHcaptcha,
} from "../middlewares/index.js";

const router = Router();

/**
 * @route   POST /auth/send-magic-link
 * @desc    Send magic link for passwordless login
 * @access  Public
 */
router.post(
  "/send-magic-link",
  authLimiter,
  verifyHcaptcha,
  validateBody(
    Joi.object({ email: schemas.email.required(), hcaptchaToken: Joi.string() })
  ),
  authController.sendMagicLink
);

/**
 * @route   POST /auth/send-welcome-email
 * @desc    Send welcome email after signup (called from frontend after Supabase signup)
 * @access  Public
 */
router.post(
  "/send-welcome-email",
  authLimiter,
  verifyHcaptcha,
  validateBody(
    Joi.object({
      email: schemas.email.required(),
      name: Joi.string().max(100),
      hcaptchaToken: Joi.string(),
    })
  ),
  authController.sendWelcomeEmail
);

/**
 * @route   POST /auth/send-password-reset
 * @desc    Send password reset email
 * @access  Public
 */
router.post(
  "/send-password-reset",
  authLimiter,
  verifyHcaptcha,
  validateBody(
    Joi.object({ email: schemas.email.required(), hcaptchaToken: Joi.string() })
  ),
  authController.sendPasswordReset
);

/**
 * @route   POST /auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post(
  "/resend-verification",
  authLimiter,
  verifyHcaptcha,
  validateBody(
    Joi.object({ email: schemas.email.required(), hcaptchaToken: Joi.string() })
  ),
  authController.resendVerification
);

export default router;
