import { supabaseAdmin } from '../config/supabase.js';
import logger from '../utils/logger.js';

/**
 * Profile Service
 * Handles user profile management
 */
class ProfileService {
  /**
   * Get user profile by ID
   */
  async getProfile(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get profile', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, profileData) {
    try {
      // Filter only allowed fields
      const allowedFields = [
        'full_name',
        'phone',
        'status',
        'nationality',
        'country_of_origin',
        'date_of_birth',
        'region',
        'department',
        'city',
        'postal_code',
        'language',
        'notification_preferences',
        'avatar_url'
      ];

      const filteredData = {};
      for (const key of allowedFields) {
        if (profileData[key] !== undefined) {
          filteredData[key] = profileData[key];
        }
      }

      // Add updated_at timestamp
      filteredData.updated_at = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(filteredData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error('Failed to update profile', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Upload avatar to Supabase Storage
   */
  async uploadAvatar(userId, file) {
    try {
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to storage
      const { data, error } = await supabaseAdmin.storage
        .from('avatars')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // Update profile with avatar URL
      await this.updateProfile(userId, { avatar_url: avatarUrl });

      return avatarUrl;
    } catch (error) {
      logger.error('Failed to upload avatar', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete avatar from storage
   */
  async deleteAvatar(userId) {
    try {
      // Get current profile to find avatar URL
      const profile = await this.getProfile(userId);
      
      if (profile?.avatar_url) {
        // Extract file path from URL
        const url = new URL(profile.avatar_url);
        const pathParts = url.pathname.split('/');
        const filePath = pathParts.slice(-2).join('/'); // avatars/filename

        // Delete from storage
        await supabaseAdmin.storage
          .from('avatars')
          .remove([filePath]);
      }

      // Update profile to remove avatar URL
      await this.updateProfile(userId, { avatar_url: null });

      return true;
    } catch (error) {
      logger.error('Failed to delete avatar', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get profile stats (simulations, procedures, etc.)
   */
  async getProfileStats(userId) {
    try {
      // Get simulation stats
      const { data: simulations, error: simError } = await supabaseAdmin
        .from('simulations')
        .select('eligible_aides_count, total_monthly')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      // Get saved aides count
      const { count: savedAidesCount, error: savedError } = await supabaseAdmin
        .from('saved_aides')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get procedures count
      const { data: procedures, error: procError } = await supabaseAdmin
        .from('user_procedures')
        .select('status')
        .eq('user_id', userId);

      const completedProcedures = procedures?.filter(p => p.status === 'completed').length || 0;
      const inProgressProcedures = procedures?.filter(p => p.status === 'in-progress').length || 0;

      // Get latest simulation results
      const latestSimulation = simulations?.[0];

      return {
        eligibleAides: latestSimulation?.eligible_aides_count || 0,
        potentialSavings: latestSimulation?.total_monthly || 0,
        savedAides: savedAidesCount || 0,
        completedProcedures,
        inProgressProcedures,
        totalProcedures: (procedures?.length || 0)
      };
    } catch (error) {
      logger.error('Failed to get profile stats', { userId, error: error.message });
      return {
        eligibleAides: 0,
        potentialSavings: 0,
        savedAides: 0,
        completedProcedures: 0,
        inProgressProcedures: 0,
        totalProcedures: 0
      };
    }
  }
}

export const profileService = new ProfileService();
