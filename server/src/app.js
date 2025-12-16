import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { mountRoutes } from './routes/index.js';
import logger from './utils/logger.js';
import { schedulerService } from './services/scheduler.service.js';

const app = express();

// ===========================================
// Security Middlewares
// ===========================================
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ===========================================
// Body Parsing
// ===========================================
// Raw body for Stripe webhooks (must be before express.json())
app.use('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }));

// JSON parsing for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===========================================
// Compression
// ===========================================
app.use(compression());

// ===========================================
// Request Logging
// ===========================================
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });
  
  next();
});

// ===========================================
// Health Check
// ===========================================
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AIDE+ API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ===========================================
// API Routes
// ===========================================
mountRoutes(app);

// ===========================================
// Start Scheduler Service (for email reminders)
// ===========================================
if (process.env.NODE_ENV === 'production') {
  schedulerService.start();
  logger.info('Scheduler service started for production');
}

// ===========================================
// Error Handling
// ===========================================
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
