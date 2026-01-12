import { simulationService } from '../services/simulation.service.js';
import { subscriptionService } from '../services/subscription.service.js';
import { formatResponse } from '../utils/helpers.js';
import { TIER_LIMITS } from '../utils/constants.js';
import logger from '../utils/logger.js';

/**
 * Run simulation for user
 * POST /api/simulation/run
 */
export const runSimulation = async (req, res, next) => {
  try {
    const { answers, language = 'fr' } = req.body;

    // Validate required fields
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid answers provided',
      });
    }

    // Get user's tier and limits
    let tier = 'free';
    let limits = TIER_LIMITS.free;
    
    if (req.user?.id) {
      const userLimits = await subscriptionService.getUserLimits(req.user.id);
      tier = userLimits.tier;
      limits = userLimits.limits;
      
      // Check simulation limit
      const limitCheck = await subscriptionService.canRunSimulation(req.user.id);
      if (!limitCheck.allowed) {
        return res.status(403).json(formatResponse({
          error: 'limit_exceeded',
          ...limitCheck,
          upgradeUrl: '/pricing',
        }, limitCheck.message));
      }
    }

    // Run simulation
    const results = await simulationService.runSimulation(answers, language);

    // Limit aides based on tier
    const aidesLimit = limits.aides || 3;
    const allAides = results.eligibleAides || [];
    const totalAides = allAides.length;
    
    if (!limits.allAides && aidesLimit > 0 && totalAides > aidesLimit) {
      // Limit the number of aides shown
      results.eligibleAides = allAides.slice(0, aidesLimit);
      results.aidesLimited = true;
      results.totalAidesAvailable = totalAides;
      results.aidesShown = aidesLimit;
      
      // Recalculate totals based on limited aides
      results.totalMonthly = results.eligibleAides.reduce(
        (sum, aide) => sum + (aide.monthlyAmount || 0),
        0
      );
      results.totalAnnual = results.totalMonthly * 12;
      
      // Add info about hidden aides
      const hiddenAides = allAides.slice(aidesLimit);
      results.hiddenAidesMonthly = hiddenAides.reduce(
        (sum, aide) => sum + (aide.monthlyAmount || 0),
        0
      );
      results.upgradeMessage = language === 'fr'
        ? `Il y a ${totalAides - aidesLimit} autres aides disponibles ! Passez à un forfait supérieur pour les découvrir.`
        : `There are ${totalAides - aidesLimit} more benefits available! Upgrade to discover them.`;
    }

    // Save for logged-in users
    if (req.user?.id) {
      await simulationService.saveSimulation(req.user.id, answers, results);
    }

    // Include usage info if user is logged in
    if (req.user?.id) {
      const limitCheck = await subscriptionService.canRunSimulation(req.user.id);
      results.usage = {
        remaining: limitCheck.remaining,
        limit: limitCheck.limit,
        tier: tier,
        unlimited: limitCheck.limit === Infinity,
        aidesLimit: limits.allAides ? 'unlimited' : aidesLimit,
      };
    }

    res.json(formatResponse(results));
  } catch (error) {
    logger.error('Simulation controller error', { error: error.message });
    next(error);
  }
};

/**
 * Get simulation history for user
 * GET /api/simulation/history
 */
export const getSimulationHistory = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.id;

    const history = await simulationService.getSimulationHistory(userId, parseInt(limit));

    res.json(formatResponse(history));
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's latest simulation
 * GET /api/simulation/latest
 */
export const getLatestSimulation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const simulation = await simulationService.getLatestSimulation(userId);

    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'No simulation found. Please run a simulation first.',
      });
    }

    res.json(formatResponse(simulation));
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific simulation by ID
 * GET /api/simulation/:id
 */
export const getSimulationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const simulation = await simulationService.getSimulationById(userId, id);

    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found',
      });
    }

    res.json(formatResponse(simulation));
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's saved aides
 * GET /api/simulation/saved-aides
 */
export const getSavedAides = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const savedAides = await simulationService.getSavedAides(userId);

    res.json(formatResponse(savedAides));
  } catch (error) {
    next(error);
  }
};

/**
 * Save/bookmark an aide
 * POST /api/simulation/save-aide
 */
export const saveAide = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { aide, simulationId } = req.body;

    if (!aide || !aide.id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid aide data provided',
      });
    }

    // Check if user can save more aides
    const limitCheck = await subscriptionService.canSaveAide(userId);
    if (!limitCheck.allowed) {
      return res.status(403).json(formatResponse({
        error: 'limit_exceeded',
        ...limitCheck,
        upgradeUrl: '/pricing',
      }, limitCheck.message));
    }

    const savedAide = await simulationService.saveAide(userId, aide, simulationId);

    res.json(formatResponse({
      ...savedAide,
      usage: {
        current: limitCheck.current + 1,
        limit: limitCheck.limit,
        remaining: limitCheck.remaining - 1,
        tier: limitCheck.tier,
        unlimited: limitCheck.limit === Infinity,
      },
    }));
  } catch (error) {
    // Handle duplicate error gracefully
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        error: 'Aide already saved',
      });
    }
    next(error);
  }
};

/**
 * Remove a saved aide
 * DELETE /api/simulation/saved-aides/:aideId
 */
export const unsaveAide = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { aideId } = req.params;

    await simulationService.unsaveAide(userId, aideId);

    res.json(formatResponse({ message: 'Aide removed from saved list' }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update saved aide status
 * PATCH /api/simulation/saved-aides/:aideId/status
 */
export const updateSavedAideStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { aideId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['saved', 'applied', 'received', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updatedAide = await simulationService.updateSavedAideStatus(userId, aideId, status, notes);

    res.json(formatResponse(updatedAide));
  } catch (error) {
    next(error);
  }
};
