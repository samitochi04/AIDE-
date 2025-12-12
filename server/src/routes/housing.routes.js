/**
 * Housing Routes
 * Endpoints for rental platforms, housing resources, and user housing preferences
 */

import { Router } from 'express';
import { housingController } from '../controllers/housing.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.js';

const router = Router();

// ===========================================
// Public Routes (no auth required)
// ===========================================

/**
 * GET /platforms
 * Get all rental platforms by category
 */
router.get('/platforms', housingController.getPlatforms);

/**
 * GET /platforms/:category
 * Get platforms by specific category
 */
router.get('/platforms/:category', housingController.getPlatformsByCategory);

/**
 * GET /platform/:id
 * Get a single platform by ID
 */
router.get('/platform/:id', housingController.getPlatformById);

/**
 * GET /search
 * Search platforms and resources
 */
router.get('/search', housingController.searchPlatforms);

/**
 * GET /resources
 * Get housing resources (tips, legal info, dossier info)
 */
router.get('/resources', housingController.getResources);

/**
 * GET /guarantors
 * Get guarantor services (Visale, GarantMe, etc.)
 */
router.get('/guarantors', housingController.getGuarantorServices);

/**
 * GET /tips
 * Get rental tips (general and by city)
 */
router.get('/tips', housingController.getTips);

/**
 * GET /categories
 * Get list of available categories
 */
router.get('/categories', housingController.getCategories);

// ===========================================
// Protected Routes (auth required)
// ===========================================

/**
 * GET /preferences
 * Get user's housing preferences
 */
router.get('/preferences', authenticate, housingController.getPreferences);

/**
 * PUT /preferences
 * Update user's housing preferences
 */
router.put('/preferences', authenticate, housingController.updatePreferences);

/**
 * GET /saved
 * Get user's saved/favorite platforms
 */
router.get('/saved', authenticate, housingController.getSavedPlatforms);

/**
 * POST /saved
 * Save a platform to favorites
 */
router.post('/saved', authenticate, housingController.savePlatform);

/**
 * DELETE /saved/:platformId
 * Remove a platform from favorites
 */
router.delete('/saved/:platformId', authenticate, housingController.removeSavedPlatform);

export default router;
