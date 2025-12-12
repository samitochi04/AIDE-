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
 * @route   GET /simulation/latest
 * @desc    Get user's latest simulation
 * @access  Private
 */
router.get('/latest', authenticate, simulationController.getLatestSimulation);

/**
 * @route   GET /simulation/saved-aides
 * @desc    Get user's saved/bookmarked aides
 * @access  Private
 */
router.get('/saved-aides', authenticate, simulationController.getSavedAides);

/**
 * @route   POST /simulation/save-aide
 * @desc    Save/bookmark an aide
 * @access  Private
 */
router.post('/save-aide', authenticate, simulationController.saveAide);

/**
 * @route   DELETE /simulation/saved-aides/:aideId
 * @desc    Remove a saved aide
 * @access  Private
 */
router.delete('/saved-aides/:aideId', authenticate, simulationController.unsaveAide);

/**
 * @route   PATCH /simulation/saved-aides/:aideId/status
 * @desc    Update saved aide status (applied, received, rejected)
 * @access  Private
 */
router.patch('/saved-aides/:aideId/status', authenticate, simulationController.updateSavedAideStatus);

/**
 * @route   GET /simulation/:id
 * @desc    Get a specific simulation by ID
 * @access  Private
 */
router.get('/:id', authenticate, simulationController.getSimulationById);

export default router;
