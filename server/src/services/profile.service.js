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

  /**
   * Soft delete user account
   * Sets deleted_at timestamp, is_active to false, and copies to deleted_profiles
   */
  async deleteAccount(userId) {
    try {
      // Get current profile
      const profile = await this.getProfile(userId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Start by inserting/updating deleted_profiles record
      const { error: deleteProfileError } = await supabaseAdmin
        .from('deleted_profiles')
        .upsert({
          original_user_id: userId,
          email: profile.email,
          full_name: profile.full_name,
          deletion_reason: 'user_requested',
          deleted_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        });

      if (deleteProfileError) {
        logger.error('Failed to insert deleted profile', { error: deleteProfileError });
      }

      // Update the profile: set deleted_at and is_active
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Delete avatar if exists
      if (profile.avatar_url) {
        await this.deleteAvatar(userId);
      }

      logger.info('Account soft deleted', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to delete account', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Change user password via Supabase Auth
   */
  async changePassword(userId, newPassword) {
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) throw error;

      logger.info('Password changed successfully', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to change password', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Update notification preferences (individual columns in profiles)
   */
  async updateNotificationPreferences(userId, preferences) {
    try {
      // First get current profile to merge notification_preferences JSONB
      const currentProfile = await this.getProfile(userId);
      const currentNotifPrefs = currentProfile?.notification_preferences || {};

      // Map preferences to actual database columns
      const updateData = {
        updated_at: new Date().toISOString()
      };

      // Map the preference keys to database columns
      if (preferences.email_notifications !== undefined) {
        updateData.weekly_digest_enabled = preferences.email_notifications;
      }
      if (preferences.new_aides_alerts !== undefined) {
        updateData.new_aides_notification_enabled = preferences.new_aides_alerts;
      }
      if (preferences.deadline_reminders !== undefined) {
        updateData.in_app_notifications_enabled = preferences.deadline_reminders;
      }
      if (preferences.marketing_emails !== undefined) {
        // Store marketing preference in notification_preferences JSONB
        updateData.notification_preferences = {
          ...currentNotifPrefs,
          marketing: preferences.marketing_emails
        };
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Notification preferences updated', { userId });
      return data;
    } catch (error) {
      logger.error('Failed to update notification preferences', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get user data for export
   */
  async getUserDataForExport(userId) {
    try {
      // Get profile
      const profile = await this.getProfile(userId);

      // Get simulations
      const { data: simulations } = await supabaseAdmin
        .from('simulations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Get saved aides
      const { data: savedAides } = await supabaseAdmin
        .from('saved_aides')
        .select('*')
        .eq('user_id', userId);

      // Get procedures
      const { data: procedures } = await supabaseAdmin
        .from('user_procedures')
        .select('*')
        .eq('user_id', userId);

      return {
        profile: {
          full_name: profile?.full_name,
          email: profile?.email,
          phone: profile?.phone,
          status: profile?.status,
          nationality: profile?.nationality,
          country_of_origin: profile?.country_of_origin,
          date_of_birth: profile?.date_of_birth,
          region: profile?.region,
          department: profile?.department,
          city: profile?.city,
          postal_code: profile?.postal_code,
          created_at: profile?.created_at,
          updated_at: profile?.updated_at
        },
        simulations: simulations || [],
        savedAides: savedAides || [],
        procedures: procedures || [],
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get user data for export', { userId, error: error.message });
      throw error;
    }
  }
}

export const profileService = new ProfileService();
