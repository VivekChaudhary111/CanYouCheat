const ProctoringSession = require('../models/ProctoringSession');

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