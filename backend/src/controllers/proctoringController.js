const ProctoringSession = require('../models/ProctoringSession');
const { analyzeFrameWithAI } = require('../services/aiService');
const path = require('path');

// Get proctoring sessions for instructor dashboard
exports.getProctoringSessions = async (req, res) => {
  try {
    let sessions;
    
    if (req.user.role === 'instructor') {
      // Get sessions for exams created by this instructor
      sessions = await ProctoringSession.find()
        .populate({
          path: 'exam',
          match: { instructor: req.user.id },
          select: 'title description'
        })
        .populate('student', 'name email')
        .sort({ createdAt: -1 });
      
      // Filter out sessions where exam is null (not instructor's exam)
      sessions = sessions.filter(session => session.exam);
    } else {
      // Get sessions for this student
      sessions = await ProctoringSession.find({ student: req.user.id })
        .populate('exam', 'title description')
        .sort({ createdAt: -1 });
    }

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching proctoring sessions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get specific proctoring session
exports.getProctoringSession = async (req, res) => {
  try {
    const session = await ProctoringSession.findById(req.params.id)
      .populate('student', 'name email')
      .populate('exam', 'title description instructor');

    if (!session) {
      return res.status(404).json({ message: 'Proctoring session not found' });
    }

    // Check access permissions
    const hasAccess = req.user.role === 'instructor' && session.exam.instructor.toString() === req.user.id ||
                     req.user.role === 'student' && session.student._id.toString() === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error fetching proctoring session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get session statistics
exports.getSessionStats = async (req, res) => {
  try {
    let matchQuery = {};
    
    if (req.user.role === 'instructor') {
      // Get stats for instructor's exams
      const instructorExams = await require('../models/Exam').find({ instructor: req.user.id }).select('_id');
      const examIds = instructorExams.map(exam => exam._id);
      matchQuery.exam = { $in: examIds };
    } else {
      // Get stats for student's sessions
      matchQuery.student = req.user.id;
    }

    const stats = await ProctoringSession.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          activeSessions: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          completedSessions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          highRiskSessions: { $sum: { $cond: [{ $eq: ['$riskLevel', 'HIGH'] }, 1, 0] } },
          mediumRiskSessions: { $sum: { $cond: [{ $eq: ['$riskLevel', 'MEDIUM'] }, 1, 0] } },
          lowRiskSessions: { $sum: { $cond: [{ $eq: ['$riskLevel', 'LOW'] }, 1, 0] } },
          averageRiskScore: { $avg: '$overallRiskScore' },
          totalAlerts: { $sum: '$summary.totalAlerts' }
        }
      }
    ]);

    const result = stats[0] || {
      totalSessions: 0,
      activeSessions: 0,
      completedSessions: 0,
      highRiskSessions: 0,
      mediumRiskSessions: 0,
      lowRiskSessions: 0,
      averageRiskScore: 0,
      totalAlerts: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching session stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Save proctoring session data (called by socket when session ends)
exports.saveProctoringSession = async (sessionData) => {
  try {
    const session = new ProctoringSession(sessionData);
    await session.save();
    return session;
  } catch (error) {
    console.error('Error saving proctoring session:', error);
    throw error;
  }
};

// Make sure this exists in proctoringController.js:
exports.analyzeFrame = async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image provided'
      });
    }

    console.log('🤖 Analyzing frame with AI service...');
    
    // Call your AI service (make sure this function exists in aiService.js)
    const result = await analyzeFrameWithAI(image);
    
    res.json({
      success: true,
      result: result
    });
    
  } catch (error) {
    console.error('❌ Frame analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Frame analysis failed',
      error: error.message
    });
  }
};

// Add these methods to your existing controller:

// Get proctoring sessions for an exam (for instructors)
exports.getExamProctoringData = async (req, res) => {
  try {
    const { examId } = req.params;
    const { page = 1, limit = 50, riskLevel, timeRange } = req.query;
    
    console.log(`📊 Fetching proctoring data for exam: ${examId}`);
    
    // Build query filters
    const query = { examId };
    
    if (riskLevel && riskLevel !== 'all') {
      const riskThresholds = {
        high: { $gte: 70 },
        medium: { $gte: 40, $lt: 70 },
        low: { $lt: 40 }
      };
      query.riskScore = riskThresholds[riskLevel];
    }
    
    if (timeRange && timeRange !== 'all') {
      const timeMs = {
        '1h': 60 * 60 * 1000,
        '4h': 4 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000
      }[timeRange];
      
      if (timeMs) {
        query.startTime = { $gte: new Date(Date.now() - timeMs) };
      }
    }
    
    // Fetch sessions with user details
    const sessions = await ProctoringSession.find(query)
      .populate('userId', 'name email')
      .populate('examId', 'title examCode')
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    // Add additional computed fields
    const processedSessions = sessions.map(session => ({
      ...session,
      studentName: session.userId?.name || `Student ${session.userId._id}`,
      studentEmail: session.userId?.email,
      examTitle: session.examId?.title,
      examCode: session.examId?.examCode,
      duration: session.endTime ? 
        Math.round((new Date(session.endTime) - new Date(session.startTime)) / 1000 / 60) : 
        null,
      frameCount: session.frameAnalyses?.length || 0,
      alertCount: session.alerts?.length || 0,
      highRiskFrames: session.frameAnalyses?.filter(frame => 
        frame.analysisData?.riskScore >= 70
      ).length || 0,
      lastActivity: session.frameAnalyses?.length > 0 ?
        session.frameAnalyses[session.frameAnalyses.length - 1].timestamp :
        session.startTime,
      averageRiskScore: session.frameAnalyses?.length > 0 ?
        Math.round(session.frameAnalyses.reduce((sum, frame) => 
          sum + (frame.analysisData?.riskScore || 0), 0
        ) / session.frameAnalyses.length) : 0
    }));
    
    // Get total count for pagination
    const totalSessions = await ProctoringSession.countDocuments(query);
    
    // Get summary statistics
    const stats = {
      totalSessions: totalSessions,
      activeSessions: await ProctoringSession.countDocuments({ 
        ...query, 
        status: 'active' 
      }),
      highRiskSessions: await ProctoringSession.countDocuments({ 
        ...query, 
        riskScore: { $gte: 70 } 
      }),
      averageRiskScore: processedSessions.length > 0 ?
        Math.round(processedSessions.reduce((sum, s) => sum + (s.riskScore || 0), 0) / processedSessions.length) : 0
    };
    
    res.json({
      success: true,
      sessions: processedSessions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalSessions / limit),
        totalItems: totalSessions,
        hasNextPage: page * limit < totalSessions,
        hasPrevPage: page > 1
      },
      stats,
      filters: { riskLevel, timeRange }
    });
    
  } catch (error) {
    console.error('Error fetching proctoring data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch proctoring data',
      error: error.message
    });
  }
};

// Get detailed frame analysis for a session
exports.getSessionFrameAnalysis = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { frameLimit = 100 } = req.query;
    
    const session = await ProctoringSession.findById(sessionId)
      .populate('userId', 'name email')
      .populate('examId', 'title examCode');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Proctoring session not found'
      });
    }
    
    // Get frame analyses with limit
    const frameAnalyses = session.frameAnalyses
      .slice(-frameLimit) // Get last N frames
      .map(frame => ({
        ...frame.toObject(),
        riskLevel: frame.analysisData?.riskScore >= 70 ? 'high' : 
                  frame.analysisData?.riskScore >= 40 ? 'medium' : 'low',
        alertCount: frame.analysisData?.alerts?.length || 0
      }));
    
    res.json({
      success: true,
      session: {
        id: session._id,
        studentName: session.userId?.name,
        studentEmail: session.userId?.email,
        examTitle: session.examId?.title,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
        riskScore: session.riskScore
      },
      frameAnalyses,
      summary: {
        totalFrames: session.frameAnalyses.length,
        averageRiskScore: frameAnalyses.length > 0 ?
          Math.round(frameAnalyses.reduce((sum, f) => 
            sum + (f.analysisData?.riskScore || 0), 0
          ) / frameAnalyses.length) : 0,
        highRiskFrames: frameAnalyses.filter(f => 
          f.analysisData?.riskScore >= 70
        ).length,
        totalAlerts: frameAnalyses.reduce((sum, f) => 
          sum + (f.analysisData?.alerts?.length || 0), 0
        )
      }
    });
    
  } catch (error) {
    console.error('Error fetching frame analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch frame analysis',
      error: error.message
    });
  }
};

// Get live proctoring status for an exam
exports.getLiveProctoringStatus = async (req, res) => {
  try {
    const { examId } = req.params;
    
    // Get all active sessions for this exam
    const activeSessions = await ProctoringSession.find({
      examId,
      status: 'active'
    }).populate('userId', 'name email').lean();
    
    // Process session data for live view
    const liveData = activeSessions.map(session => {
      const lastFrame = session.frameAnalyses?.length > 0 ? 
        session.frameAnalyses[session.frameAnalyses.length - 1] : null;
      
      return {
        sessionId: session._id,
        userId: session.userId._id,
        studentName: session.userId.name,
        studentEmail: session.userId.email,
        currentRiskScore: session.riskScore || 0,
        status: session.status,
        startTime: session.startTime,
        frameCount: session.frameAnalyses?.length || 0,
        lastFrameTime: lastFrame?.timestamp,
        lastAnalysis: lastFrame?.analysisData,
        recentAlerts: session.alerts?.slice(-5) || []
      };
    });
    
    res.json({
      success: true,
      examId,
      activeSessions: liveData,
      summary: {
        totalActive: activeSessions.length,
        highRiskCount: liveData.filter(s => s.currentRiskScore >= 70).length,
        averageRisk: liveData.length > 0 ? 
          Math.round(liveData.reduce((sum, s) => sum + s.currentRiskScore, 0) / liveData.length) : 0
      },
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error fetching live proctoring status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live proctoring status',
      error: error.message
    });
  }
};

// Create proctoring session
exports.createProctoringSession = async (req, res) => {
  try {
    const { examId, userId } = req.body;
    
    const session = new ProctoringSession({
      examId,
      userId: userId || req.user.id,
      startTime: new Date(),
      status: 'active',
      riskScore: 0,
      frameAnalyses: [],
      alerts: []
    });
    
    await session.save();
    
    res.json({
      success: true,
      sessionId: session._id,
      message: 'Proctoring session created'
    });
  } catch (error) {
    console.error('Error creating proctoring session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create proctoring session',
      error: error.message
    });
  }
};

// Store frame analysis
exports.storeFrameAnalysis = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { analysisData, frameData, timestamp } = req.body;
    
    await ProctoringSession.findByIdAndUpdate(sessionId, {
      $push: {
        frameAnalyses: {
          timestamp: new Date(timestamp),
          analysisData,
          thumbnailData: frameData,
          metadata: {
            frameNumber: Date.now(),
            quality: 'standard',
            processingTime: analysisData.processingTime || 0
          }
        }
      },
      $set: {
        riskScore: analysisData?.riskScore || 0,
        lastActivity: new Date()
      }
    });
    
    res.json({
      success: true,
      message: 'Frame analysis stored'
    });
  } catch (error) {
    console.error('Error storing frame analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store frame analysis',
      error: error.message
    });
  }
};

// End proctoring session
exports.endProctoringSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    await ProctoringSession.findByIdAndUpdate(sessionId, {
      status: 'completed',
      endTime: new Date()
    });
    
    res.json({
      success: true,
      message: 'Proctoring session ended'
    });
  } catch (error) {
    console.error('Error ending proctoring session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end proctoring session',
      error: error.message
    });
  }
};

// Get session status
exports.getSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await ProctoringSession.findById(sessionId)
      .select('status startTime endTime riskScore');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      session: {
        id: sessionId,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        riskScore: session.riskScore
      }
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session status',
      error: error.message
    });
  }
};