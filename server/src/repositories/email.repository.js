import { BaseRepository } from './base.repository.js';

/**
 * Email Templates Repository
 */
class EmailTemplateRepository extends BaseRepository {
  constructor() {
    super('email_templates');
  }

  /**
   * Find template by key
   */
  async findByKey(templateKey) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('template_key', templateKey)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  /**
   * Find template by key and language
   */
  async findByKeyAndLanguage(templateKey, language = 'fr') {
    const template = await this.findByKey(templateKey);
    
    if (!template) return null;

    // If template has translations for the requested language, merge them
    if (template.translations && template.translations[language]) {
      return {
        ...template,
        subject: template.translations[language].subject || template.subject,
        body_html: template.translations[language].body_html || template.body_html,
        body_text: template.translations[language].body_text || template.body_text,
      };
    }

    return template;
  }

  /**
   * Get all templates by category
   */
  async findByCategory(category) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('template_name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Update template
   */
  async updateTemplate(templateKey, updates) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('template_key', templateKey)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Increment send count
   */
  async incrementSendCount(templateKey) {
    const { error } = await this.supabase.rpc('increment_email_template_send_count', {
      p_template_key: templateKey,
    });

    // Fallback if RPC doesn't exist
    if (error) {
      const template = await this.findByKey(templateKey);
      if (template) {
        await this.supabase
          .from(this.tableName)
          .update({
            send_count: (template.send_count || 0) + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq('template_key', templateKey);
      }
    }
  }

  /**
   * Get all active templates
   */
  async findAllActive() {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('template_name', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

/**
 * Email Logs Repository
 */
class EmailLogRepository extends BaseRepository {
  constructor() {
    super('email_logs');
  }

  /**
   * Create email log entry
   */
  async logEmail(data) {
    const { data: log, error } = await this.supabase
      .from(this.tableName)
      .insert({
        template_id: data.templateId,
        user_id: data.userId,
        recipient_email: data.recipientEmail,
        subject: data.subject,
        status: data.status || 'pending',
        error_message: data.errorMessage,
        sent_at: data.status === 'sent' ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return log;
  }

  /**
   * Update email status
   */
  async updateStatus(logId, status, additionalData = {}) {
    const updateData = {
      status,
      ...additionalData,
    };

    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    } else if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', logId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mark as opened
   */
  async markOpened(logId) {
    return this.updateStatus(logId, 'delivered', {
      opened_at: new Date().toISOString(),
    });
  }

  /**
   * Mark as clicked
   */
  async markClicked(logId) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        clicked_at: new Date().toISOString(),
      })
      .eq('id', logId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user's email history
   */
  async findByUser(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const { data, error, count } = await this.supabase
      .from(this.tableName)
      .select('*, email_templates(template_name, category)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  /**
   * Get email statistics
   */
  async getStats(options = {}) {
    const { startDate, endDate } = options;

    let query = this.supabase
      .from(this.tableName)
      .select('status', { count: 'exact' });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Aggregate stats by status
    const stats = {
      total: 0,
      pending: 0,
      sent: 0,
      delivered: 0,
      bounced: 0,
      failed: 0,
      opened: 0,
      clicked: 0,
    };

    (data || []).forEach((row) => {
      stats.total++;
      if (stats[row.status] !== undefined) {
        stats[row.status]++;
      }
    });

    return stats;
  }

  /**
   * Get recent emails for admin dashboard
   */
  async findRecent(limit = 50) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*, email_templates(template_name, category), profiles(email, full_name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Find failed emails for retry
   */
  async findFailedEmails(olderThan = 24) {
    const cutoffDate = new Date(Date.now() - olderThan * 60 * 60 * 1000).toISOString();

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('status', 'failed')
      .gte('created_at', cutoffDate)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

export const emailTemplateRepository = new EmailTemplateRepository();
export const emailLogRepository = new EmailLogRepository();
export { EmailTemplateRepository, EmailLogRepository };
