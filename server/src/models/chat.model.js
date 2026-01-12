import Joi from 'joi';

/**
 * Chat/AI validation schemas
 */

// Chat message input schema
export const chatMessageSchema = Joi.object({
  message: Joi.string().min(1).max(4000).required(),
  conversationId: Joi.string().uuid().allow(null),
  context: Joi.object({
    region: Joi.string().max(100),
    category: Joi.string().max(100),
    aideId: Joi.string().uuid(),
  }).allow(null),
});

// Conversation schema
export const conversationSchema = Joi.object({
  id: Joi.string().uuid(),
  user_id: Joi.string().uuid().required(),
  title: Joi.string().max(255).default('Nouvelle conversation'),
  metadata: Joi.object(),
  created_at: Joi.date(),
  updated_at: Joi.date(),
});

// Message schema (stored in DB)
export const messageSchema = Joi.object({
  id: Joi.string().uuid(),
  conversation_id: Joi.string().uuid().required(),
  user_id: Joi.string().uuid().required(),
  role: Joi.string().valid('user', 'assistant', 'system').required(),
  content: Joi.string().required(),
  metadata: Joi.object({
    model: Joi.string(),
    tokens: Joi.number().integer(),
    kb_results: Joi.array().items(Joi.string().uuid()),
    feedback: Joi.object({
      rating: Joi.number().integer().min(1).max(5),
      comment: Joi.string().max(1000),
    }),
  }),
  created_at: Joi.date(),
});

// Chat feedback schema
export const chatFeedbackSchema = Joi.object({
  messageId: Joi.string().uuid().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).allow('', null),
});

// AI usage stats schema
export const aiUsageSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  tier: Joi.string().valid('free', 'basic', 'plus', 'premium').required(),
  used: Joi.number().integer().min(0).required(),
  limit: Joi.number().integer().min(0).required(),
  remaining: Joi.number().integer().min(0).required(),
  periodStart: Joi.date(),
  periodEnd: Joi.date(),
});

export default {
  chatMessageSchema,
  conversationSchema,
  messageSchema,
  chatFeedbackSchema,
  aiUsageSchema,
};
