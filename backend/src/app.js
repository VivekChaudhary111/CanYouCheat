const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Connect to database for AI proctoring system
connectDB();

// Middleware for AI proctoring system
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Increased limits for AI proctoring data (webcam frames, audio)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Trust proxy for deployment
app.set('trust proxy', 1);

// Initialize Passport AFTER body parsing middleware
console.log('🔧 Initializing Passport for AI Proctoring Authentication...');
const passport = require('./config/passport');
app.use(passport.initialize());

// Routes for AI-Enhanced Exam Proctoring System
app.use('/api/auth', require('./routes/authRoutes'));

// Health check endpoint for AI proctoring system
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI-Enhanced Exam Proctoring System API', 
    status: 'Running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'Face Detection and Tracking',
      'Eye Movement Analysis', 
      'Voice and Background Noise Detection',
      'Multiple-Person Detection',
      'Browser Activity Monitoring',
      'AI Risk Scoring'
    ],
    endpoints: {
      auth: '/api/auth'
    }
  });
});

// API status endpoint for AI proctoring monitoring
app.get('/api/status', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'connected',
      passport: 'configured',
      ai_analysis: 'ready'
    }
  });
});

// Middleware to make Socket.IO available in routes
app.use((req, res, next) => {
  req.io = app.get('io');
  next();
});

// Global error handling middleware for AI proctoring system
app.use((err, req, res, next) => {
  console.error('🚨 Unhandled error in AI Proctoring System:', err);
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({ 
    message: err.message || 'Something went wrong in the proctoring system!',
    error: isDevelopment ? err.stack : {},
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown'
  });
});

// Handle 404 routes for AI proctoring API
app.use((req, res) => {
  res.status(404).json({ 
    message: 'AI Proctoring API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /',
      'GET /api/status',
      'POST /api/auth/register',
      'POST /api/auth/login'
    ]
  });
});

module.exports = app;