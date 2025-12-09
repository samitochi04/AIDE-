import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
import {
  authenticate,
  requireSubscription,
  validateBody,
  schemas,
  chatLimiter,
} from '../middlewares/index.js';

const router = Router();

/**
 * @route   POST /ai/chat
 * @desc    Send a message to AI assistant (RAG-powered)
 * @access  Private (requires subscription for full access)
 */
router.post(
  '/chat',
  authenticate,
  chatLimiter,
  requireSubscription(['free', 'basic', 'plus', 'premium']),
  validateBody(schemas.chatMessage),
  aiController.chat
);

/**
 * @route   POST /ai/chat/stream
 * @desc    Send a message to AI assistant with streaming response
 * @access  Private (requires subscription for full access)
 */
router.post(
  '/chat/stream',
  authenticate,
  chatLimiter,
  requireSubscription(['basic', 'plus', 'premium']),
  validateBody(schemas.chatMessage),
  aiController.chatStream
);

/**
 * @route   GET /ai/conversations
 * @desc    Get user's chat conversations
 * @access  Private
 */
router.get('/conversations', authenticate, aiController.getConversations);

/**
 * @route   GET /ai/conversations/:conversationId
 * @desc    Get messages in a specific conversation
 * @access  Private
 */
router.get(
  '/conversations/:conversationId',
  authenticate,
  aiController.getConversationMessages
);

/**
 * @route   DELETE /ai/conversations/:conversationId
 * @desc    Delete a conversation
 * @access  Private
 */
router.delete(
  '/conversations/:conversationId',
  authenticate,
  aiController.deleteConversation
);

/**
 * @route   GET /ai/usage
 * @desc    Get user's AI usage stats (message count, limits)
 * @access  Private
 */
router.get('/usage', authenticate, aiController.getUsage);

/**
 * @route   POST /ai/feedback
 * @desc    Submit feedback on an AI response
 * @access  Private
 */
router.post('/feedback', authenticate, aiController.submitFeedback);

export default router;
