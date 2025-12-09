import { supabaseAdmin } from '../config/supabase.js';
import logger from '../utils/logger.js';

/**
 * Base Repository Class
 * Provides common CRUD operations for all repositories
 */
export class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = supabaseAdmin;
  }

  /**
   * Find all records with optional filters and pagination
   */
  async findAll(options = {}) {
    const {
      select = '*',
      filters = {},
      orderBy = 'created_at',
      orderDirection = 'desc',
      page = 1,
      limit = 20,
    } = options;

    const offset = (page - 1) * limit;

    let query = this.db
      .from(this.tableName)
      .select(select, { count: 'exact' });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && value.operator) {
          // Handle special operators: { operator: 'ilike', value: '%search%' }
          switch (value.operator) {
            case 'ilike':
              query = query.ilike(key, value.value);
              break;
            case 'in':
              query = query.in(key, value.value);
              break;
            case 'gte':
              query = query.gte(key, value.value);
              break;
            case 'lte':
              query = query.lte(key, value.value);
              break;
            case 'neq':
              query = query.neq(key, value.value);
              break;
            case 'is':
              query = query.is(key, value.value);
              break;
            default:
              query = query.eq(key, value.value);
          }
        } else {
          query = query.eq(key, value);
        }
      }
    });

    // Apply ordering and pagination
    const { data, error, count } = await query
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error(`${this.tableName}.findAll error`, { error });
      throw error;
    }

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
   * Find a single record by ID
   */
  async findById(id, select = '*') {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(select)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error(`${this.tableName}.findById error`, { id, error });
      throw error;
    }

    return data;
  }

  /**
   * Find a single record by a specific field
   */
  async findOne(filters, select = '*') {
    let query = this.db
      .from(this.tableName)
      .select(select);

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      logger.error(`${this.tableName}.findOne error`, { filters, error });
      throw error;
    }

    return data;
  }

  /**
   * Find multiple records by a specific field
   */
  async findBy(filters, options = {}) {
    const { select = '*', orderBy = 'created_at', orderDirection = 'desc', limit } = options;

    let query = this.db
      .from(this.tableName)
      .select(select);

    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    });

    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      logger.error(`${this.tableName}.findBy error`, { filters, error });
      throw error;
    }

    return data || [];
  }

  /**
   * Create a new record
   */
  async create(data) {
    const { data: created, error } = await this.db
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) {
      logger.error(`${this.tableName}.create error`, { error });
      throw error;
    }

    return created;
  }

  /**
   * Create multiple records
   */
  async createMany(records) {
    const { data, error } = await this.db
      .from(this.tableName)
      .insert(records)
      .select();

    if (error) {
      logger.error(`${this.tableName}.createMany error`, { error });
      throw error;
    }

    return data;
  }

  /**
   * Update a record by ID
   */
  async update(id, data) {
    const { data: updated, error } = await this.db
      .from(this.tableName)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error(`${this.tableName}.update error`, { id, error });
      throw error;
    }

    return updated;
  }

  /**
   * Update multiple records by filters
   */
  async updateMany(filters, data) {
    let query = this.db
      .from(this.tableName)
      .update({ ...data, updated_at: new Date().toISOString() });

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data: updated, error } = await query.select();

    if (error) {
      logger.error(`${this.tableName}.updateMany error`, { filters, error });
      throw error;
    }

    return updated;
  }

  /**
   * Delete a record by ID
   */
  async delete(id) {
    const { error } = await this.db
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      logger.error(`${this.tableName}.delete error`, { id, error });
      throw error;
    }

    return true;
  }

  /**
   * Delete multiple records by filters
   */
  async deleteMany(filters) {
    let query = this.db
      .from(this.tableName)
      .delete();

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { error } = await query;

    if (error) {
      logger.error(`${this.tableName}.deleteMany error`, { filters, error });
      throw error;
    }

    return true;
  }

  /**
   * Count records with optional filters
   */
  async count(filters = {}) {
    let query = this.db
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { count, error } = await query;

    if (error) {
      logger.error(`${this.tableName}.count error`, { filters, error });
      throw error;
    }

    return count || 0;
  }

  /**
   * Check if a record exists
   */
  async exists(filters) {
    const count = await this.count(filters);
    return count > 0;
  }

  /**
   * Upsert (insert or update) a record
   */
  async upsert(data, conflictColumns = ['id']) {
    const { data: upserted, error } = await this.db
      .from(this.tableName)
      .upsert(data, { onConflict: conflictColumns.join(',') })
      .select()
      .single();

    if (error) {
      logger.error(`${this.tableName}.upsert error`, { error });
      throw error;
    }

    return upserted;
  }

  /**
   * Execute a raw RPC function
   */
  async rpc(functionName, params = {}) {
    const { data, error } = await this.db.rpc(functionName, params);

    if (error) {
      logger.error(`${this.tableName}.rpc error`, { functionName, error });
      throw error;
    }

    return data;
  }
}

export default BaseRepository;
