import Joi from 'joi';

/**
 * Content validation schemas (Aides, Procedures, etc.)
 */

// Aide schema
export const aideSchema = Joi.object({
  id: Joi.string().uuid(),
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(5000).required(),
  short_description: Joi.string().max(500),
  region: Joi.string().max(100).allow(null), // null = national
  category: Joi.string().max(100),
  subcategory: Joi.string().max(100),
  eligibility: Joi.string().max(2000),
  eligibility_criteria: Joi.object({
    nationality: Joi.array().items(Joi.string()),
    residence_status: Joi.array().items(Joi.string()),
    age_min: Joi.number().integer().min(0),
    age_max: Joi.number().integer().max(150),
    income_max: Joi.number(),
    is_student: Joi.boolean(),
    employment_status: Joi.array().items(Joi.string()),
  }),
  benefits: Joi.string().max(2000),
  how_to_apply: Joi.string().max(2000),
  required_documents: Joi.array().items(Joi.string()),
  official_url: Joi.string().uri().max(500),
  source: Joi.string().max(255),
  tags: Joi.array().items(Joi.string().max(50)),
  is_active: Joi.boolean().default(true),
  view_count: Joi.number().integer().min(0).default(0),
  click_count: Joi.number().integer().min(0).default(0),
  embedding: Joi.array().items(Joi.number()), // vector for RAG
  created_at: Joi.date(),
  updated_at: Joi.date(),
});

// Aide create/update schema
export const aideCreateSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(5000).required(),
  short_description: Joi.string().max(500),
  region: Joi.string().max(100).allow(null, ''),
  category: Joi.string().max(100),
  subcategory: Joi.string().max(100),
  eligibility: Joi.string().max(2000),
  eligibility_criteria: Joi.object(),
  benefits: Joi.string().max(2000),
  how_to_apply: Joi.string().max(2000),
  required_documents: Joi.array().items(Joi.string()),
  official_url: Joi.string().uri().max(500),
  source: Joi.string().max(255),
  tags: Joi.array().items(Joi.string().max(50)),
  is_active: Joi.boolean(),
});

// Procedure schema
export const procedureSchema = Joi.object({
  id: Joi.string().uuid(),
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(5000).required(),
  profile_type: Joi.string().valid(
    'erasmus_student',
    'eu_student',
    'non_eu_student',
    'eu_worker',
    'non_eu_worker'
  ).required(),
  category: Joi.string().max(100),
  steps: Joi.array().items(
    Joi.object({
      order: Joi.number().integer().min(1).required(),
      title: Joi.string().max(255).required(),
      description: Joi.string().max(2000).required(),
      duration: Joi.string().max(100),
      tips: Joi.string().max(1000),
    })
  ),
  required_documents: Joi.array().items(Joi.string()),
  estimated_duration: Joi.string().max(100),
  official_url: Joi.string().uri().max(500),
  tags: Joi.array().items(Joi.string().max(50)),
  is_active: Joi.boolean().default(true),
  created_at: Joi.date(),
  updated_at: Joi.date(),
});

// Renting platform schema
export const rentingSchema = Joi.object({
  id: Joi.string().uuid(),
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(2000).required(),
  category: Joi.string().valid(
    'major_platforms',
    'social_housing',
    'student_housing',
    'temporary_housing',
    'roommates',
    'owner_direct',
    'luxury',
    'relocation',
    'furnished',
    'alerts'
  ).required(),
  url: Joi.string().uri().max(500).required(),
  pros: Joi.array().items(Joi.string().max(200)),
  cons: Joi.array().items(Joi.string().max(200)),
  pricing: Joi.string().max(200),
  target_audience: Joi.array().items(Joi.string()),
  is_active: Joi.boolean().default(true),
  created_at: Joi.date(),
  updated_at: Joi.date(),
});

// Search schema
export const aideSearchSchema = Joi.object({
  query: Joi.string().max(500),
  region: Joi.string().max(100),
  category: Joi.string().max(100),
  eligibility_type: Joi.string(),
  tags: Joi.array().items(Joi.string()),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  sortBy: Joi.string().valid('relevance', 'name', 'created_at', 'view_count'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export default {
  aideSchema,
  aideCreateSchema,
  procedureSchema,
  rentingSchema,
  aideSearchSchema,
};
