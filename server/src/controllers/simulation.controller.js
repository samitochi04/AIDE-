import { simulationService } from '../services/simulation.service.js';
import { formatResponse } from '../utils/helpers.js';
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

    // Run simulation
    const results = await simulationService.runSimulation(answers, language);

    // Save for logged-in users
    if (req.user?.id) {
      await simulationService.saveSimulation(req.user.id, answers, results);
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
