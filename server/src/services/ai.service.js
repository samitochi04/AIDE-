import OpenAI from 'openai';
import { openaiConfig } from '../config/openai.js';
import {
  chatConversationRepository,
  chatMessageRepository,
  knowledgeBaseRepository,
} from '../repositories/index.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import { AI_LIMITS } from '../utils/constants.js';

const openai = new OpenAI({ apiKey: openaiConfig.apiKey });

/**
 * System prompt for the AI assistant
 */
const SYSTEM_PROMPT = `Tu es AIDE+, un assistant virtuel expert des aides et démarches administratives en France.

Tu aides principalement les étrangers et nouveaux arrivants en France à :
- Comprendre les aides sociales auxquelles ils peuvent avoir droit
- Naviguer dans les démarches administratives
- Obtenir des informations sur les procédures d'immigration et de visa
- Trouver des ressources pour la location de logement

Règles importantes :
1. Réponds toujours en français sauf si l'utilisateur te parle en anglais
2. Sois précis et cite tes sources quand tu donnes des informations officielles
3. Si tu n'es pas sûr d'une information, dis-le clairement
4. Oriente vers les sites officiels quand c'est pertinent (service-public.fr, caf.fr, etc.)
5. Sois empathique et patient - beaucoup d'utilisateurs découvrent le système français
6. Ne donne jamais de conseils juridiques définitifs - recommande de consulter un professionnel pour les cas complexes

Tu as accès à une base de connaissances sur les aides par région et les procédures administratives.
Utilise ces informations pour personnaliser tes réponses selon la situation de l'utilisateur.`;

/**
 * AI Chat Service
 */
class AIService {
  /**
   * Generate embeddings for text (for RAG search)
   */
  async generateEmbedding(text) {
    try {
      const response = await openai.embeddings.create({
        model: openaiConfig.embeddingModel,
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      logger.error('Failed to generate embedding', { error: error.message });
      throw new AppError('Failed to generate embedding', 500);
    }
  }

  /**
   * Search knowledge base using embeddings (RAG)
   */
  async searchKnowledgeBase(query, options = {}) {
    const { limit = 5, region = null, category = null } = options;

    try {
      // Generate embedding for the query
      const embedding = await this.generateEmbedding(query);

      // Use repository for semantic search
      const results = await knowledgeBaseRepository.semanticSearch(embedding, {
        limit,
        category,
        threshold: 0.7,
      });

      return results;
    } catch (error) {
      logger.error('Knowledge base search error', { error: error.message });
      return [];
    }
  }

  /**
   * Build context from knowledge base results
   */
  buildContext(results) {
    if (!results || results.length === 0) {
      return '';
    }

    const context = results
      .map((item, index) => {
        return `[Source ${index + 1}] ${item.name || item.title}
Région: ${item.region || 'National'}
Catégorie: ${item.category || 'Général'}
Description: ${item.description || item.content}
Éligibilité: ${item.eligibility || 'Non spécifié'}
URL: ${item.official_url || 'Non disponible'}`;
      })
      .join('\n\n');

    return `\n\nInformations pertinentes de la base de connaissances:\n${context}`;
  }

  /**
   * Check user's AI usage limits
   */
  async checkUsageLimits(userId, tier) {
    const limits = AI_LIMITS[tier] || AI_LIMITS.free;

    // Get usage for current period (month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    try {
      const used = await chatMessageRepository.countUserMessagesInPeriod(
        userId,
        startOfMonth.toISOString()
      );

      const remaining = limits.messagesPerMonth - used;

      return {
        allowed: remaining > 0,
        used,
        remaining: Math.max(0, remaining),
        limit: limits.messagesPerMonth,
      };
    } catch (error) {
      logger.error('Failed to check AI usage', { userId, error: error.message });
      // Allow request if we can't check (fail open)
      return { allowed: true, remaining: limits.messagesPerMonth };
    }
  }

  /**
   * Get or create conversation
   */
  async getOrCreateConversation(userId, conversationId = null) {
    if (conversationId) {
      const conversation = await chatConversationRepository.findByIdAndUser(
        conversationId,
        userId
      );
      if (conversation) {
        return conversation;
      }
    }

    // Create new conversation
    try {
      const conversation = await chatConversationRepository.create({
        user_id: userId,
        title: 'Nouvelle conversation',
      });
      return conversation;
    } catch (error) {
      logger.error('Failed to create conversation', { userId, error: error.message });
      throw new AppError('Failed to create conversation', 500);
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(conversationId, limit = 10) {
    try {
      const messages = await chatMessageRepository.getRecentMessages(conversationId, limit);
      return messages || [];
    } catch (error) {
      logger.error('Failed to get conversation history', { conversationId, error: error.message });
      return [];
    }
  }

  /**
   * Save message to database
   */
  async saveMessage(conversationId, userId, role, content, metadata = {}) {
    try {
      await chatMessageRepository.create({
        conversation_id: conversationId,
        user_id: userId,
        role,
        content,
        metadata,
      });
    } catch (error) {
      logger.error('Failed to save message', { conversationId, error: error.message });
    }
  }

  /**
   * Main chat function
   */
  async chat(userId, message, options = {}) {
    const { conversationId, context, tier = 'free' } = options;

    // Check usage limits
    const usage = await this.checkUsageLimits(userId, tier);
    if (!usage.allowed) {
      throw new AppError(
        `Vous avez atteint votre limite mensuelle de ${usage.limit} messages. Passez à un abonnement supérieur pour continuer.`,
        429
      );
    }

    // Get or create conversation
    const conversation = await this.getOrCreateConversation(userId, conversationId);

    // Get conversation history
    const history = await this.getConversationHistory(conversation.id);

    // Search knowledge base for relevant context
    const kbResults = await this.searchKnowledgeBase(message, {
      region: context?.region,
      category: context?.category,
    });
    const kbContext = this.buildContext(kbResults);

    // Build messages array
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + kbContext,
      },
      ...history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ];

    // Save user message
    await this.saveMessage(conversation.id, userId, 'user', message, {
      kb_results: kbResults.map((r) => r.id),
    });

    try {
      // Call OpenAI
      const completion = await openai.chat.completions.create({
        model: openaiConfig.chatModel,
        messages,
        max_tokens: openaiConfig.maxTokens,
        temperature: openaiConfig.temperature,
      });

      const assistantMessage = completion.choices[0].message.content;

      // Save assistant response
      await this.saveMessage(conversation.id, userId, 'assistant', assistantMessage, {
        model: openaiConfig.chatModel,
        usage: completion.usage,
      });

      // Update conversation title if it's the first message
      if (history.length === 0) {
        const title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
        await chatConversationRepository.updateTitle(conversation.id, title);
      }

      return {
        message: assistantMessage,
        conversationId: conversation.id,
        usage: {
          used: usage.used + 1,
          remaining: usage.remaining - 1,
          limit: usage.limit,
        },
      };
    } catch (error) {
      logger.error('OpenAI API error', { userId, error: error.message });
      throw new AppError('Failed to generate response. Please try again.', 500);
    }
  }

  /**
   * Stream chat response
   */
  async chatStream(userId, message, options = {}) {
    const { conversationId, context, tier = 'basic' } = options;

    // Check usage limits
    const usage = await this.checkUsageLimits(userId, tier);
    if (!usage.allowed) {
      throw new AppError('Monthly message limit reached', 429);
    }

    // Get or create conversation
    const conversation = await this.getOrCreateConversation(userId, conversationId);

    // Get conversation history
    const history = await this.getConversationHistory(conversation.id);

    // Search knowledge base
    const kbResults = await this.searchKnowledgeBase(message, {
      region: context?.region,
      category: context?.category,
    });
    const kbContext = this.buildContext(kbResults);

    // Build messages
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + kbContext },
      ...history.map((msg) => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: message },
    ];

    // Save user message
    await this.saveMessage(conversation.id, userId, 'user', message);

    // Create streaming completion
    const stream = await openai.chat.completions.create({
      model: openaiConfig.chatModel,
      messages,
      max_tokens: openaiConfig.maxTokens,
      temperature: openaiConfig.temperature,
      stream: true,
    });

    return {
      stream,
      conversationId: conversation.id,
      onComplete: async (fullResponse) => {
        // Save complete response when streaming is done
        await this.saveMessage(conversation.id, userId, 'assistant', fullResponse);
      },
    };
  }

  /**
   * Get user's conversations
   */
  async getConversations(userId, page = 1, limit = 20) {
    try {
      const result = await chatConversationRepository.findByUserId(userId, {
        page,
        limit,
        orderBy: 'updated_at',
        ascending: false,
      });
      return result;
    } catch (error) {
      logger.error('Failed to get conversations', { userId, error: error.message });
      throw new AppError('Failed to get conversations', 500);
    }
  }

  /**
   * Get messages in a conversation
   */
  async getConversationMessages(userId, conversationId, page = 1, limit = 50) {
    // Verify conversation belongs to user
    const conversation = await chatConversationRepository.findByIdAndUser(
      conversationId,
      userId
    );

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    try {
      const result = await chatMessageRepository.findByConversationPaginated(
        conversationId,
        { page, limit }
      );
      return result;
    } catch (error) {
      logger.error('Failed to get messages', { conversationId, error: error.message });
      throw new AppError('Failed to get messages', 500);
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(userId, conversationId) {
    // Verify conversation belongs to user
    const conversation = await chatConversationRepository.findByIdAndUser(
      conversationId,
      userId
    );

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    try {
      await chatConversationRepository.delete(conversationId);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete conversation', { conversationId, error: error.message });
      throw new AppError('Failed to delete conversation', 500);
    }
  }

  /**
   * Get user's AI usage stats
   */
  async getUsage(userId, tier = 'free') {
    const usage = await this.checkUsageLimits(userId, tier);
    const limits = AI_LIMITS[tier] || AI_LIMITS.free;

    return {
      ...usage,
      tier,
      features: limits,
    };
  }

  /**
   * Submit feedback on AI response
   */
  async submitFeedback(userId, messageId, rating, comment) {
    try {
      await chatMessageRepository.addFeedback(messageId, userId, { rating, comment });
      return { success: true };
    } catch (error) {
      logger.error('Failed to submit feedback', { messageId, error: error.message });
      throw new AppError('Failed to submit feedback', 500);
    }
  }
}

export const aiService = new AIService();
export default aiService;
