import { Router } from 'express';
import * as simulationController from '../controllers/simulation.controller.js';
import { authenticate, optionalAuth } from '../middlewares/index.js';

const router = Router();

/**
 * @route   POST /simulation/run
 * @desc    Run a simulation to find eligible aides
 * @access  Public (results saved if authenticated)
 */
router.post('/run', optionalAuth, simulationController.runSimulation);

/**
 * @route   GET /simulation/history
 * @desc    Get user's simulation history
 * @access  Private
 */
router.get('/history', authenticate, simulationController.getSimulationHistory);

/**
 * @route   GET /simulation/:id
 * @desc    Get a specific simulation by ID
 * @access  Private
 */
router.get('/:id', authenticate, simulationController.getSimulationById);

export default router;
