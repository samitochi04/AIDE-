/**
 * Housing Service
 * Handles rental platform queries and user housing preferences
 */

import { supabaseAdmin } from '../config/supabase.js';

// Category display names
const CATEGORY_NAMES = {
  majorPortals: { en: 'Major Portals', fr: 'Portails Majeurs' },
  directOwner: { en: 'Direct Owner', fr: 'Particulier à Particulier' },
  studentHousing: { en: 'Student Housing', fr: 'Logement Étudiant' },
  privateStudentResidences: { en: 'Student Residences', fr: 'Résidences Étudiantes' },
  colocation: { en: 'Flatshare', fr: 'Colocation' },
  furnished: { en: 'Furnished Rentals', fr: 'Meublés' },
  socialHousing: { en: 'Social Housing', fr: 'Logement Social' },
  temporary: { en: 'Temporary Housing', fr: 'Logement Temporaire' },
  relocation: { en: 'Relocation Services', fr: 'Services de Relocation' },
  luxury: { en: 'Luxury Rentals', fr: 'Luxe' },
  apps: { en: 'Mobile Apps', fr: 'Applications Mobiles' },
  guarantorServices: { en: 'Guarantor Services', fr: 'Services de Garantie' },
  depositHelp: { en: 'Deposit Assistance', fr: 'Aide au Dépôt' },
  documentation: { en: 'Documentation', fr: 'Documentation' },
  safety: { en: 'Safety & Scams', fr: 'Sécurité & Arnaques' },
  tips: { en: 'Tips & Advice', fr: 'Conseils' },
  legal: { en: 'Legal Information', fr: 'Informations Légales' }
};

// Category icons
const CATEGORY_ICONS = {
  majorPortals: 'ri-building-2-line',
  directOwner: 'ri-user-heart-line',
  studentHousing: 'ri-graduation-cap-line',
  privateStudentResidences: 'ri-community-line',
  colocation: 'ri-team-line',
  furnished: 'ri-sofa-line',
  socialHousing: 'ri-government-line',
  temporary: 'ri-time-line',
  relocation: 'ri-truck-line',
  luxury: 'ri-vip-crown-2-line',
  apps: 'ri-smartphone-line',
  guarantorServices: 'ri-shield-check-line',
  depositHelp: 'ri-money-euro-circle-line',
  documentation: 'ri-file-text-line',
  safety: 'ri-alert-line',
  tips: 'ri-lightbulb-line',
  legal: 'ri-scales-3-line'
};

class HousingService {
  /**
   * Get all platforms grouped by category
   */
  async getAllPlatforms() {
    const { data, error } = await supabaseAdmin
      .from('renting')
      .select('*')
      .order('platform_name');

    if (error) {
      console.error('Error fetching platforms:', error);
      throw new Error('Failed to fetch platforms');
    }

    // Group by category
    const grouped = {};
    for (const item of data || []) {
      if (!grouped[item.category]) {
        grouped[item.category] = {
          category: item.category,
          name: CATEGORY_NAMES[item.category] || { en: item.category, fr: item.category },
          icon: CATEGORY_ICONS[item.category] || 'ri-home-line',
          platforms: []
        };
      }
      grouped[item.category].platforms.push(this.transformPlatform(item));
    }

    return Object.values(grouped);
  }

  /**
   * Get platforms by category
   */
  async getPlatformsByCategory(category) {
    const { data, error } = await supabaseAdmin
      .from('renting')
      .select('*')
      .eq('category', category)
      .order('platform_name');

    if (error) {
      console.error('Error fetching platforms by category:', error);
      throw new Error('Failed to fetch platforms');
    }

    return {
      category,
      name: CATEGORY_NAMES[category] || { en: category, fr: category },
      icon: CATEGORY_ICONS[category] || 'ri-home-line',
      platforms: (data || []).map(item => this.transformPlatform(item))
    };
  }

  /**
   * Get platform by ID
   */
  async getPlatformById(platformId) {
    const { data, error } = await supabaseAdmin
      .from('renting')
      .select('*')
      .eq('platform_id', platformId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching platform:', error);
      throw new Error('Failed to fetch platform');
    }

    return data ? this.transformPlatform(data) : null;
  }

  /**
   * Search platforms
   */
  async searchPlatforms({ query, category, type, language }) {
    let queryBuilder = supabaseAdmin
      .from('renting')
      .select('*');

    // Filter by category if provided
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    // Text search if query provided
    if (query) {
      queryBuilder = queryBuilder.textSearch('content_text', query, {
        type: 'websearch',
        config: 'french'
      });
    }

    const { data, error } = await queryBuilder.order('platform_name');

    if (error) {
      console.error('Error searching platforms:', error);
      throw new Error('Failed to search platforms');
    }

    let results = (data || []).map(item => this.transformPlatform(item));

    // Filter by type if provided
    if (type) {
      results = results.filter(p => p.type === type);
    }

    // Filter by language if provided
    if (language) {
      results = results.filter(p => 
        p.languages && p.languages.includes(language.toUpperCase())
      );
    }

    return results;
  }

  /**
   * Get resources (documentation, safety, tips, legal)
   */
  async getResources() {
    const resourceCategories = ['documentation', 'safety', 'tips', 'legal'];
    
    const { data, error } = await supabaseAdmin
      .from('renting')
      .select('*')
      .in('category', resourceCategories);

    if (error) {
      console.error('Error fetching resources:', error);
      throw new Error('Failed to fetch resources');
    }

    const resources = {};
    for (const item of data || []) {
      resources[item.platform_id] = {
        id: item.platform_id,
        category: item.category,
        name: item.platform_name,
        data: item.platform_data
      };
    }

    return resources;
  }

  /**
   * Get guarantor services
   */
  async getGuarantorServices() {
    const { data, error } = await supabaseAdmin
      .from('renting')
      .select('*')
      .eq('category', 'guarantorServices')
      .order('platform_name');

    if (error) {
      console.error('Error fetching guarantor services:', error);
      throw new Error('Failed to fetch guarantor services');
    }

    return (data || []).map(item => this.transformPlatform(item));
  }

  /**
   * Get rental tips
   */
  async getTips(city = null) {
    const { data, error } = await supabaseAdmin
      .from('renting')
      .select('*')
      .eq('category', 'tips');

    if (error) {
      console.error('Error fetching tips:', error);
      throw new Error('Failed to fetch tips');
    }

    // Find general tips
    const generalTips = data?.find(d => d.platform_id === 'rental-tips-general');
    const cityTips = city 
      ? data?.find(d => d.platform_id === `rental-tips-${city.toLowerCase()}`)
      : null;

    return {
      general: generalTips?.platform_data || {},
      city: cityTips?.platform_data || null,
      availableCities: data
        ?.filter(d => d.platform_id.startsWith('rental-tips-') && d.platform_id !== 'rental-tips-general')
        .map(d => d.platform_id.replace('rental-tips-', ''))
    };
  }

  /**
   * Get list of categories
   */
  async getCategories() {
    const { data, error } = await supabaseAdmin
      .from('renting')
      .select('category');

    if (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }

    // Get unique categories
    const uniqueCategories = [...new Set((data || []).map(d => d.category))];
    
    return uniqueCategories.map(cat => ({
      id: cat,
      name: CATEGORY_NAMES[cat] || { en: cat, fr: cat },
      icon: CATEGORY_ICONS[cat] || 'ri-home-line'
    }));
  }

  /**
   * Get user's housing preferences
   */
  async getUserPreferences(userId) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('housing_preferences')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching housing preferences:', error);
      throw new Error('Failed to fetch housing preferences');
    }

    return data?.housing_preferences || {
      type: null,
      rent: null,
      region: null,
      surface: null,
      hasLeaseContract: null,
      searchingFor: [],
      preferredCategories: []
    };
  }

  /**
   * Update user's housing preferences
   */
  async updateUserPreferences(userId, preferences) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        housing_preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('housing_preferences')
      .single();

    if (error) {
      console.error('Error updating housing preferences:', error);
      throw new Error('Failed to update housing preferences');
    }

    return data?.housing_preferences;
  }

  /**
   * Get user's saved platforms
   */
  async getSavedPlatforms(userId) {
    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('item_type', 'renting');

    if (error) {
      console.error('Error fetching saved platforms:', error);
      throw new Error('Failed to fetch saved platforms');
    }

    // Get the actual platform data for each saved item (item_id is the renting table UUID)
    const rentingIds = data?.map(d => d.item_id) || [];
    
    if (rentingIds.length === 0) {
      return [];
    }

    const { data: platforms, error: platformError } = await supabaseAdmin
      .from('renting')
      .select('*')
      .in('id', rentingIds);

    if (platformError) {
      console.error('Error fetching platform details:', platformError);
      throw new Error('Failed to fetch platform details');
    }

    return (platforms || []).map(item => ({
      ...this.transformPlatform(item),
      savedAt: data.find(d => d.item_id === item.id)?.created_at
    }));
  }

  /**
   * Save a platform to favorites
   */
  async savePlatform(userId, platformId, category) {
    // First, get the renting table UUID for this platform
    const { data: rentingItem, error: lookupError } = await supabaseAdmin
      .from('renting')
      .select('id')
      .eq('platform_id', platformId)
      .eq('category', category)
      .single();

    if (lookupError || !rentingItem) {
      console.error('Error finding platform:', lookupError);
      throw new Error('Platform not found');
    }

    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .upsert({
        user_id: userId,
        item_type: 'renting',
        item_id: rentingItem.id,
        notes: category
      }, {
        onConflict: 'user_id,item_type,item_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving platform:', error);
      throw new Error('Failed to save platform');
    }

    return data;
  }

  /**
   * Remove platform from favorites
   */
  async removeSavedPlatform(userId, platformId) {
    // First, get the renting table UUID for this platform
    const { data: rentingItem, error: lookupError } = await supabaseAdmin
      .from('renting')
      .select('id')
      .eq('platform_id', platformId)
      .maybeSingle();

    if (lookupError) {
      console.error('Error finding platform:', lookupError);
      throw new Error('Platform not found');
    }

    if (!rentingItem) {
      // Platform doesn't exist, just return success
      return;
    }

    const { error } = await supabaseAdmin
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('item_type', 'renting')
      .eq('item_id', rentingItem.id);

    if (error) {
      console.error('Error removing saved platform:', error);
      throw new Error('Failed to remove saved platform');
    }
  }

  /**
   * Transform database row to platform object
   */
  transformPlatform(item) {
    const data = item.platform_data || {};
    return {
      id: item.platform_id,
      dbId: item.id, // The UUID from the renting table
      name: item.platform_name,
      url: item.platform_url,
      description: item.platform_description,
      category: item.category,
      // Spread all additional data from JSONB
      type: data.type,
      languages: data.languages || [],
      hasApp: data.hasApp || false,
      appLinks: data.appLinks,
      agencyFees: data.agencyFees,
      priceRange: data.priceRange,
      coverage: data.coverage,
      features: data.features || [],
      pros: data.pros || [],
      cons: data.cons || [],
      tips: data.tips || [],
      eligibility: data.eligibility,
      cost: data.cost,
      // Keep raw data for any extra fields
      rawData: data
    };
  }
}

export const housingService = new HousingService();
