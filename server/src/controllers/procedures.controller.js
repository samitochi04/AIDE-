import { proceduresService } from '../services/procedures.service.js';
import { subscriptionService } from '../services/subscription.service.js';
import { formatResponse } from '../utils/helpers.js';

/**
 * Get user's tracked procedures
 * GET /api/procedures
 */
export const getUserProcedures = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, category } = req.query;
    
    const procedures = await proceduresService.getUserProcedures(userId, { status, category });
    
    // Include limit info
    const limitCheck = await subscriptionService.canTrackProcedure(userId);
    
    res.json(formatResponse({
      procedures,
      usage: {
        current: limitCheck.current,
        limit: limitCheck.limit,
        remaining: limitCheck.remaining,
        tier: limitCheck.tier,
        unlimited: limitCheck.limit === Infinity,
      },
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get recommended procedures based on user's profile
 * GET /api/procedures/recommended
 */
export const getRecommendedProcedures = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const procedures = await proceduresService.getRecommendedProcedures(userId);
    res.json(formatResponse(procedures));
  } catch (error) {
    next(error);
  }
};

/**
 * Get procedures from knowledge base
 * GET /api/procedures/knowledge/:category
 */
export const getKnowledgeBaseProcedures = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { subcategory, section } = req.query;
    
    const procedures = await proceduresService.getKnowledgeBaseProcedures(category, subcategory, section);
    res.json(formatResponse(procedures));
  } catch (error) {
    next(error);
  }
};

/**
 * Start tracking a new procedure
 * POST /api/procedures
 */
export const createProcedure = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const procedureData = req.body;
    
    // Check if user can track more procedures
    const limitCheck = await subscriptionService.canTrackProcedure(userId);
    if (!limitCheck.allowed) {
      return res.status(403).json(formatResponse({
        error: 'limit_exceeded',
        ...limitCheck,
        upgradeUrl: '/pricing',
      }, limitCheck.message));
    }
    
    const procedure = await proceduresService.createProcedure(userId, procedureData);
    res.status(201).json(formatResponse(procedure));
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific procedure
 * GET /api/procedures/:id
 */
export const getProcedureById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const procedure = await proceduresService.getProcedureById(userId, id);
    
    if (!procedure) {
      return res.status(404).json({
        success: false,
        error: 'Procedure not found',
      });
    }
    
    res.json(formatResponse(procedure));
  } catch (error) {
    next(error);
  }
};

/**
 * Update procedure
 * PATCH /api/procedures/:id
 */
export const updateProcedure = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;
    
    const procedure = await proceduresService.updateProcedure(userId, id, updates);
    
    if (!procedure) {
      return res.status(404).json({
        success: false,
        error: 'Procedure not found',
      });
    }
    
    res.json(formatResponse(procedure));
  } catch (error) {
    next(error);
  }
};

/**
 * Complete a step
 * PATCH /api/procedures/:id/step
 */
export const completeStep = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { stepIndex, completed } = req.body;
    
    const procedure = await proceduresService.completeStep(userId, id, stepIndex, completed);
    
    if (!procedure) {
      return res.status(404).json({
        success: false,
        error: 'Procedure not found',
      });
    }
    
    res.json(formatResponse(procedure));
  } catch (error) {
    next(error);
  }
};

/**
 * Mark document as uploaded
 * PATCH /api/procedures/:id/document
 */
export const markDocumentUploaded = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { documentIndex, uploaded } = req.body;
    
    const procedure = await proceduresService.markDocumentUploaded(userId, id, documentIndex, uploaded);
    
    if (!procedure) {
      return res.status(404).json({
        success: false,
        error: 'Procedure not found',
      });
    }
    
    res.json(formatResponse(procedure));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a procedure
 * DELETE /api/procedures/:id
 */
export const deleteProcedure = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await proceduresService.deleteProcedure(userId, id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Procedure not found',
      });
    }
    
    res.json(formatResponse({ message: 'Procedure deleted successfully' }));
  } catch (error) {
    next(error);
  }
};
