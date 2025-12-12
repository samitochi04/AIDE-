import OpenAI from 'openai';
import { openaiConfig } from '../config/openai.js';
import { supabaseAdmin } from '../config/supabase.js';
import {
  chatConversationRepository,
  chatMessageRepository,
} from '../repositories/index.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

const openai = new OpenAI({ apiKey: openaiConfig.apiKey });

/**
 * System prompt for the AIDE+ AI assistant
 */
const SYSTEM_PROMPT = `You are AIDE+, the official AI Assistant of the AIDE+ platform - a comprehensive guide for people in France, especially foreigners and newcomers navigating French administrative systems.

## Your Identity
- Name: AIDE+ AI Assistant
- You ONLY answer questions related to what AIDE+ offers:
  • Government aids and social benefits (CAF, APL, RSA, Prime d'activité, etc.)
  • Administrative procedures (visa, residence permits, OFII, CPAM, etc.)
  • Housing and rental assistance (platforms, guarantors, tenant rights)
  • Student and worker-specific procedures in France
- For ANY question outside these topics, politely redirect the user: "I'm the AIDE+ assistant and I specialize in French administrative help, benefits, and housing. For other topics, I recommend consulting a relevant service."

## Response Guidelines
1. **Language**: Respond in the same language the user uses (French or English)
2. **Accuracy**: Always cite sources from the knowledge base when available
3. **Official Links**: Prioritize official URLs (service-public.fr, caf.fr, ameli.fr, etc.)
4. **Uncertainty**: If unsure, clearly state it and recommend official sources
5. **Personalization**: Use the user's profile data (region, status, nationality) to personalize responses
6. **Empathy**: Be patient and understanding - many users are new to the French system
7. **No Legal Advice**: For complex legal matters, recommend consulting a professional

## Knowledge Priority
1. First: User's profile and saved data (simulations, procedures, saved aides)
2. Second: AIDE+ internal database (gov_aides, procedures, housing platforms)
3. Third: Official government websites (always share URLs when relevant)

## Format
- Use bullet points for lists
- Bold important terms (**term**)
- Keep responses concise but complete
- Include relevant links when available`;

/**
 * AI Chat Service with RAG capabilities
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
      return null;
    }
  }

  /**
   * Get user's profile information for context
   */
  async getUserContext(userId) {
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, status, nationality, region, department, city, language')
        .eq('id', userId)
        .single();

      if (!profile) return null;

      return {
        name: profile.full_name,
        status: profile.status,
        nationality: profile.nationality,
        region: profile.region,
        department: profile.department,
        city: profile.city,
        language: profile.language,
      };
    } catch (error) {
      logger.error('Failed to get user context', { userId, error: error.message });
      return null;
    }
  }

  /**
   * Get user's latest simulation results
   */
  async getUserSimulation(userId) {
    try {
      const { data } = await supabaseAdmin
        .from('simulations')
        .select('results, user_type, situation, eligible_aides_count, total_monthly')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user's saved aides
   */
  async getUserSavedAides(userId) {
    try {
      const { data } = await supabaseAdmin
        .from('saved_aides')
        .select('aide_id, aide_name, aide_category, status, monthly_amount')
        .eq('user_id', userId)
        .limit(10);

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get user's procedures
   */
  async getUserProcedures(userId) {
    try {
      const { data } = await supabaseAdmin
        .from('user_procedures')
        .select('procedure_name, procedure_type, status, current_step, total_steps, provider')
        .eq('user_id', userId)
        .limit(10);

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Search government aides database
   */
  async searchGovAides(query, options = {}) {
    const { region, nationality, limit = 5 } = options;

    try {
      let dbQuery = supabaseAdmin
        .from('gov_aides')
        .select('aide_id, aide_name, aide_description, aide_category, region_name, profile_type, source_url, aide_data')
        .textSearch('content_text', query, { type: 'websearch', config: 'french' })
        .limit(limit);

      if (region) {
        dbQuery = dbQuery.eq('region_id', region);
      }

      if (nationality) {
        dbQuery = dbQuery.or(`profile_type.eq.${nationality},profile_type.eq.all`);
      }

      const { data, error } = await dbQuery;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Gov aides search error', { error: error.message });
      return [];
    }
  }

  /**
   * Search procedures database
   */
  async searchProcedures(query, options = {}) {
    const { category, limit = 5 } = options;

    try {
      let dbQuery = supabaseAdmin
        .from('procedures')
        .select('procedure_id, procedure_name, procedure_description, category, subcategory, section, source_url, procedure_data')
        .textSearch('content_text', query, { type: 'websearch', config: 'french' })
        .limit(limit);

      if (category) {
        dbQuery = dbQuery.eq('category', category);
      }

      const { data, error } = await dbQuery;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Procedures search error', { error: error.message });
      return [];
    }
  }

  /**
   * Search housing/renting database
   */
  async searchHousing(query, options = {}) {
    const { category, limit = 5 } = options;

    try {
      let dbQuery = supabaseAdmin
        .from('renting')
        .select('platform_id, platform_name, platform_description, platform_url, category, platform_data')
        .textSearch('content_text', query, { type: 'websearch', config: 'french' })
        .limit(limit);

      if (category) {
        dbQuery = dbQuery.eq('category', category);
      }

      const { data, error } = await dbQuery;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Housing search error', { error: error.message });
      return [];
    }
  }

  /**
   * Determine query category and search appropriate databases
   */
  async searchKnowledgeBase(query, userContext = {}) {
    const lowerQuery = query.toLowerCase();
    const results = {
      govAides: [],
      procedures: [],
      housing: [],
    };

    // Keywords for each category
    const aideKeywords = ['aide', 'apl', 'caf', 'rsa', 'prime', 'allocation', 'bourse', 'benefit', 'social', 'aide sociale', 'eligibility', 'éligibilité'];
    const procedureKeywords = ['visa', 'titre', 'séjour', 'residence', 'ofii', 'cpam', 'carte vitale', 'registration', 'procedure', 'démarche', 'document', 'how to', 'comment'];
    const housingKeywords = ['logement', 'housing', 'apartment', 'appartement', 'rent', 'location', 'louer', 'leboncoin', 'seloger', 'guarantor', 'garant', 'bail'];

    const searchOptions = {
      region: userContext.region,
      nationality: userContext.nationality,
    };

    // Search relevant databases based on keywords
    const hasAideKeyword = aideKeywords.some(k => lowerQuery.includes(k));
    const hasProcedureKeyword = procedureKeywords.some(k => lowerQuery.includes(k));
    const hasHousingKeyword = housingKeywords.some(k => lowerQuery.includes(k));

    const searchPromises = [];

    if (hasAideKeyword || (!hasProcedureKeyword && !hasHousingKeyword)) {
      searchPromises.push(
        this.searchGovAides(query, searchOptions).then(data => { results.govAides = data; })
      );
    }

    if (hasProcedureKeyword || (!hasAideKeyword && !hasHousingKeyword)) {
      searchPromises.push(
        this.searchProcedures(query, { category: userContext.status === 'student' ? 'students' : null }).then(data => { results.procedures = data; })
      );
    }

    if (hasHousingKeyword || (!hasAideKeyword && !hasProcedureKeyword)) {
      searchPromises.push(
        this.searchHousing(query, {}).then(data => { results.housing = data; })
      );
    }

    await Promise.all(searchPromises);

    return results;
  }

  /**
   * Build context from all sources
   */
  buildFullContext(userContext, simulation, savedAides, userProcedures, kbResults) {
    let context = '';

    // User profile context
    if (userContext) {
      context += `\n\n## User Profile\n`;
      if (userContext.name) context += `- Name: ${userContext.name}\n`;
      if (userContext.status) context += `- Status: ${userContext.status}\n`;
      if (userContext.nationality) context += `- Nationality: ${userContext.nationality}\n`;
      if (userContext.region) context += `- Region: ${userContext.region}\n`;
      if (userContext.city) context += `- City: ${userContext.city}\n`;
    }

    // Simulation results
    if (simulation?.results?.eligible) {
      context += `\n\n## User's Simulation Results\n`;
      context += `- User type: ${simulation.user_type}\n`;
      context += `- Eligible aides: ${simulation.eligible_aides_count}\n`;
      context += `- Total monthly potential: €${simulation.total_monthly || 0}\n`;
      context += `- Eligible aides list:\n`;
      simulation.results.eligible.slice(0, 5).forEach(aide => {
        context += `  • ${aide.name}: €${aide.amount?.monthly || 'varies'}/month\n`;
      });
    }

    // Saved aides
    if (savedAides?.length > 0) {
      context += `\n\n## User's Saved Aides\n`;
      savedAides.forEach(aide => {
        context += `- ${aide.aide_name} (${aide.aide_category}): Status ${aide.status}, €${aide.monthly_amount || 'N/A'}/month\n`;
      });
    }

    // User procedures
    if (userProcedures?.length > 0) {
      context += `\n\n## User's Procedures in Progress\n`;
      userProcedures.forEach(proc => {
        context += `- ${proc.procedure_name} (${proc.provider || proc.procedure_type}): ${proc.status}, Step ${proc.current_step}/${proc.total_steps}\n`;
      });
    }

    // Knowledge base results
    if (kbResults.govAides?.length > 0) {
      context += `\n\n## Relevant Government Aides from Database\n`;
      kbResults.govAides.forEach((aide, i) => {
        context += `[Aide ${i + 1}] ${aide.aide_name}\n`;
        context += `- Region: ${aide.region_name || 'National'}\n`;
        context += `- Category: ${aide.aide_category || 'General'}\n`;
        context += `- Target: ${aide.profile_type}\n`;
        context += `- Description: ${aide.aide_description?.slice(0, 200) || 'N/A'}...\n`;
        if (aide.source_url) context += `- Official URL: ${aide.source_url}\n`;
        context += '\n';
      });
    }

    if (kbResults.procedures?.length > 0) {
      context += `\n\n## Relevant Procedures from Database\n`;
      kbResults.procedures.forEach((proc, i) => {
        context += `[Procedure ${i + 1}] ${proc.procedure_name}\n`;
        context += `- Category: ${proc.category} - ${proc.subcategory}\n`;
        context += `- Section: ${proc.section}\n`;
        context += `- Description: ${proc.procedure_description?.slice(0, 200) || 'N/A'}...\n`;
        if (proc.source_url) context += `- Official URL: ${proc.source_url}\n`;
        context += '\n';
      });
    }

    if (kbResults.housing?.length > 0) {
      context += `\n\n## Relevant Housing Platforms from Database\n`;
      kbResults.housing.forEach((platform, i) => {
        context += `[Platform ${i + 1}] ${platform.platform_name}\n`;
        context += `- Category: ${platform.category}\n`;
        context += `- Description: ${platform.platform_description?.slice(0, 200) || 'N/A'}...\n`;
        if (platform.platform_url) context += `- Website: ${platform.platform_url}\n`;
        context += '\n';
      });
    }

    return context;
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

    try {
      const conversation = await chatConversationRepository.create({
        user_id: userId,
        title: 'New conversation',
      });
      return conversation;
    } catch (error) {
      logger.error('Failed to create conversation', { userId, error: error.message });
      throw new AppError('Failed to create conversation', 500);
    }
  }

  /**
   * Get conversation history - increased limit for premium
   */
  async getConversationHistory(conversationId, limit = 50) {
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
  async saveMessage(conversationId, userId, role, content, extras = {}) {
    try {
      await chatMessageRepository.create({
        conversation_id: conversationId,
        role,
        content,
        model: extras.model || null,
        tokens_used: extras.tokens_used || null,
        rag_sources: extras.rag_sources || null,
      });
    } catch (error) {
      logger.error('Failed to save message', { conversationId, error: error.message });
    }
  }

  /**
   * Main chat function with full RAG
   */
  async chat(userId, message, options = {}) {
    const { conversationId, tier = 'premium' } = options; // Default to premium for testing

    // Get or create conversation
    const conversation = await this.getOrCreateConversation(userId, conversationId);

    // Get conversation history (large context for premium)
    const historyLimit = 50; // Premium limit
    const history = await this.getConversationHistory(conversation.id, historyLimit);

    // Get user context from profile
    const userContext = await this.getUserContext(userId);

    // Get user's simulation, saved aides, and procedures
    const [simulation, savedAides, userProcedures] = await Promise.all([
      this.getUserSimulation(userId),
      this.getUserSavedAides(userId),
      this.getUserProcedures(userId),
    ]);

    // Search knowledge base for relevant context
    const kbResults = await this.searchKnowledgeBase(message, userContext || {});

    // Build full context
    const fullContext = this.buildFullContext(
      userContext,
      simulation,
      savedAides,
      userProcedures,
      kbResults
    );

    // Build messages array
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + fullContext,
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
      kb_results: {
        govAides: kbResults.govAides?.length || 0,
        procedures: kbResults.procedures?.length || 0,
        housing: kbResults.housing?.length || 0,
      },
    });

    try {
      // Call OpenAI
      const completion = await openai.chat.completions.create({
        model: openaiConfig.chatModel,
        messages,
        max_tokens: 4000, // Premium limit
        temperature: 0.7,
      });

      const assistantMessage = completion.choices[0].message.content;

      // Save assistant response
      await this.saveMessage(conversation.id, userId, 'assistant', assistantMessage, {
        model: openaiConfig.chatModel,
        tokens_used: completion.usage?.total_tokens,
      });

      // Update conversation title if it's the first message
      if (history.length === 0) {
        const title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
        await chatConversationRepository.updateTitle(conversation.id, title);
      }

      return {
        message: assistantMessage,
        conversationId: conversation.id,
        sources: {
          govAides: kbResults.govAides?.length || 0,
          procedures: kbResults.procedures?.length || 0,
          housing: kbResults.housing?.length || 0,
        },
      };
    } catch (error) {
      logger.error('OpenAI API error', { userId, error: error.message });
      throw new AppError('Failed to generate response. Please try again.', 500);
    }
  }

  /**
   * Stream chat response with full RAG
   */
  async chatStream(userId, message, options = {}) {
    const { conversationId, tier = 'premium' } = options;

    // Get or create conversation
    const conversation = await this.getOrCreateConversation(userId, conversationId);

    // Get conversation history (large context for premium)
    const historyLimit = 50;
    const history = await this.getConversationHistory(conversation.id, historyLimit);

    // Get user context
    const userContext = await this.getUserContext(userId);

    // Get user's data
    const [simulation, savedAides, userProcedures] = await Promise.all([
      this.getUserSimulation(userId),
      this.getUserSavedAides(userId),
      this.getUserProcedures(userId),
    ]);

    // Search knowledge base
    const kbResults = await this.searchKnowledgeBase(message, userContext || {});

    // Build full context
    const fullContext = this.buildFullContext(
      userContext,
      simulation,
      savedAides,
      userProcedures,
      kbResults
    );

    // Build messages
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + fullContext },
      ...history.map((msg) => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: message },
    ];

    // Save user message
    await this.saveMessage(conversation.id, userId, 'user', message, {
      rag_sources: {
        govAides: kbResults.govAides?.length || 0,
        procedures: kbResults.procedures?.length || 0,
        housing: kbResults.housing?.length || 0,
      },
    });

    // Create streaming completion
    const stream = await openai.chat.completions.create({
      model: openaiConfig.chatModel,
      messages,
      max_tokens: 4000,
      temperature: 0.7,
      stream: true,
    });

    return {
      stream,
      conversationId: conversation.id,
      onComplete: async (fullResponse) => {
        // Save complete response when streaming is done
        await this.saveMessage(conversation.id, userId, 'assistant', fullResponse, {
          model: openaiConfig.chatModel,
        });

        // Update title if first message
        if (history.length === 0) {
          const title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
          await chatConversationRepository.updateTitle(conversation.id, title);
        }
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
  async getUsage(userId, tier = 'premium') {
    return {
      tier,
      unlimited: true, // For testing - premium mode
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
