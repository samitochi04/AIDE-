import Joi from 'joi';
import { ValidationError } from '../utils/errors.js';

/**
 * Validate request body against a Joi schema
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    req.body = value;
    next();
  };
};

/**
 * Validate request query parameters
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      throw new ValidationError('Invalid query parameters', errors);
    }

    req.query = value;
    next();
  };
};

/**
 * Validate request params
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      throw new ValidationError('Invalid parameters', errors);
    }

    req.params = value;
    next();
  };
};

// ============================================
// Common validation schemas
// ============================================

export const schemas = {
  // UUID validation
  uuid: Joi.string().uuid({ version: 'uuidv4' }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // Email
  email: Joi.string().email().lowercase().trim(),

  // Password (for validation messages only - actual auth is via Supabase)
  password: Joi.string().min(8).max(128),

  // Language preference
  language: Joi.string().valid('fr', 'en').default('fr'),

  // Stripe webhook
  stripeWebhook: Joi.object({
    type: Joi.string().required(),
    data: Joi.object().required(),
  }),

  // Chat message
  chatMessage: Joi.object({
    message: Joi.string().min(1).max(4000).required(),
    conversationId: Joi.string().uuid().optional(),
    context: Joi.object({
      region: Joi.string(),
      category: Joi.string(),
    }).optional(),
  }),

  // User profile update
  profileUpdate: Joi.object({
    first_name: Joi.string().min(1).max(100).trim(),
    last_name: Joi.string().min(1).max(100).trim(),
    date_of_birth: Joi.date().max('now'),
    nationality: Joi.string().max(100),
    residence_status: Joi.string().valid(
      'french_citizen',
      'eu_citizen',
      'non_eu_with_permit',
      'non_eu_student',
      'refugee',
      'other'
    ),
    region: Joi.string().max(100),
    language_preference: Joi.string().valid('fr', 'en'),
    is_student: Joi.boolean(),
    income_bracket: Joi.string().valid('low', 'medium', 'high'),
    family_situation: Joi.string().valid(
      'single',
      'married',
      'pacs',
      'divorced',
      'widowed'
    ),
    has_children: Joi.boolean(),
    number_of_children: Joi.number().integer().min(0).max(20),
    employment_status: Joi.string().valid(
      'employed',
      'self_employed',
      'unemployed',
      'student',
      'retired',
      'other'
    ),
  }),

  // Affiliate registration
  affiliateRegistration: Joi.object({
    companyName: Joi.string().max(255).allow('', null),
    website: Joi.string().max(500).allow('', null).custom((value, helpers) => {
      // Allow empty string or valid URI
      if (!value || value === '') return value;
      try {
        new URL(value);
        return value;
      } catch {
        return helpers.error('string.uri');
      }
    }),
    contactEmail: Joi.string().email().required(),
    description: Joi.string().max(1000).allow('', null),
  }),

  // Admin - user management
  adminUserUpdate: Joi.object({
    subscription_tier: Joi.string().valid('free', 'basic', 'plus', 'premium'),
    is_active: Joi.boolean(),
    admin_notes: Joi.string().max(1000),
  }),

  // Admin - create admin
  createAdmin: Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid('moderator', 'admin', 'super_admin', 'support').required(),
    permissions: Joi.object({
      manage_users: Joi.boolean(),
      manage_content: Joi.boolean(),
      manage_subscriptions: Joi.boolean(),
      view_analytics: Joi.boolean(),
      manage_affiliates: Joi.boolean(),
      send_bulk_emails: Joi.boolean(),
      manage_settings: Joi.boolean(),
    }),
  }),

  // Contact form
  contactForm: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    email: Joi.string().email().required(),
    subject: Joi.string().min(1).max(200).required(),
    message: Joi.string().min(10).max(5000).required(),
    category: Joi.string().valid('support', 'feedback', 'bug', 'other').default('support'),
  }),

  // Analytics event tracking
  analyticsEvent: Joi.object({
    event_type: Joi.string().required(),
    event_data: Joi.object(),
    page_url: Joi.string().uri(),
    referrer: Joi.string().uri().allow(''),
    session_id: Joi.string(),
  }),

  // Aide search
  aideSearch: Joi.object({
    query: Joi.string().max(500),
    region: Joi.string(),
    category: Joi.string(),
    eligibility_type: Joi.string(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
  }),
};

export default {
  validateBody,
  validateQuery,
  validateParams,
  schemas,
};
