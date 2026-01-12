import { Router } from 'express';
import * as proceduresController from '../controllers/procedures.controller.js';
import { authenticate } from '../middlewares/index.js';

const router = Router();

/**
 * @route   GET /procedures
 * @desc    Get user's tracked procedures
 * @access  Private
 */
router.get('/', authenticate, proceduresController.getUserProcedures);

/**
 * @route   GET /procedures/recommended
 * @desc    Get recommended procedures based on user's profile/simulation
 * @access  Private
 */
router.get('/recommended', authenticate, proceduresController.getRecommendedProcedures);

/**
 * @route   GET /procedures/knowledge/:category
 * @desc    Get procedures from knowledge base by category
 * @access  Private
 */
router.get('/knowledge/:category', authenticate, proceduresController.getKnowledgeBaseProcedures);

/**
 * @route   POST /procedures
 * @desc    Start tracking a new procedure
 * @access  Private
 */
router.post('/', authenticate, proceduresController.createProcedure);

/**
 * @route   GET /procedures/:id
 * @desc    Get a specific procedure
 * @access  Private
 */
router.get('/:id', authenticate, proceduresController.getProcedureById);

/**
 * @route   PATCH /procedures/:id
 * @desc    Update procedure (status, progress, steps, etc.)
 * @access  Private
 */
router.patch('/:id', authenticate, proceduresController.updateProcedure);

/**
 * @route   PATCH /procedures/:id/step
 * @desc    Mark a step as completed
 * @access  Private
 */
router.patch('/:id/step', authenticate, proceduresController.completeStep);

/**
 * @route   PATCH /procedures/:id/document
 * @desc    Mark a document as uploaded
 * @access  Private
 */
router.patch('/:id/document', authenticate, proceduresController.markDocumentUploaded);

/**
 * @route   DELETE /procedures/:id
 * @desc    Delete/remove a procedure
 * @access  Private
 */
router.delete('/:id', authenticate, proceduresController.deleteProcedure);

export default router;
