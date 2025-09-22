// Socket.IO handler for real-time proctoring
const BehaviorAnalyzer = require('../ai/behaviorAnalyzer');
const RiskScorer = require('../ai/riskScorer');

class ProctoringSocket {
  constructor(io) {
    this.io = io;
    this.behaviorAnalyzer = new BehaviorAnalyzer();
    this.riskScorer = new RiskScorer();
    this.activeSessions = new Map();
  }

  // Initialize socket connections
  initialize() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Start proctoring session
      socket.on('start-proctoring', (data) => {
        this.startProctoringSession(socket, data);
      });

      // Handle webcam feed
      socket.on('webcam-feed', (data) => {
        this.processWebcamFeed(socket, data);
      });

      // Handle audio data
      socket.on('audio-data', (data) => {
        this.processAudioData(socket, data);
      });

      // Handle browser activity
      socket.on('browser-activity', (data) => {
        this.processBrowserActivity(socket, data);
      });

      // End proctoring session
      socket.on('end-proctoring', () => {
        this.endProctoringSession(socket);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  // Start a new proctoring session
  startProctoringSession(socket, data) {
    const sessionId = `session_${Date.now()}_${socket.id}`;
    const session = {
      sessionId,
      userId: data.userId,
      examId: data.examId,
      startTime: new Date(),
      analyses: [],
      alerts: []
    };

    this.activeSessions.set(socket.id, session);
    
    socket.emit('proctoring-started', {
      sessionId,
      message: 'Proctoring session started successfully'
    });

    console.log(`Proctoring session started: ${sessionId}`);
  }

  // Process webcam feed data
  processWebcamFeed(socket, data) {
    const session = this.activeSessions.get(socket.id);
    if (!session) return;

    // Simulate face detection data
    const faceAnalysis = this.behaviorAnalyzer.analyzeFaceDetection(data.faceData);
    const eyeAnalysis = this.behaviorAnalyzer.analyzeEyeMovement(data.eyeData);

    // Store analyses
    session.analyses.push(faceAnalysis, eyeAnalysis);

    // Check for alerts
    if (faceAnalysis.alert || eyeAnalysis.alert) {
      const alert = {
        timestamp: new Date(),
        type: 'webcam',
        analyses: [faceAnalysis, eyeAnalysis],
        severity: Math.max(faceAnalysis.riskScore, eyeAnalysis.riskScore) > 0.8 ? 'high' : 'medium'
      };

      session.alerts.push(alert);
      
      // Emit alert to proctor dashboard
      socket.broadcast.emit('risk-alert', {
        sessionId: session.sessionId,
        alert
      });
    }

    // Send risk update to student
    socket.emit('risk-update', {
      riskScore: Math.max(faceAnalysis.riskScore, eyeAnalysis.riskScore),
      analyses: [faceAnalysis, eyeAnalysis]
    });
  }

  // Process audio data
  processAudioData(socket, data) {
    const session = this.activeSessions.get(socket.id);
    if (!session) return;

    const audioAnalysis = this.behaviorAnalyzer.analyzeAudio(data);
    session.analyses.push(audioAnalysis);

    if (audioAnalysis.alert) {
      const alert = {
        timestamp: new Date(),
        type: 'audio',
        analysis: audioAnalysis,
        severity: audioAnalysis.riskScore > 0.8 ? 'high' : 'medium'
      };

      session.alerts.push(alert);
      
      socket.broadcast.emit('risk-alert', {
        sessionId: session.sessionId,
        alert
      });
    }
  }

  // Process browser activity
  processBrowserActivity(socket, data) {
    const session = this.activeSessions.get(socket.id);
    if (!session) return;

    const browserAnalysis = this.behaviorAnalyzer.analyzeBrowserActivity(data);
    session.analyses.push(browserAnalysis);

    if (browserAnalysis.alert) {
      const alert = {
        timestamp: new Date(),
        type: 'browser',
        analysis: browserAnalysis,
        severity: browserAnalysis.riskScore > 0.8 ? 'high' : 'medium'
      };

      session.alerts.push(alert);
      
      socket.broadcast.emit('risk-alert', {
        sessionId: session.sessionId,
        alert
      });
    }
  }

  // End proctoring session
  endProctoringSession(socket) {
    const session = this.activeSessions.get(socket.id);
    if (!session) return;

    session.endTime = new Date();
    session.duration = session.endTime - session.startTime;

    // Generate final report
    const report = this.riskScorer.generateRiskReport(
      session.sessionId,
      session.analyses,
      session.duration
    );

    // Save report (you would typically save to database here)
    console.log('Session Report:', report);

    socket.emit('proctoring-ended', {
      report,
      message: 'Proctoring session ended successfully'
    });

    this.activeSessions.delete(socket.id);
  }

  // Handle disconnect
  handleDisconnect(socket) {
    const session = this.activeSessions.get(socket.id);
    if (session) {
      console.log(`Session disconnected: ${session.sessionId}`);
      this.endProctoringSession(socket);
    }
    console.log(`User disconnected: ${socket.id}`);
  }

  // Get active sessions (for admin dashboard)
  getActiveSessions() {
    return Array.from(this.activeSessions.values());
  }
}

module.exports = ProctoringSocket;