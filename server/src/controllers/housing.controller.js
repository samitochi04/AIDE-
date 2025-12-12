/**
 * Housing Controller
 * Handles housing/rental platform requests
 */

import { housingService } from '../services/housing.service.js';

class HousingController {
  /**
   * Get all platforms grouped by category
   */
  async getPlatforms(req, res, next) {
    try {
      const platforms = await housingService.getAllPlatforms();
      res.json({ success: true, data: platforms });
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
   */
  async getGuarantorServices(req, res, next) {
    try {
      const guarantors = await housingService.getGuarantorServices();
      res.json({ success: true, data: guarantors });
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
      res.json({ success: true, data: saved });
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
      const saved = await housingService.savePlatform(userId, platformId, category);
      res.json({ success: true, data: saved });
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
