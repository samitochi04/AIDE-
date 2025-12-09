import { Router } from 'express';
import * as contactController from '../controllers/contact.controller.js';
import { validateBody, schemas, authLimiter } from '../middlewares/index.js';

const router = Router();

/**
 * @route   POST /contact
 * @desc    Submit contact form (sends email to support)
 * @access  Public
 */
router.post(
  '/',
  authLimiter,
  validateBody(schemas.contactForm),
  contactController.submitContact
);

/**
 * @route   POST /contact/feedback
 * @desc    Submit general feedback
 * @access  Public
 */
router.post(
  '/feedback',
  authLimiter,
  contactController.submitFeedback
);

export default router;
