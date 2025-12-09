import { BaseRepository } from './base.repository.js';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * Aide Repository
 * Handles government aides data access
 */
class AideRepository extends BaseRepository {
  constructor() {
    super('aides');
  }

  /**
   * Find aides by region
   */
  async findByRegion(region, options = {}) {
    return this.findAll({
      ...options,
      filters: { region, is_active: true },
    });
  }

  /**
   * Find aides by category
   */
  async findByCategory(category, options = {}) {
    return this.findAll({
      ...options,
      filters: { category, is_active: true },
    });
  }

  /**
   * Search aides
   */
  async search(query, options = {}) {
    const { region, category, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    let dbQuery = this.db
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }
    if (region) {
      dbQuery = dbQuery.eq('region', region);
    }
    if (category) {
      dbQuery = dbQuery.eq('category', category);
    }

    const { data, error, count } = await dbQuery
      .order('view_count', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Semantic search using embeddings
   */
  async semanticSearch(embedding, options = {}) {
    const { limit = 5, region, category } = options;

    const { data, error } = await this.db.rpc('search_aides_by_embedding', {
      query_embedding: embedding,
      match_count: limit,
      filter_region: region || null,
      filter_category: category || null,
    });

    if (error) throw error;
    return data || [];
  }

  /**
   * Increment view count
   */
  async incrementViews(aideId) {
    const { error } = await this.db.rpc('increment_aide_views', { aide_id: aideId });
    if (error) throw error;
  }

  /**
   * Increment click count
   */
  async incrementClicks(aideId) {
    const { error } = await this.db.rpc('increment_aide_clicks', { aide_id: aideId });
    if (error) throw error;
  }

  /**
   * Get popular aides
   */
  async getPopular(limit = 10) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get aides by tags
   */
  async findByTags(tags, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const { data, error, count } = await this.db
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .overlaps('tags', tags)
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data || [],
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    };
  }

  /**
   * Get all unique categories
   */
  async getCategories() {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('category')
      .eq('is_active', true);

    if (error) throw error;
    return [...new Set(data?.map((a) => a.category).filter(Boolean))];
  }

  /**
   * Get all unique regions
   */
  async getRegions() {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('region')
      .eq('is_active', true);

    if (error) throw error;
    return [...new Set(data?.map((a) => a.region).filter(Boolean))];
  }

  /**
   * Find all aides with filters and pagination (admin)
   */
  async findAllPaginated(options = {}) {
    const { page = 1, limit = 20, filters = {}, orderBy = 'created_at', ascending = false } = options;
    const offset = (page - 1) * limit;

    let query = this.db
      .from(this.tableName)
      .select('*', { count: 'exact' });

    if (filters.region) {
      query = query.eq('region', filters.region);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
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
}

/**
 * Procedure Repository
 */
class ProcedureRepository extends BaseRepository {
  constructor() {
    super('procedures');
  }

  /**
   * Find procedures by profile type
   */
  async findByProfile(profileType, options = {}) {
    return this.findAll({
      ...options,
      filters: { profile_type: profileType, is_active: true },
    });
  }

  /**
   * Find procedures by category
   */
  async findByCategory(category, options = {}) {
    return this.findAll({
      ...options,
      filters: { category, is_active: true },
    });
  }
}

/**
 * Renting Repository
 */
class RentingRepository extends BaseRepository {
  constructor() {
    super('renting_platforms');
  }

  /**
   * Find by category
   */
  async findByCategory(category, options = {}) {
    return this.findAll({
      ...options,
      filters: { category, is_active: true },
    });
  }

  /**
   * Get all categories with counts
   */
  async getCategoriesWithCounts() {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('category')
      .eq('is_active', true);

    if (error) throw error;

    const counts = {};
    data?.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });

    return counts;
  }
}

export const aideRepository = new AideRepository();
export const procedureRepository = new ProcedureRepository();
export const rentingRepository = new RentingRepository();

export default {
  aides: aideRepository,
  procedures: procedureRepository,
  renting: rentingRepository,
};
