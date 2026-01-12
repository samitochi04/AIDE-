import { aiService } from '../services/ai.service.js';
import { subscriptionService } from '../services/subscription.service.js';
import { formatResponse } from '../utils/helpers.js';
import { AppError } from '../utils/errors.js';

/**
 * Chat with AI assistant
 */
export const chat = async (req, res, next) => {
  try {
    const { message, conversationId, context } = req.body;
    const userId = req.user.id;

    // Check if user can send AI message
    const limitCheck = await subscriptionService.canSendAIMessage(userId);
    if (!limitCheck.allowed) {
      return res.status(403).json(formatResponse({
        error: 'limit_exceeded',
        ...limitCheck,
        upgradeUrl: '/pricing',
      }, limitCheck.message));
    }

    const tier = limitCheck.tier;

    const result = await aiService.chat(userId, message, {
      conversationId,
      context,
      tier,
    });

    // Include remaining messages in response
    res.json(formatResponse({
      ...result,
      usage: {
        remaining: limitCheck.remaining - 1,
        limit: limitCheck.limit,
        tier,
      },
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Chat with streaming response
 */
export const chatStream = async (req, res, next) => {
  try {
    const { message, conversationId, context } = req.body;
    const userId = req.user.id;

    // Check if user can send AI message
    const limitCheck = await subscriptionService.canSendAIMessage(userId);
    if (!limitCheck.allowed) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.write(`data: ${JSON.stringify({ 
        error: 'limit_exceeded',
        ...limitCheck,
        upgradeUrl: '/pricing',
      })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const tier = limitCheck.tier;

    const { stream, conversationId: convId, onComplete } = await aiService.chatStream(
      userId,
      message,
      { conversationId, context, tier }
    );

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';

    // Stream the response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content, conversationId: convId })}\n\n`);
      }
    }

    // Save complete response
    await onComplete(fullResponse);

    // Send usage info and end signal
    res.write(`data: ${JSON.stringify({ 
      usage: { 
        remaining: limitCheck.remaining - 1, 
        limit: limitCheck.limit,
        tier 
      } 
    })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's conversations
 */
export const getConversations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await aiService.getConversations(req.user.id, parseInt(page), parseInt(limit));
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages in a conversation
 */
export const getConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const result = await aiService.getConversationMessages(
      req.user.id,
      conversationId,
      parseInt(page),
      parseInt(limit)
    );

    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const result = await aiService.deleteConversation(req.user.id, conversationId);
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

/**
 * Get AI usage stats
 */
export const getUsage = async (req, res, next) => {
  try {
    const tier = req.subscription?.tier || 'free';
    const result = await aiService.getUsage(req.user.id, tier);
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};

/**
 * Submit feedback on AI response
 */
export const submitFeedback = async (req, res, next) => {
  try {
    const { messageId, rating, comment } = req.body;
    const result = await aiService.submitFeedback(req.user.id, messageId, rating, comment);
    res.json(formatResponse(result));
  } catch (error) {
    next(error);
  }
};
