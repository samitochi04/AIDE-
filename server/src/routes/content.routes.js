/**
 * Content Routes (Public)
 * Public endpoints for blog posts, tutorials, guides, and other content
 */

import { Router } from 'express';
import { contentController } from '../controllers/content.controller.js';
import { optionalAuth } from '../middlewares/auth.js';

const router = Router();

// ===========================================
// Public Routes (no auth required)
// ===========================================

/**
 * GET /
 * Get published content with optional filters
 * Query params: type, category, language, featured, page, limit
 */
router.get('/', contentController.getPublishedContent);

/**
 * GET /featured
 * Get featured content
 */
router.get('/featured', contentController.getFeaturedContent);

/**
 * GET /types/:type
 * Get content by type (article, guide, video, image, infographic)
 */
router.get('/types/:type', contentController.getContentByType);

/**
 * GET /slug/:slug
 * Get single content by slug
 */
router.get('/slug/:slug', optionalAuth, contentController.getContentBySlug);

/**
 * POST /:id/view
 * Track content view
 */
router.post('/:id/view', optionalAuth, contentController.trackView);

/**
 * POST /:id/like
 * Like content (requires auth)
 */
router.post('/:id/like', optionalAuth, contentController.likeContent);

export default router;
