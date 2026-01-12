import { Router } from 'express';
import { formatResponse } from '../utils/helpers.js';

const router = Router();

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json(
    formatResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    })
  );
});

/**
 * @route   GET /health/ready
 * @desc    Readiness check (for k8s/docker)
 * @access  Public
 */
router.get('/ready', (req, res) => {
  // Add database connectivity check here if needed
  res.json(
    formatResponse({
      status: 'ready',
      timestamp: new Date().toISOString(),
    })
  );
});

/**
 * @route   GET /health/live
 * @desc    Liveness check (for k8s/docker)
 * @access  Public
 */
router.get('/live', (req, res) => {
  res.json(
    formatResponse({
      status: 'live',
      timestamp: new Date().toISOString(),
    })
  );
});

export default router;
