/**
 * Housing Controller
 * Handles housing/rental platform requests
 */

import { housingService } from '../services/housing.service.js';
import { subscriptionService } from '../services/subscription.service.js';
import { TIER_LIMITS } from '../utils/constants.js';

class HousingController {
  /**
   * Get all platforms grouped by category
   * Platforms are limited based on user's subscription tier
   */
  async getPlatforms(req, res, next) {
    try {
      const allPlatforms = await housingService.getAllPlatforms();
      const userId = req.user?.id;
      
      // Get user's tier limits
      let tier = 'free';
      let limits = TIER_LIMITS.free;
      
      if (userId) {
        const userLimits = await subscriptionService.getUserLimits(userId);
        tier = userLimits.tier;
        limits = userLimits.limits;
      }
      
      // If user has access to all sites, return everything
      if (limits.allHousingSites || limits.housingSites === -1) {
        return res.json({ 
          success: true, 
          data: allPlatforms,
          meta: {
            tier,
            limit: limits.housingSites,
            isLimited: false
          }
        });
      }
      
      // Limit the platforms shown
      const platformLimit = limits.housingSites || 5;
      let totalCount = 0;
      
      const limitedPlatforms = allPlatforms.map(category => {
        const remainingSlots = Math.max(0, platformLimit - totalCount);
        const limitedCategoryPlatforms = category.platforms.slice(0, remainingSlots);
        totalCount += limitedCategoryPlatforms.length;
        
        return {
          ...category,
          platforms: limitedCategoryPlatforms,
          totalInCategory: category.platforms.length,
          isLimited: limitedCategoryPlatforms.length < category.platforms.length
        };
      }).filter(cat => cat.platforms.length > 0);
      
      res.json({ 
        success: true, 
        data: limitedPlatforms,
        meta: {
          tier,
          limit: platformLimit,
          shown: totalCount,
          total: allPlatforms.reduce((acc, cat) => acc + cat.platforms.length, 0),
          isLimited: true,
          upgradeMessage: 'Passez à un forfait supérieur pour accéder à toutes les plateformes de logement.',
          upgradeMessageEn: 'Upgrade your plan to access all housing platforms.'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get platforms by category
   */
  async getPlatformsByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const platforms = await housingService.getPlatformsByCategory(category);
      res.json({ success: true, data: platforms });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single platform by ID
   */
  async getPlatformById(req, res, next) {
    try {
      const { id } = req.params;
      const platform = await housingService.getPlatformById(id);
      
      if (!platform) {
        return res.status(404).json({
          success: false,
          error: 'Platform not found'
        });
      }
      
      res.json({ success: true, data: platform });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search platforms and resources
   */
  async searchPlatforms(req, res, next) {
    try {
      const { q, category, type, language } = req.query;
      const results = await housingService.searchPlatforms({
        query: q,
        category,
        type,
        language
      });
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get housing resources (tips, legal, dossier)
   */
  async getResources(req, res, next) {
    try {
      const resources = await housingService.getResources();
      res.json({ success: true, data: resources });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get guarantor services
   * Limited based on user's subscription tier
   */
  async getGuarantorServices(req, res, next) {
    try {
      const allGuarantors = await housingService.getGuarantorServices();
      const userId = req.user?.id;
      
      // Get user's tier limits
      let tier = 'free';
      let limits = TIER_LIMITS.free;
      
      if (userId) {
        const userLimits = await subscriptionService.getUserLimits(userId);
        tier = userLimits.tier;
        limits = userLimits.limits;
      }
      
      // If user has access to all guarantor services, return everything
      if (limits.allGuarantors || limits.guarantorServices === -1) {
        return res.json({ 
          success: true, 
          data: allGuarantors,
          meta: {
            tier,
            isLimited: false
          }
        });
      }
      
      // Limit the guarantors shown
      const guarantorLimit = limits.guarantorServices || 1;
      const limitedGuarantors = allGuarantors.slice(0, guarantorLimit);
      
      res.json({ 
        success: true, 
        data: limitedGuarantors,
        meta: {
          tier,
          limit: guarantorLimit,
          shown: limitedGuarantors.length,
          total: allGuarantors.length,
          isLimited: limitedGuarantors.length < allGuarantors.length,
          upgradeMessage: 'Passez à un forfait supérieur pour accéder à tous les services de garant.',
          upgradeMessageEn: 'Upgrade your plan to access all guarantor services.'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get rental tips
   */
  async getTips(req, res, next) {
    try {
      const { city } = req.query;
      const tips = await housingService.getTips(city);
      res.json({ success: true, data: tips });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get list of categories
   */
  async getCategories(req, res, next) {
    try {
      const categories = await housingService.getCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's housing preferences
   */
  async getPreferences(req, res, next) {
    try {
      const userId = req.user.id;
      const preferences = await housingService.getUserPreferences(userId);
      res.json({ success: true, data: preferences });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user's housing preferences
   */
  async updatePreferences(req, res, next) {
    try {
      const userId = req.user.id;
      const preferences = req.body;
      const updated = await housingService.updateUserPreferences(userId, preferences);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's saved platforms
   */
  async getSavedPlatforms(req, res, next) {
    try {
      const userId = req.user.id;
      const saved = await housingService.getSavedPlatforms(userId);
      
      // Get usage stats for limit display
      const limits = await subscriptionService.getUserLimits(userId);
      const tier = await subscriptionService.getUserTier(userId);
      
      res.json({ 
        success: true, 
        data: saved,
        usage: {
          current: saved.length,
          limit: limits.housingSites,
          remaining: limits.housingSites === -1 ? 'unlimited' : Math.max(0, limits.housingSites - saved.length),
          tier
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save a platform to favorites
   */
  async savePlatform(req, res, next) {
    try {
      const userId = req.user.id;
      const { platformId, category } = req.body;
      
      // Check housing save limit
      const limitCheck = await subscriptionService.canSaveHousing(userId);
      
      if (!limitCheck.allowed) {
        return res.status(403).json({
          success: false,
          error: 'limit_exceeded',
          ...limitCheck,
          message: limitCheck.message,
          upgradeUrl: '/pricing'
        });
      }
      
      const result = await housingService.savePlatform(userId, platformId, category);
      
      res.json({ 
        success: true, 
        data: result,
        usage: {
          current: limitCheck.current + 1,
          limit: limitCheck.limit,
          remaining: limitCheck.remaining - 1,
          tier: limitCheck.tier
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove platform from favorites
   */
  async removeSavedPlatform(req, res, next) {
    try {
      const userId = req.user.id;
      const { platformId } = req.params;
      await housingService.removeSavedPlatform(userId, platformId);
      res.json({ success: true, message: 'Platform removed from favorites' });
    } catch (error) {
      next(error);
    }
  }
}

export const housingController = new HousingController();
