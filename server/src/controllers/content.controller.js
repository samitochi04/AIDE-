/**
 * Content Controller (Public)
 * Handles public content endpoints for blog, tutorials, guides, etc.
 */

import { contentRepository } from '../repositories/admin.repository.js';
import { supabaseAdmin as supabase } from '../config/supabase.js';
import { subscriptionService } from '../services/subscription.service.js';

/**
 * Get published content with filters
 * GET /content
 */
export const getPublishedContent = async (req, res, next) => {
  try {
    const {
      type,
      category,
      language,
      featured,
      page = 1,
      limit = 12,
    } = req.query;

    const result = await contentRepository.findPublished({
      page: parseInt(page),
      limit: parseInt(limit),
      contentType: type,
      category,
      language,
      featured: featured === 'true',
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Failed to get published content:', error.message);
    next(error);
  }
};

/**
 * Get featured content
 * GET /content/featured
 */
export const getFeaturedContent = async (req, res, next) => {
  try {
    const { language, limit = 5 } = req.query;

    const result = await contentRepository.findPublished({
      page: 1,
      limit: parseInt(limit),
      language,
      featured: true,
    });

    res.json({
      success: true,
      data: result.contents,
    });
  } catch (error) {
    console.error('Failed to get featured content:', error.message);
    next(error);
  }
};

/**
 * Get content by type
 * GET /content/types/:type
 */
export const getContentByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { language, page = 1, limit = 12 } = req.query;

    // Validate type
    const validTypes = ['article', 'tutorial', 'guide', 'video', 'image', 'infographic'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid content type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const result = await contentRepository.findPublished({
      page: parseInt(page),
      limit: parseInt(limit),
      contentType: type,
      language,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Failed to get content by type:', req.params.type, error.message);
    next(error);
  }
};

/**
 * Get single content by slug
 * GET /content/slug/:slug
 */
export const getContentBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const userId = req.user?.id;

    const content = await contentRepository.findBySlug(slug);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    // Only return published content to non-admin users
    if (!content.is_published) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    // Track content access for authenticated users (no limit check - all content is free)
    if (userId) {
      // Track content access for analytics (not for limiting)
      await subscriptionService.trackContentAccess(userId, content.id);
      
      // Check if user has liked this content
      const { data: userLike } = await supabase
        .from('content_likes')
        .select('id')
        .eq('content_id', content.id)
        .eq('user_id', userId)
        .single();
      
      content.user_has_liked = !!userLike;
    }

    res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error('Failed to get content by slug:', req.params.slug, error.message);
    next(error);
  }
};

/**
 * Track content view
 * POST /content/:id/view
 */
export const trackView = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;

    // Call RPC to increment views (handles both contents.view_count and content_views table)
    const { error } = await supabase.rpc('increment_content_views', {
      p_content_id: id,
      p_user_id: userId,
    });

    if (error) {
      console.warn('RPC increment_content_views failed, using fallback:', error.message);
      // Fallback: just update the view_count directly using SQL increment
      const { error: updateError } = await supabase
        .from('contents')
        .update({ view_count: supabase.raw ? supabase.raw('COALESCE(view_count, 0) + 1') : 1 })
        .eq('id', id);
      
      if (updateError) {
        // Final fallback - fetch and increment
        const { data: content } = await supabase
          .from('contents')
          .select('view_count')
          .eq('id', id)
          .single();
        
        if (content) {
          await supabase
            .from('contents')
            .update({ view_count: (content.view_count || 0) + 1 })
            .eq('id', id);
        }
      }
    }

    res.json({
      success: true,
      message: 'View tracked',
    });
  } catch (error) {
    console.error('Failed to track content view:', req.params.id, error.message);
    // Don't fail the request for view tracking
    res.json({
      success: true,
      message: 'View tracked',
    });
  }
};

/**
 * Like content
 * POST /content/:id/like
 */
export const likeContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to like content',
      });
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('content_likes')
      .select('id')
      .eq('content_id', id)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike - the trigger will handle decrementing like_count
      await supabase
        .from('content_likes')
        .delete()
        .eq('content_id', id)
        .eq('user_id', userId);

      // Get updated like count
      const { data: content } = await contentRepository.findById(id);

      res.json({
        success: true,
        data: { 
          liked: false,
          like_count: content?.like_count || 0,
        },
      });
    } else {
      // Like - the trigger will handle incrementing like_count
      await supabase
        .from('content_likes')
        .insert({ content_id: id, user_id: userId });

      // Get updated like count
      const { data: content } = await contentRepository.findById(id);

      res.json({
        success: true,
        data: { 
          liked: true,
          like_count: content?.like_count || 0,
        },
      });
    }
  } catch (error) {
    console.error('Failed to like content:', req.params.id, error.message);
    next(error);
  }
};

/**
 * Check if user has liked content
 * GET /content/:id/like-status
 */
export const getLikeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.json({
        success: true,
        data: { liked: false },
      });
    }

    const { data: existingLike } = await supabase
      .from('content_likes')
      .select('id')
      .eq('content_id', id)
      .eq('user_id', userId)
      .single();

    res.json({
      success: true,
      data: { liked: !!existingLike },
    });
  } catch (error) {
    console.error('Failed to check like status:', req.params.id, error.message);
    res.json({
      success: true,
      data: { liked: false },
    });
  }
};

export const contentController = {
  getPublishedContent,
  getFeaturedContent,
  getContentByType,
  getContentBySlug,
  trackView,
  likeContent,
  getLikeStatus,
};
