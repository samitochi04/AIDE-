import { BaseRepository } from './base.repository.js';

/**
 * Chat Repository
 * Handles AI conversations and messages data access
 */
class ChatConversationRepository extends BaseRepository {
  constructor() {
    super('chat_conversations');
  }

  /**
   * Find conversations for a user with pagination
   */
  async findByUserId(userId, options = {}) {
    const { page = 1, limit = 20, orderBy = 'updated_at', ascending = false } = options;
    const offset = (page - 1) * limit;

    const { data, error, count } = await this.db
      .from(this.tableName)
      .select(`
        *,
        message_count:chat_messages(count)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Flatten message_count from array to number
    const conversations = (data || []).map(conv => ({
      ...conv,
      message_count: conv.message_count?.[0]?.count || 0
    }));

    return {
      conversations,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Find conversation by ID and user (ownership check)
   */
  async findByIdAndUser(conversationId, userId) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Update conversation title
   */
  async updateTitle(conversationId, title) {
    return this.update(conversationId, { title });
  }

  /**
   * Get conversation with message count
   */
  async findWithMessageCount(conversationId) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        *,
        message_count:chat_messages(count)
      `)
      .eq('id', conversationId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Count conversations created in period
   */
  async countInPeriod(startDate, endDate) {
    const { count, error } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;
    return count || 0;
  }
}

/**
 * Chat Message Repository
 */
class ChatMessageRepository extends BaseRepository {
  constructor() {
    super('chat_messages');
  }

  /**
   * Find messages in a conversation
   */
  async findByConversation(conversationId, options = {}) {
    const { limit = 50, before } = options;

    let query = this.db
      .from(this.tableName)
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (before) {
      query = query.lt('created_at', before);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get last N messages in a conversation
   */
  async getRecentMessages(conversationId, count = 10) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(count);

    if (error) throw error;
    return (data || []).reverse();
  }

  /**
   * Count user messages in a period
   */
  async countUserMessagesInPeriod(userId, since) {
    const { count, error } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('role', 'user')
      .gte('created_at', since);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Find messages in a conversation with pagination
   */
  async findByConversationPaginated(conversationId, options = {}) {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    const { data, error, count } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      messages: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Add feedback to a message
   */
  async addFeedback(messageId, userId, feedback) {
    const { data, error } = await this.db
      .from('ai_feedback')
      .insert({
        message_id: messageId,
        user_id: userId,
        rating: feedback.rating,
        comment: feedback.comment,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Count messages in a period
   */
  async countInPeriod(startDate, endDate) {
    const { count, error } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;
    return count || 0;
  }

  /**
   * Delete all messages in a conversation
   */
  async deleteByConversation(conversationId) {
    return this.deleteMany({ conversation_id: conversationId });
  }
}

/**
 * Chat Feedback Repository
 */
class ChatFeedbackRepository extends BaseRepository {
  constructor() {
    super('ai_feedback');
  }

  /**
   * Find feedback for a message
   */
  async findByMessage(messageId) {
    return this.findOne({ message_id: messageId });
  }

  /**
   * Get average rating for a period
   */
  async getAverageRating(since) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('rating')
      .gte('created_at', since.toISOString());

    if (error) throw error;

    if (!data || data.length === 0) return null;

    const sum = data.reduce((acc, f) => acc + f.rating, 0);
    return sum / data.length;
  }
}

export const chatConversationRepository = new ChatConversationRepository();
export const chatMessageRepository = new ChatMessageRepository();
export const chatFeedbackRepository = new ChatFeedbackRepository();

export default {
  conversations: chatConversationRepository,
  messages: chatMessageRepository,
  feedback: chatFeedbackRepository,
};
