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
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co", "https://api.stripe.com", "https://api.openai.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for Stripe
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // For OAuth popups
  crossOriginResourcePolicy: { policy: "cross-origin" }, // For CDN resources
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));

// CORS configuration with stricter production settings
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'https://aideplus.eu',
      'https://www.aideplus.eu',
    ];
    
    // Allow requests with no origin (mobile apps, curl, etc.) in development
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'stripe-signature'],
  maxAge: 86400, // Cache preflight for 24 hours
};
app.use(cors(corsOptions));

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
