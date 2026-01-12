import { BaseRepository } from './base.repository.js';

/**
 * Knowledge Base Repository
 * Handles the knowledge base content for RAG
 */
class KnowledgeBaseRepository extends BaseRepository {
  constructor() {
    super('knowledge_base');
  }

  /**
   * Semantic search using embeddings
   */
  async semanticSearch(embedding, options = {}) {
    const { limit = 5, category, threshold = 0.7 } = options;

    const { data, error } = await this.db.rpc('search_knowledge_base', {
      query_embedding: embedding,
      match_count: limit,
      match_threshold: threshold,
      filter_category: category || null,
    });

    if (error) throw error;
    return data || [];
  }

  /**
   * Find by category
   */
  async findByCategory(category, options = {}) {
    return this.findAll({
      ...options,
      filters: { category },
    });
  }

  /**
   * Full-text search
   */
  async textSearch(query, options = {}) {
    const { limit = 20, category } = options;

    let dbQuery = this.db
      .from(this.tableName)
      .select('*')
      .textSearch('content', query, { type: 'websearch' });

    if (category) {
      dbQuery = dbQuery.eq('category', category);
    }

    const { data, error } = await dbQuery.limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all unique categories
   */
  async getCategories() {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('category');

    if (error) throw error;

    return [...new Set(data?.map((k) => k.category).filter(Boolean))];
  }

  /**
   * Upsert knowledge base entry with embedding
   */
  async upsertWithEmbedding(entry) {
    const { id, title, content, category, metadata, embedding } = entry;

    const { data, error } = await this.db
      .from(this.tableName)
      .upsert({
        id,
        title,
        content,
        category,
        metadata,
        embedding,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Bulk upsert knowledge base entries
   */
  async bulkUpsert(entries) {
    const { data, error } = await this.db
      .from(this.tableName)
      .upsert(
        entries.map((e) => ({
          ...e,
          updated_at: new Date().toISOString(),
        }))
      )
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Get entries without embeddings (for processing)
   */
  async findWithoutEmbeddings(limit = 100) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .is('embedding', null)
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Update embedding for entry
   */
  async updateEmbedding(id, embedding) {
    return this.update(id, { embedding });
  }

  /**
   * Get stats
   */
  async getStats() {
    const [total, withEmbeddings, byCategory] = await Promise.all([
      this.count(),
      this.db
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .not('embedding', 'is', null),
      this.db.from(this.tableName).select('category'),
    ]);

    const categoryCounts = {};
    byCategory.data?.forEach((k) => {
      categoryCounts[k.category] = (categoryCounts[k.category] || 0) + 1;
    });

    return {
      total,
      withEmbeddings: withEmbeddings.count || 0,
      byCategory: categoryCounts,
    };
  }
}

export const knowledgeBaseRepository = new KnowledgeBaseRepository();
export default knowledgeBaseRepository;
