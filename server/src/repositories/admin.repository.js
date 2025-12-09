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
      .select('*, user:user_id(email, first_name, last_name)')
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
}

export const adminRepository = new AdminRepository();
export { AdminRepository };
export default adminRepository;
