const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const { analyzeFrameWithAI } = require('./services/aiService');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO for real-time proctoring
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  // Configuration for AI proctoring - handle large data transfers
  maxHttpBufferSize: 1e8, // 100MB for video frames
  pingTimeout: 60000,
  pingInterval: 25000
});

// Socket.IO connection handling for AI proctoring
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join proctoring session room
  socket.on('join-proctoring-session', (sessionId) => {
    socket.join(sessionId);
    console.log(`👥 Client ${socket.id} joined proctoring session: ${sessionId}`);
  });

  // Handle webcam frames for AI analysis
  socket.on('webcam-frame', async (data) => {
    const { sessionId, frameData, timestamp } = data;

    // Broadcast to proctors monitoring this session
    socket.to(sessionId).emit('student-frame', {
      studentId: socket.id,
      frameData,
      timestamp
    });

    try {
      const base64 = String(frameData).split(',').pop();
      const buffer = Buffer.from(base64, 'base64');
      const aiResult = await analyzeFrameWithAI(buffer);
      socket.to(sessionId).emit('ai-analysis-result', {
        studentId: socket.id,
        result: aiResult,
        timestamp
      });
    } catch (err) {
      console.error('AI analysis error:', err.message);
    }
  });

  // Handle AI analysis results
  socket.on('ai-analysis-result', (data) => {
    const { sessionId, riskScore, behaviors, timestamp } = data;
    
    // Alert proctors if risk score is high
    if (riskScore > 70) {
      socket.to(sessionId).emit('risk-alert', {
        studentId: socket.id,
        riskScore,
        behaviors,
        timestamp,
        alertLevel: riskScore > 90 ? 'critical' : 'warning'
      });
    }
  });

  // Handle screen sharing for exam monitoring
  socket.on('screen-share', (data) => {
    const { sessionId, screenData } = data;
    socket.to(sessionId).emit('student-screen', {
      studentId: socket.id,
      screenData
    });
  });

  // Handle exam events
  socket.on('exam-event', (data) => {
    const { sessionId, eventType, eventData } = data;
    console.log(`📝 Exam event: ${eventType} in session ${sessionId}`);
    
    // Log exam events for analysis
    socket.to(sessionId).emit('exam-activity', {
      studentId: socket.id,
      eventType,
      eventData,
      timestamp: new Date()
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });

  // Handle proctoring session end
  socket.on('end-proctoring-session', (sessionId) => {
    socket.leave(sessionId);
    console.log(`🔚 Proctoring session ended: ${sessionId}`);
  });
});

// Make io available to other parts of the application
app.set('io', io);

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 AI-Enhanced Exam Proctoring Server is running on port ${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO ready for real-time proctoring`);
  console.log(`🤖 AI behavior analysis endpoints active`);
  console.log(`🎥 Webcam monitoring ready`);
  console.log(`🔒 Secure proctoring session management enabled`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});