import { Router } from 'express';

// Import all route modules
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import stripeRoutes from './stripe.routes.js';
import aiRoutes from './ai.routes.js';
import adminRoutes from './admin.routes.js';
import analyticsRoutes from './analytics.routes.js';
import affiliateRoutes from './affiliate.routes.js';
import contactRoutes from './contact.routes.js';
import simulationRoutes from './simulation.routes.js';
import proceduresRoutes from './procedures.routes.js';
import housingRoutes from './housing.routes.js';
import profileRoutes from './profile.routes.js';
import contentRoutes from './content.routes.js';
import subscriptionRoutes from './subscription.routes.js';

const router = Router();

// API version prefix
const API_VERSION = '/api/v1';

/**
 * Mount all routes
 */
export const mountRoutes = (app) => {
  // Health check (no version prefix)
  app.use('/health', healthRoutes);

  // API routes
  app.use(`${API_VERSION}/auth`, authRoutes);
  app.use(`${API_VERSION}/stripe`, stripeRoutes);
  app.use(`${API_VERSION}/ai`, aiRoutes);
  app.use(`${API_VERSION}/admin`, adminRoutes);
  app.use(`${API_VERSION}/analytics`, analyticsRoutes);
  app.use(`${API_VERSION}/affiliate`, affiliateRoutes);
  app.use(`${API_VERSION}/contact`, contactRoutes);
  app.use(`${API_VERSION}/simulation`, simulationRoutes);
  app.use(`${API_VERSION}/procedures`, proceduresRoutes);
  app.use(`${API_VERSION}/housing`, housingRoutes);
  app.use(`${API_VERSION}/profile`, profileRoutes);
  app.use(`${API_VERSION}/content`, contentRoutes);
  app.use(`${API_VERSION}/subscription`, subscriptionRoutes);

  return app;
};

export default router;
