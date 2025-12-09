import { emailService } from '../services/email.service.js';
import { formatResponse } from '../utils/helpers.js';
import logger from '../utils/logger.js';

/**
 * Submit contact form
 */
export const submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message, category } = req.body;

    // Send confirmation to user
    await emailService.sendContactConfirmation(email, {
      name,
      subject,
      message,
    });

    // Send notification to support team
    await emailService.sendSupportNotification({
      name,
      email,
      subject,
      message,
      category,
    });

    logger.info('Contact form submitted', { email, category });

    res.json(
      formatResponse({
        message: 'Your message has been sent. We will respond shortly.',
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Submit general feedback
 */
export const submitFeedback = async (req, res, next) => {
  try {
    const { email, feedback, rating } = req.body;

    // Send to support as feedback
    await emailService.sendSupportNotification({
      name: 'Anonymous User',
      email: email || 'no-email@provided.com',
      subject: `Feedback (Rating: ${rating}/5)`,
      message: feedback,
      category: 'feedback',
    });

    logger.info('Feedback submitted', { rating });

    res.json(
      formatResponse({
        message: 'Thank you for your feedback!',
      })
    );
  } catch (error) {
    next(error);
  }
};
