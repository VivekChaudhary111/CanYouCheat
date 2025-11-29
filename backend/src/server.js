const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// CORS Configuration for Production
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'https://your-frontend.vercel.app',
    'http://localhost:3000', // For development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'CanYouCheat Backend',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/proctoring', require('./routes/proctoringRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Create HTTP server
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Setup proctoring socket
const setupProctoringSocket = require('./socket/proctoringSocket');
setupProctoringSocket(io);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 10000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CanYouCheat Backend Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📡 Socket.IO ready for connections`);
});

module.exports = { app, server, io };