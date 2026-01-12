import { Router } from "express";
import * as contactController from "../controllers/contact.controller.js";
import {
  validateBody,
  schemas,
  authLimiter,
  verifyHcaptcha,
} from "../middlewares/index.js";

const router = Router();

/**
 * @route   POST /contact
 * @desc    Submit contact form (sends email to support)
 * @access  Public
 */
router.post(
  "/",
  authLimiter,
  verifyHcaptcha,
  validateBody(schemas.contactForm),
  contactController.submitContact
);

/**
 * @route   POST /contact/feedback
 * @desc    Submit general feedback
 * @access  Public
 */
router.post(
  "/feedback",
  authLimiter,
  verifyHcaptcha,
  contactController.submitFeedback
);

export default router;
