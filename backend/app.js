const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/errorHandler');
const { createRateLimiter } = require('./middleware/rateLimit');

const createApp = () => {
  const app = express();
  app.disable('x-powered-by');

  app.set('trust proxy', 1);

  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: Number(process.env.AUTH_RATE_LIMIT_MAX) || 25,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  });

  const writeRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: Number(process.env.WRITE_RATE_LIMIT_MAX) || 120,
    message: 'Too many write requests. Please slow down and try again.',
    skip: (req) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
  });

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      const corsError = new Error('Origin not allowed by CORS');
      corsError.statusCode = 403;
      return callback(corsError);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(writeRateLimiter);

  app.use('/api/auth', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  }, authRateLimiter, require('./routes/authRoutes'));

  app.use('/api/deals', require('./routes/dealRoutes'));
  app.use('/api/payments', require('./routes/paymentRoutes'));

  app.get('/api/health', (req, res) => {
    const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const dbStatus = dbStates[mongoose.connection.readyState] || 'unknown';

    res.json({
      status: 'ok',
      message: 'PropLedger API is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
    });
  });

  app.get('/api/ready', (req, res) => {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'not_ready',
        database: 'disconnected',
      });
    }

    return res.json({
      status: 'ready',
      database: 'connected',
    });
  });

  // In split deployment (frontend on Vercel, backend on Render),
  // the backend only serves API routes — never static files.
  app.get('/', (req, res) => {
    res.json({
      message: 'PropLedger API - Land Deal Management System',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        ready: '/api/ready',
        auth: '/api/auth',
        deals: '/api/deals',
        payments: '/api/payments',
      },
    });
  });


  app.use('/api', (req, res) => {
    res.status(404).json({ message: 'API route not found' });
  });

  app.use(errorHandler);

  return app;
};

module.exports = createApp;
