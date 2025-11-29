const ProctoringSession = require('../models/ProctoringSession');
const User = require('../models/User');

const setupProctoringSocket = (io) => {
  // Track active connections
  const activeConnections = new Map();

  io.on('connection', (socket) => {
    console.log('🔌 New socket connection:', socket.id, 'from', socket.handshake.address);
    
    // Store connection info
    activeConnections.set(socket.id, {
      connectTime: new Date(),
      userId: null,
      role: null,
      examId: null,
      sessionId: null
    });

    // Socket authentication
    socket.on('authenticate', async (authData) => {
      try {
        console.log('🔐 Socket authentication attempt:', { 
          hasToken: !!authData?.token,
          userId: authData?.userId,
          role: authData?.role,
          socketId: socket.id
        });

        const { token, userId, role } = authData;
        
        if (!token || !userId || !role) {
          console.log('❌ Missing auth data:', { token: !!token, userId, role });
          socket.emit('auth-error', { message: 'Missing authentication data' });
          return;
        }

        // Verify JWT token
        const jwt = require('jsonwebtoken');
        let decoded;
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
          console.error('❌ JWT verification failed:', jwtError.message);
          socket.emit('auth-error', { message: 'Invalid token' });
          return;
        }
        
        if (decoded.id !== userId) {
          socket.emit('auth-error', { message: 'Token user mismatch' });
          return;
        }

        // Get user details from database
        const user = await User.findById(userId).select('name email role');
        if (!user) {
          socket.emit('auth-error', { message: 'User not found' });
          return;
        }

        // Store user info on socket
        socket.userId = userId;
        socket.userRole = role;
        socket.userName = user.name;
        socket.userEmail = user.email;
        socket.authenticated = true;
        
        // Update connection tracking
        const connectionInfo = activeConnections.get(socket.id);
        if (connectionInfo) {
          connectionInfo.userId = userId;
          connectionInfo.role = role;
          activeConnections.set(socket.id, connectionInfo);
        }
        
        console.log(`✅ Socket authenticated: ${user.name} (${userId}) as ${role}`);
        socket.emit('authenticated', { 
          success: true, 
          userId, 
          role,
          userName: user.name,
          socketId: socket.id 
        });

      } catch (error) {
        console.error('❌ Socket authentication error:', error.message);
        socket.emit('auth-error', { message: 'Authentication failed: ' + error.message });
      }
    });

    // ================================
    // STUDENT EVENTS
    // ================================
    
    // Student joins proctoring session
    socket.on('join-proctoring-session', async (data) => {
      try {
        if (socket.userRole !== 'student') {
          socket.emit('error', { message: 'Only students can join proctoring sessions' });
          return;
        }

        if (!socket.authenticated) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        const { sessionId, examId } = data;
        
        console.log('👤 Student joining proctoring session:', {
          userName: socket.userName,
          userId: socket.userId,
          sessionId,
          examId,
          socketId: socket.id
        });

        // Verify session belongs to this student
        // NEW CODE (with proper debugging and fallback):
        console.log('🔍 Verifying session:', {
          sessionId,
          socketUserId: socket.userId,
          examId
        });

        // First, try to find the session
        let session = await ProctoringSession.findOne({
          userId: socket.userId,
          examId: examId,
          status: { $in: ['active', 'paused'] }
        });

        console.log('📋 Session lookup result:', {
          sessionFound: !!session,
          sessionId: session?._id,
          userId: session?.userId?.toString(),
          socketUserId: socket.userId
        });

        // If session doesn't exist or doesn't match, try to create one
        if (!session) {
          console.log('🆕 Creating new proctoring session...');
          
          try {
            session = new ProctoringSession({
              userId: socket.userId,
              examId: examId,
              startTime: new Date(),
              status: 'active',
              riskScore: 0,
              frameAnalyses: [],
              alerts: []
            });
            
            await session.save();
            console.log('✅ New proctoring session created:', session._id);
            
          } catch (createError) {
            console.error('❌ Failed to create proctoring session:', createError);
            
            // Try to find if one was created by another process
            session = await ProctoringSession.findOne({
              userId: socket.userId,
              examId: examId,
              status: { $in: ['active', 'paused'] }
            });
            
            if (!session) {
              socket.emit('proctoring-error', { error: 'Failed to create session: ' + createError.message });
              return;
            }
            
            console.log('✅ Found existing session after creation attempt:', session._id);
          }
        }

        // Join student-specific rooms
        socket.join(`session-${sessionId}`);
        socket.join(`student-${socket.userId}`);
        socket.join(`exam-${examId}-students`);
        
        // Store session info on socket
        socket.sessionId = session._id.toString();
        socket.examId = examId;
        
        // Update connection tracking
        const connectionInfo = activeConnections.get(socket.id);
        if (connectionInfo) {
          connectionInfo.examId = examId;
          connectionInfo.sessionId = sessionId;
          activeConnections.set(socket.id, connectionInfo);
        }

        // Update session status to active
        await ProctoringSession.findByIdAndUpdate(sessionId, {
          status: 'active',
          lastActivity: new Date()
        });
        
        // Notify instructors monitoring this exam
        const notificationData = {
          userId: socket.userId,
          userName: socket.userName,
          userEmail: socket.userEmail,
          sessionId: sessionId,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        };
        
        socket.to(`exam-${examId}-instructors`).emit('student-joined-proctoring', notificationData);
        
        console.log('📡 Notified instructors of student join:', notificationData);

        // Confirm to student
        socket.emit('proctoring-session-joined', {
          success: true,
          sessionId,
          examId,
          message: 'Successfully joined proctoring session',
          capabilities: {
            frameCapture: true,
            behaviorAnalysis: true,
            riskScoring: true,
            liveMonitoring: true
          }
        });

        console.log('✅ Student successfully joined proctoring session');

      } catch (error) {
        console.error('❌ Error joining proctoring session:', error);
        socket.emit('proctoring-error', { error: error.message });
      }
    });

    // Student sends frame analysis (OPTIMIZED)
    socket.on('proctoring-frame-analysis', async (data) => {
      try {
        if (socket.userRole !== 'student' || !socket.authenticated) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        const { sessionId, frameData, analysisData, timestamp } = data;
        
        if (!sessionId || !frameData || !analysisData) {
          socket.emit('proctoring-error', { error: 'Missing required data' });
          return;
        }

        const currentTime = Date.now();
        const riskScore = analysisData?.riskScore || 0;
        
        console.log('📸 Frame analysis received:', {
          student: socket.userName,
          sessionId,
          userId: socket.userId,
          riskScore,
          frameSize: Math.round(frameData.length / 1024) + 'KB',
          timestamp
        });

        // OPTIMIZATION: Selective database storage
        // Store frame if: high risk (>= 50), or every 10th frame, or random 20% sample
        const frameNumber = parseInt(timestamp) || currentTime;
        const shouldStore = (
          riskScore >= 50 || 
          frameNumber % 10 === 0 || 
          Math.random() < 0.2
        );
        
        if (shouldStore) {
          try {
            await ProctoringSession.findByIdAndUpdate(sessionId, {
              $push: {
                frameAnalyses: {
                  timestamp: new Date(timestamp),
                  analysisData,
                  thumbnailData: frameData,
                  metadata: {
                    frameNumber: frameNumber,
                    quality: 'standard',
                    processingTime: analysisData.processingTime || 0,
                    riskScore: riskScore
                  }
                }
              },
              $set: {
                riskScore: riskScore,
                lastActivity: new Date()
              }
            });
            
            console.log('💾 Frame stored to database (risk:', riskScore + ')');
          } catch (dbError) {
            console.error('❌ Database storage error:', dbError.message);
            // Continue processing even if DB fails
          }
        }

        // ALWAYS send live frame to instructors (OPTIMIZED)
        const liveFrameData = {
          userId: socket.userId,
          userName: socket.userName,
          userEmail: socket.userEmail,
          sessionId: sessionId,
          frameData: frameData, // Live feed frame
          analysisData: {
            riskScore: riskScore,
            alerts: analysisData.alerts || [],
            confidence: analysisData.confidence || 0,
            detections: analysisData.detections || []
          },
          timestamp: timestamp,
          studentInfo: {
            name: socket.userName,
            email: socket.userEmail,
            riskScore: riskScore,
            status: 'active',
            lastSeen: new Date().toISOString()
          }
        };

        // Send to all instructors monitoring this exam
        const instructorRoom = `exam-${socket.examId}-instructors`;
        io.to(instructorRoom).emit('student-live-frame', liveFrameData);
        
        // Log instructor broadcast
        const instructorSockets = io.sockets.adapter.rooms.get(instructorRoom);
        const instructorCount = instructorSockets ? instructorSockets.size : 0;
        console.log(`📡 Live frame sent to ${instructorCount} instructor(s)`);

        // HIGH-RISK ALERTS (Critical threshold)
        if (riskScore >= 70) {
          console.log('🚨 HIGH-RISK ACTIVITY DETECTED:', {
            student: socket.userName,
            riskScore,
            alerts: analysisData.alerts
          });
          
          const alertData = {
            alertId: `alert_${currentTime}`,
            userId: socket.userId,
            userName: socket.userName,
            userEmail: socket.userEmail,
            sessionId: sessionId,
            riskScore: riskScore,
            alerts: analysisData.alerts || ['High risk behavior detected'],
            frameData: frameData,
            timestamp: timestamp,
            severity: riskScore >= 90 ? 'critical' : 'high',
            examId: socket.examId
          };
          
          io.to(instructorRoom).emit('high-risk-activity', alertData);
          
          // Store alert in session
          try {
            await ProctoringSession.findByIdAndUpdate(sessionId, {
              $push: {
                alerts: {
                  type: 'high_risk',
                  severity: alertData.severity,
                  message: `High risk behavior: ${riskScore}% risk score`,
                  riskScore: riskScore,
                  timestamp: new Date(timestamp),
                  frameData: frameData
                }
              }
            });
          } catch (alertDbError) {
            console.error('❌ Alert storage error:', alertDbError.message);
          }
        }

        // Acknowledge to student (throttled to reduce network traffic)
        if (frameNumber % 5 === 0) {
          socket.emit('frame-analysis-acknowledged', {
            success: true,
            riskScore: riskScore,
            stored: shouldStore,
            timestamp: new Date().toISOString()
          });
        }

      } catch (error) {
        console.error('❌ Frame analysis error:', error);
        socket.emit('proctoring-error', { error: 'Frame processing failed: ' + error.message });
      }
    });

    // Critical alert from student (tab switch, browser blur, etc.)
    socket.on('critical-alert', async (data) => {
      try {
        if (socket.userRole !== 'student' || !socket.authenticated) return;

        const { alert, violationType, riskScore = 80, timestamp } = data;
        
        console.log('🚨 CRITICAL ALERT from student:', {
          student: socket.userName,
          userId: socket.userId,
          alert,
          violationType,
          riskScore
        });

        const alertData = {
          alertId: `critical_${Date.now()}`,
          userId: socket.userId,
          userName: socket.userName,
          userEmail: socket.userEmail,
          sessionId: socket.sessionId,
          alert: alert,
          violationType: violationType,
          riskScore: riskScore,
          timestamp: timestamp || new Date().toISOString(),
          severity: 'critical',
          examId: socket.examId
        };

        // IMMEDIATE broadcast to all instructors
        io.to(`exam-${socket.examId}-instructors`).emit('critical-alert-broadcast', alertData);

        // Store in database
        try {
          await ProctoringSession.findByIdAndUpdate(socket.sessionId, {
            $push: {
              alerts: {
                type: 'critical',
                severity: 'critical',
                message: alert,
                violationType: violationType,
                riskScore: riskScore,
                timestamp: new Date(timestamp)
              }
            },
            $set: {
              riskScore: Math.max(riskScore, 80), // Critical alerts boost risk
              lastActivity: new Date()
            }
          });
        } catch (dbError) {
          console.error('❌ Critical alert storage error:', dbError.message);
        }

        // Acknowledge to student
        socket.emit('critical-alert-acknowledged', {
          success: true,
          alertId: alertData.alertId,
          message: 'Alert received and forwarded to instructor'
        });

      } catch (error) {
        console.error('❌ Critical alert error:', error);
      }
    });

    // ================================
    // INSTRUCTOR EVENTS
    // ================================
    
    // Instructor joins exam monitoring
    socket.on('join-exam-monitoring', async (data) => {
      try {
        if (socket.userRole !== 'instructor' || !socket.authenticated) {
          socket.emit('error', { message: 'Only instructors can monitor exams' });
          return;
        }

        const { examId, instructorId } = data;
        
        console.log('👨‍🏫 Instructor joining exam monitoring:', {
          instructorName: socket.userName,
          examId,
          instructorId: instructorId || socket.userId,
          socketId: socket.id
        });

        // Join instructor monitoring rooms
        socket.join(`exam-${examId}-instructors`);
        socket.join(`instructor-${instructorId || socket.userId}`);
        
        // Store exam info on socket
        socket.examId = examId;
        socket.instructorId = instructorId || socket.userId;
        
        // Update connection tracking
        const connectionInfo = activeConnections.get(socket.id);
        if (connectionInfo) {
          connectionInfo.examId = examId;
          activeConnections.set(socket.id, connectionInfo);
        }
        
        // Get current active sessions for this exam
        try {
          const activeSessions = await ProctoringSession.find({
            examId,
            status: { $in: ['active', 'paused'] }
          })
          .populate('userId', 'name email')
          .populate('examId', 'title examCode')
          .sort({ startTime: -1 })
          .limit(50) // Limit to prevent overwhelming
          .lean();
          
          const sessionData = activeSessions.map(session => ({
            userId: session.userId?._id,
            sessionId: session._id,
            studentName: session.userId?.name || 'Unknown Student',
            studentEmail: session.userId?.email || '',
            examTitle: session.examId?.title || 'Unknown Exam',
            examCode: session.examId?.examCode || '',
            riskScore: session.riskScore || 0,
            startTime: session.startTime,
            status: session.status,
            frameCount: session.frameAnalyses?.length || 0,
            alertCount: session.alerts?.length || 0,
            lastActivity: session.lastActivity || session.startTime
          }));
          
          socket.emit('current-active-sessions', {
            success: true,
            examId,
            sessions: sessionData,
            totalSessions: sessionData.length,
            timestamp: new Date().toISOString()
          });
          
          console.log(`📊 Sent ${sessionData.length} active sessions to instructor`);
          
        } catch (sessionError) {
          console.error('❌ Error fetching active sessions:', sessionError);
          socket.emit('current-active-sessions', {
            success: false,
            sessions: [],
            error: 'Failed to fetch sessions'
          });
        }
        
        // Notify other instructors
        socket.to(`exam-${examId}-instructors`).emit('instructor-joined', {
          instructorId: socket.instructorId,
          instructorName: socket.userName,
          timestamp: new Date().toISOString()
        });
        
        console.log('✅ Instructor successfully joined exam monitoring');

      } catch (error) {
        console.error('❌ Error joining exam monitoring:', error);
        socket.emit('monitoring-error', { error: error.message });
      }
    });

    // Instructor sends message to student
    socket.on('instructor-message', (data) => {
      try {
        if (socket.userRole !== 'instructor' || !socket.authenticated) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        const { examId, userId, message, timestamp } = data;
        
        if (!examId || !userId || !message?.trim()) {
          socket.emit('error', { message: 'Missing required message data' });
          return;
        }
        
        console.log('💬 Instructor message:', { 
          from: socket.userName,
          examId, 
          toUserId: userId, 
          message: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        });
        
        const messageData = {
          message: message.trim(),
          timestamp: timestamp || new Date().toISOString(),
          instructorId: socket.instructorId || socket.userId,
          instructorName: socket.userName,
          examId: examId,
          messageId: `msg_${Date.now()}`
        };
        
        // Send message to specific student
        const studentRoom = `student-${userId}`;
        io.to(studentRoom).emit('instructor-message', messageData);
        
        // Check if message was delivered
        const studentSockets = io.sockets.adapter.rooms.get(studentRoom);
        const deliveredCount = studentSockets ? studentSockets.size : 0;
        
        console.log(`📨 Message delivered to ${deliveredCount} student socket(s)`);
        
        // Broadcast to other instructors monitoring this exam
        socket.to(`exam-${examId}-instructors`).emit('instructor-action', {
          action: 'message-sent',
          targetStudent: userId,
          message: message.trim(),
          instructorId: socket.instructorId || socket.userId,
          instructorName: socket.userName,
          timestamp: messageData.timestamp,
          delivered: deliveredCount > 0
        });
        
        // Confirm to sending instructor
        socket.emit('message-sent', {
          success: true,
          userId,
          message: message.trim(),
          timestamp: messageData.timestamp,
          messageId: messageData.messageId,
          delivered: deliveredCount > 0
        });

      } catch (error) {
        console.error('❌ Instructor message error:', error);
        socket.emit('error', { error: 'Message sending failed: ' + error.message });
      }
    });

    // Instructor requests student camera feed
    socket.on('request-student-feed', (data) => {
      try {
        if (socket.userRole !== 'instructor' || !socket.authenticated) return;

        const { userId } = data;
        
        if (!userId) {
          socket.emit('error', { message: 'Student ID required' });
          return;
        }
        
        console.log('📹 Instructor requesting student feed:', {
          instructor: socket.userName,
          requestedStudent: userId
        });
        
        const feedRequest = {
          instructorId: socket.instructorId || socket.userId,
          instructorName: socket.userName,
          timestamp: new Date().toISOString(),
          requestId: `feed_${Date.now()}`
        };
        
        // Request latest frame from student
        const studentRoom = `student-${userId}`;
        io.to(studentRoom).emit('feed-requested', feedRequest);
        
        // Check if request was sent
        const studentSockets = io.sockets.adapter.rooms.get(studentRoom);
        const sentCount = studentSockets ? studentSockets.size : 0;
        
        console.log(`📡 Feed request sent to ${sentCount} student socket(s)`);
        
        // Acknowledge to instructor
        socket.emit('feed-request-sent', {
          success: true,
          userId,
          requestId: feedRequest.requestId,
          sent: sentCount > 0
        });

      } catch (error) {
        console.error('❌ Feed request error:', error);
        socket.emit('error', { error: 'Feed request failed' });
      }
    });

    // ================================
    // COMMON EVENTS
    // ================================
    
    // Handle disconnection
    socket.on('disconnect', async (reason) => {
      const connectionInfo = activeConnections.get(socket.id);
      
      console.log('🔌 Socket disconnected:', {
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.userName,
        role: socket.userRole,
        examId: socket.examId,
        reason,
        duration: connectionInfo ? Math.round((Date.now() - connectionInfo.connectTime) / 1000) + 's' : 'unknown'
      });
      
      // Clean up tracking
      activeConnections.delete(socket.id);
      
      if (socket.userRole === 'student' && socket.examId && socket.sessionId) {
        // Notify instructors of student disconnection
        const disconnectionData = {
          userId: socket.userId,
          userName: socket.userName,
          userEmail: socket.userEmail,
          sessionId: socket.sessionId,
          reason: reason,
          timestamp: new Date().toISOString(),
          examId: socket.examId
        };
        
        io.to(`exam-${socket.examId}-instructors`).emit('student-disconnected', disconnectionData);

        // Update session status in database
        try {
          await ProctoringSession.findByIdAndUpdate(socket.sessionId, {
            status: reason === 'client namespace disconnect' ? 'completed' : 'disconnected',
            endTime: new Date(),
            lastActivity: new Date()
          });
        } catch (dbError) {
          console.error('❌ Session update error on disconnect:', dbError.message);
        }
      }
      
      if (socket.userRole === 'instructor' && socket.examId) {
        // Notify other instructors
        socket.to(`exam-${socket.examId}-instructors`).emit('instructor-left', {
          instructorId: socket.instructorId,
          instructorName: socket.userName,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error('❌ Socket error:', {
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.userName,
        error: error.message || error
      });
      
      // Send error info to client
      socket.emit('connection-error', {
        message: 'Connection error occurred',
        timestamp: new Date().toISOString()
      });
    });

    // Ping/Pong for connection health monitoring
    socket.on('ping', () => {
      socket.emit('pong', { 
        timestamp: new Date().toISOString(),
        userId: socket.userId,
        role: socket.userRole
      });
    });

    // Connection health check
    socket.on('health-check', () => {
      const connectionInfo = activeConnections.get(socket.id);
      socket.emit('health-response', {
        connected: true,
        authenticated: socket.authenticated || false,
        userId: socket.userId,
        role: socket.userRole,
        examId: socket.examId,
        sessionId: socket.sessionId,
        uptime: connectionInfo ? Math.round((Date.now() - connectionInfo.connectTime) / 1000) : 0,
        timestamp: new Date().toISOString()
      });
    });

  });

  // Global IO error handling
  io.engine.on('connection_error', (err) => {
    console.error('❌ Socket.IO connection error:', {
      message: err.message,
      code: err.code,
      context: err.context
    });
  });

  // Periodic cleanup of stale connections
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [socketId, info] of activeConnections) {
      const age = now - info.connectTime;
      // Remove connections older than 2 hours without activity
      if (age > 2 * 60 * 60 * 1000) {
        activeConnections.delete(socketId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} stale connection(s), active: ${activeConnections.size}`);
    }
  }, 30 * 60 * 1000); // Run every 30 minutes

  console.log('🔌 Proctoring socket handlers initialized');
  console.log('📊 Socket events configured: authenticate, join-proctoring-session, proctoring-frame-analysis, critical-alert, join-exam-monitoring, instructor-message, request-student-feed');
};

module.exports = setupProctoringSocket;