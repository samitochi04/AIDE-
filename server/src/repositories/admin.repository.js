import { BaseRepository } from './base.repository.js';

/**
 * Admin Repository
 * Handles admin data access
 */
class AdminRepository extends BaseRepository {
  constructor() {
    super('admins');
  }

  /**
   * Find admin with user details
   */
  async findAllWithUsers() {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*, user:user_id(email, full_name, avatar_url)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Find admin by user ID
   */
  async findByUserId(userId) {
    return this.findOne({ user_id: userId });
  }

  /**
   * Find admin with user profile for authentication
   */
  async findByUserIdWithProfile(userId) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*, user:user_id(id, email, full_name, avatar_url)')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}

/**
 * Admin Activity Log Repository
 */
class AdminActivityLogRepository extends BaseRepository {
  constructor() {
    super('admin_activity_logs');
  }

  /**
   * Log admin action
   */
  async logAction(adminId, action, resourceType, resourceId = null, details = {}, metadata = {}) {
    return this.create({
      admin_id: adminId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      ip_address: metadata.ipAddress,
      user_agent: metadata.userAgent,
    });
  }

  /**
   * Get activity logs with filters
   */
  async findWithFilters(options = {}) {
    const { page = 1, limit = 50, adminId, action, resourceType, startDate, endDate } = options;
    const offset = (page - 1) * limit;

    let query = this.db
      .from(this.tableName)
      .select('*, admin:admin_id(user:user_id(email, full_name))', { count: 'exact' });

    if (adminId) query = query.eq('admin_id', adminId);
    if (action) query = query.eq('action', action);
    if (resourceType) query = query.eq('resource_type', resourceType);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      logs: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }
}

/**
 * Bulk Email Repository
 */
class BulkEmailRepository extends BaseRepository {
  constructor() {
    super('bulk_emails');
  }

  /**
   * Find with pagination
   */
  async findAllPaginated(options = {}) {
    const { page = 1, limit = 20, status } = options;
    const offset = (page - 1) * limit;

    let query = this.db
      .from(this.tableName)
      .select('*, admin:admin_id(user:user_id(email, full_name))', { count: 'exact' });

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      emails: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Update email stats
   */
  async updateStats(id, stats) {
    return this.update(id, {
      ...stats,
      updated_at: new Date().toISOString(),
    });
  }
}

/**
 * Bulk Email Recipients Repository
 */
class BulkEmailRecipientsRepository extends BaseRepository {
  constructor() {
    super('bulk_email_recipients');
  }

  /**
   * Create recipients for bulk email
   */
  async createMany(bulkEmailId, recipients) {
    const entries = recipients.map((r) => ({
      bulk_email_id: bulkEmailId,
      user_id: r.id,
      email: r.email,
      status: 'pending',
    }));

    const { data, error } = await this.db
      .from(this.tableName)
      .insert(entries)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Get recipients by bulk email ID
   */
  async findByBulkEmailId(bulkEmailId, status = null) {
    let query = this.db
      .from(this.tableName)
      .select('*')
      .eq('bulk_email_id', bulkEmailId);

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Update recipient status
   */
  async updateStatus(id, status, timestamp = null) {
    const update = { status };
    if (timestamp) {
      update[`${status}_at`] = timestamp;
    }
    return this.update(id, update);
  }

  /**
   * Update recipient status by bulk email and user ID
   */
  async updateRecipientStatus(bulkEmailId, userId, status) {
    const update = { 
      status,
      [`${status}_at`]: new Date().toISOString(),
    };

    const { data, error } = await this.db
      .from(this.tableName)
      .update(update)
      .eq('bulk_email_id', bulkEmailId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * App Settings Repository
 */
class AppSettingsRepository extends BaseRepository {
  constructor() {
    super('app_settings');
  }

  /**
   * Get setting by key
   */
  async getByKey(key) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('key', key)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Set setting value
   */
  async setByKey(key, value, adminId = null) {
    const { data, error } = await this.db
      .from(this.tableName)
      .upsert({
        key,
        value,
        updated_by: adminId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all settings
   */
  async getAll(publicOnly = false) {
    let query = this.db
      .from(this.tableName)
      .select('*');

    if (publicOnly) query = query.eq('is_public', true);

    const { data, error } = await query.order('key');
    if (error) throw error;
    return data || [];
  }
}

/**
 * Content Repository (Blog & Tutorials)
 */
class ContentRepository extends BaseRepository {
  constructor() {
    super('contents');
  }

  /**
   * Find all with pagination and filters
   */
  async findAllPaginated(options = {}) {
    const {
      page = 1,
      limit = 20,
      contentType,
      category,
      isPublished,
      language,
      search,
      orderBy = 'created_at',
      ascending = false,
    } = options;
    const offset = (page - 1) * limit;

    let query = this.db
      .from(this.tableName)
      .select('*, author:created_by(user:user_id(email, full_name))', { count: 'exact' });

    if (contentType) query = query.eq('content_type', contentType);
    if (category) query = query.eq('category', category);
    if (isPublished !== undefined) query = query.eq('is_published', isPublished);
    if (language) query = query.eq('language', language);
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      contents: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Find by slug
   */
  async findBySlug(slug) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*, author:created_by(user:user_id(email, full_name))')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Get published content for public
   */
  async findPublished(options = {}) {
    const { page = 1, limit = 10, contentType, category, language, featured } = options;
    const offset = (page - 1) * limit;

    let query = this.db
      .from(this.tableName)
      .select('id, title, slug, description, thumbnail_url, content_type, category, tags, reading_time_minutes, duration_seconds, media_url, published_at, view_count, like_count, language', { count: 'exact' })
      .eq('is_published', true);

    if (contentType) query = query.eq('content_type', contentType);
    if (category) query = query.eq('category', category);
    if (language) query = query.eq('language', language);
    if (featured) query = query.eq('is_featured', true);

    const { data, error, count } = await query
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      contents: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Increment view count
   */
  async incrementViews(id) {
    const { error } = await this.db.rpc('increment_content_views', { content_id: id });
    if (error) {
      // Fallback if RPC doesn't exist
      const { data } = await this.findById(id);
      if (data) {
        await this.update(id, { view_count: (data.view_count || 0) + 1 });
      }
    }
  }

  /**
   * Get content categories
   */
  async getCategories(contentType = null) {
    let query = this.db
      .from(this.tableName)
      .select('category')
      .eq('is_published', true);

    if (contentType) query = query.eq('content_type', contentType);

    const { data, error } = await query;
    if (error) throw error;

    return [...new Set(data?.map((c) => c.category).filter(Boolean))];
  }
}

/**
 * Gov Aides Repository (for admin CRUD)
 */
class GovAidesRepository extends BaseRepository {
  constructor() {
    super('gov_aides');
  }

  /**
   * Find all with pagination
   */
  async findAllPaginated(options = {}) {
    const { page = 1, limit = 20, region, profileType, search, orderBy = 'created_at', ascending = false } = options;
    const offset = (page - 1) * limit;

    let query = this.db
      .from(this.tableName)
      .select('*', { count: 'exact' });

    if (region) query = query.eq('region_id', region);
    if (profileType) query = query.eq('profile_type', profileType);
    if (search) {
      query = query.or(`aide_name.ilike.%${search}%,aide_description.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      aides: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Get unique regions
   */
  async getRegions() {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('region_id, region_name')
      .order('region_name');

    if (error) throw error;

    const unique = [];
    const seen = new Set();
    data?.forEach((r) => {
      if (!seen.has(r.region_id)) {
        seen.add(r.region_id);
        unique.push(r);
      }
    });
    return unique;
  }
}

/**
 * Procedures Repository (for admin CRUD)
 */
class ProceduresRepository extends BaseRepository {
  constructor() {
    super('procedures');
  }

  /**
   * Find all with pagination
   */
  async findAllPaginated(options = {}) {
    const { page = 1, limit = 20, category, section, search, orderBy = 'created_at', ascending = false } = options;
    const offset = (page - 1) * limit;

    let query = this.db
      .from(this.tableName)
      .select('*', { count: 'exact' });

    if (category) query = query.eq('category', category);
    if (section) query = query.eq('section', section);
    if (search) {
      query = query.or(`procedure_name.ilike.%${search}%,procedure_description.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      procedures: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Get unique categories and sections
   */
  async getCategoriesAndSections() {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('category, section');

    if (error) throw error;

    const categories = [...new Set(data?.map((p) => p.category).filter(Boolean))];
    const sections = [...new Set(data?.map((p) => p.section).filter(Boolean))];
    return { categories, sections };
  }
}

/**
 * Renting Repository (for admin CRUD)
 */
class RentingRepository extends BaseRepository {
  constructor() {
    super('renting');
  }

  /**
   * Find all with pagination
   */
  async findAllPaginated(options = {}) {
    const { page = 1, limit = 20, category, search, orderBy = 'created_at', ascending = false } = options;
    const offset = (page - 1) * limit;

    let query = this.db
      .from(this.tableName)
      .select('*', { count: 'exact' });

    if (category) query = query.eq('category', category);
    if (search) {
      query = query.or(`platform_name.ilike.%${search}%,platform_description.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      platforms: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Get unique categories
   */
  async getCategories() {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('category');

    if (error) throw error;
    return [...new Set(data?.map((r) => r.category).filter(Boolean))];
  }
}

export const adminRepository = new AdminRepository();
export const adminActivityLogRepository = new AdminActivityLogRepository();
export const bulkEmailRepository = new BulkEmailRepository();
export const bulkEmailRecipientsRepository = new BulkEmailRecipientsRepository();
export const appSettingsRepository = new AppSettingsRepository();
export const contentRepository = new ContentRepository();
export const govAidesRepository = new GovAidesRepository();
export const proceduresRepository = new ProceduresRepository();
export const rentingRepository = new RentingRepository();

export {
  AdminRepository,
  AdminActivityLogRepository,
  BulkEmailRepository,
  BulkEmailRecipientsRepository,
  AppSettingsRepository,
  ContentRepository,
  GovAidesRepository,
  ProceduresRepository,
  RentingRepository,
};

export default adminRepository;
