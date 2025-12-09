import Joi from 'joi';

/**
 * User validation schemas
 */

// User registration schema (for validation, actual auth via Supabase)
export const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  first_name: Joi.string().min(1).max(100).trim(),
  last_name: Joi.string().min(1).max(100).trim(),
});

// User profile schema
export const userProfileSchema = Joi.object({
  id: Joi.string().uuid(),
  email: Joi.string().email(),
  first_name: Joi.string().max(100).trim().allow('', null),
  last_name: Joi.string().max(100).trim().allow('', null),
  date_of_birth: Joi.date().max('now').allow(null),
  nationality: Joi.string().max(100).allow('', null),
  residence_status: Joi.string().valid(
    'french_citizen',
    'eu_citizen',
    'non_eu_with_permit',
    'non_eu_student',
    'refugee',
    'other'
  ).allow(null),
  region: Joi.string().max(100).allow('', null),
  language_preference: Joi.string().valid('fr', 'en').default('fr'),
  is_student: Joi.boolean().default(false),
  income_bracket: Joi.string().valid('low', 'medium', 'high').allow(null),
  family_situation: Joi.string().valid(
    'single',
    'married',
    'pacs',
    'divorced',
    'widowed'
  ).allow(null),
  has_children: Joi.boolean().default(false),
  number_of_children: Joi.number().integer().min(0).max(20).default(0),
  employment_status: Joi.string().valid(
    'employed',
    'self_employed',
    'unemployed',
    'student',
    'retired',
    'other'
  ).allow(null),
  subscription_tier: Joi.string().valid('free', 'basic', 'plus', 'premium').default('free'),
  is_active: Joi.boolean().default(true),
  created_at: Joi.date(),
  updated_at: Joi.date(),
});

// User profile update schema (partial)
export const userProfileUpdateSchema = Joi.object({
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
}).min(1); // At least one field required for update

// Admin user schema
export const adminSchema = Joi.object({
  id: Joi.string().uuid(),
  user_id: Joi.string().uuid().required(),
  role: Joi.string().valid('moderator', 'admin', 'super_admin').required(),
  permissions: Joi.object({
    manage_users: Joi.boolean().default(false),
    manage_content: Joi.boolean().default(false),
    manage_subscriptions: Joi.boolean().default(false),
    view_analytics: Joi.boolean().default(true),
    manage_affiliates: Joi.boolean().default(false),
  }),
  created_at: Joi.date(),
});

export default {
  userRegistrationSchema,
  userProfileSchema,
  userProfileUpdateSchema,
  adminSchema,
};
