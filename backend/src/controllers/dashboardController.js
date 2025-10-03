const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');
const ExamSubmission = require('../models/ExamSubmission');
const User = require('../models/User');

console.log('🔧 Loading AI Proctoring Dashboard Controller...');

// Get instructor dashboard data with AI proctoring analytics
const getInstructorDashboard = async (req, res) => {
  try {
    console.log('📊 Fetching instructor dashboard data for AI proctoring system:', req.user.id);

    // Get instructor's exams
    const instructorExams = await Exam.find({ createdBy: req.user.id });
    const examIds = instructorExams.map(exam => exam._id);

    // Calculate statistics
    const totalExams = instructorExams.length;
    const activeExams = instructorExams.filter(exam => exam.isActive).length;

    // Get total students across all exams
    const allStudentIds = new Set();
    instructorExams.forEach(exam => {
      exam.allowedStudents.forEach(studentId => {
        allStudentIds.add(studentId.toString());
      });
    });
    const totalStudents = allStudentIds.size;

    // Get active sessions (sessions that are in progress)
    const activeSessions = await ExamSession.countDocuments({
      exam: { $in: examIds },
      status: 'in-progress'
    });

    // Get all submissions for instructor's exams
    const allSubmissions = await ExamSubmission.find({
      exam: { $in: examIds }
    }).populate('student', 'name email')
      .populate('exam', 'title')
      .sort({ submittedAt: -1 });

    const totalSubmissions = allSubmissions.length;

    // Calculate flagged submissions (pending review)
    const pendingReviews = allSubmissions.filter(sub => sub.flaggedForReview).length;

    // Calculate average risk score
    const averageRiskScore = totalSubmissions > 0 
      ? Math.round(allSubmissions.reduce((sum, sub) => sum + (sub.proctoringData?.riskScore || 0), 0) / totalSubmissions)
      : 0;

    // Get recent activity (last 10 submissions)
    const recentActivity = allSubmissions.slice(0, 10).map(submission => ({
      type: submission.flaggedForReview ? 'flagged' : 'completed',
      message: `${submission.student.name} ${submission.flaggedForReview ? 'flagged for review' : 'completed'} "${submission.exam.title}"`,
      timestamp: new Date(submission.submittedAt).toLocaleDateString(),
      score: submission.percentage,
      actionable: submission.flaggedForReview,
      examId: submission.exam._id,
      submissionId: submission._id
    }));

    const stats = {
      totalExams,
      activeExams,
      totalStudents,
      activeSessions,
      totalSubmissions,
      pendingReviews,
      averageRiskScore,
      lastActivity: totalSubmissions > 0 ? allSubmissions[0].submittedAt : null
    };

    console.log('✅ Instructor dashboard data compiled:', {
      exams: totalExams,
      students: totalStudents,
      submissions: totalSubmissions,
      flagged: pendingReviews
    });

    res.json({
      success: true,
      stats,
      recentActivity,
      message: 'Instructor dashboard data retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching instructor dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching instructor dashboard data',
      error: error.message
    });
  }
};

// Get student dashboard data with AI proctoring insights
const getStudentDashboard = async (req, res) => {
  try {
    console.log('📊 Fetching student dashboard data for AI proctoring system:', req.user.id);

    // Get exams assigned to this student
    const availableExams = await Exam.find({
      allowedStudents: req.user.id,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    // Get student's submissions
    const studentSubmissions = await ExamSubmission.find({
      student: req.user.id
    }).populate('exam', 'title description totalMarks')
      .sort({ submittedAt: -1 });

    // Get completed exams (submitted)
    const completedExams = studentSubmissions.length;

    // Get upcoming exams (assigned but not started yet)
    const upcomingExams = await Exam.countDocuments({
      allowedStudents: req.user.id,
      isActive: true,
      startDate: { $gt: new Date() }
    });

    // Calculate average score
    const averageScore = completedExams > 0 
      ? Math.round(studentSubmissions.reduce((sum, sub) => sum + sub.percentage, 0) / completedExams)
      : 0;

    // Calculate average risk score
    const averageRiskScore = completedExams > 0
      ? Math.round(studentSubmissions.reduce((sum, sub) => sum + (sub.proctoringData?.riskScore || 0), 0) / completedExams)
      : 0;

    // Get total exam attempts (including retakes)
    const totalAttempts = await ExamSession.countDocuments({
      student: req.user.id
    });

    // Generate recent activity
    const recentActivity = studentSubmissions.slice(0, 5).map(submission => ({
      type: submission.passed ? 'passed' : 'failed',
      message: `Completed "${submission.exam.title}" - ${submission.percentage}% ${submission.passed ? '(Passed)' : '(Failed)'}`,
      timestamp: new Date(submission.submittedAt).toLocaleDateString(),
      score: submission.percentage,
      examId: submission.exam._id,
      riskScore: submission.proctoringData?.riskScore || 0
    }));

    const stats = {
      availableExams: availableExams.length,
      completedExams,
      upcomingExams,
      averageScore,
      totalAttempts,
      averageRiskScore,
      lastActivity: completedExams > 0 ? studentSubmissions[0].submittedAt : null
    };

    console.log('✅ Student dashboard data compiled:', {
      available: availableExams.length,
      completed: completedExams,
      upcoming: upcomingExams,
      avgScore: averageScore
    });

    res.json({
      success: true,
      stats,
      recentActivity,
      message: 'Student dashboard data retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching student dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student dashboard data',
      error: error.message
    });
  }
};

// Get general dashboard statistics (for admin or overview)
const getDashboardOverview = async (req, res) => {
  try {
    console.log('📊 Fetching dashboard overview for AI proctoring system');

    const totalExams = await Exam.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalInstructors = await User.countDocuments({ role: 'instructor' });
    const totalSubmissions = await ExamSubmission.countDocuments();
    const activeSessions = await ExamSession.countDocuments({ status: 'in-progress' });

    // Get risk distribution
    const riskDistribution = await ExamSubmission.aggregate([
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$proctoringData.riskScore', 30] }, then: 'low' },
                { case: { $lt: ['$proctoringData.riskScore', 70] }, then: 'medium' },
                { case: { $gte: ['$proctoringData.riskScore', 70] }, then: 'high' }
              ],
              default: 'unknown'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const overview = {
      totalExams,
      totalUsers,
      totalStudents,
      totalInstructors,
      totalSubmissions,
      activeSessions,
      riskDistribution: {
        low: riskDistribution.find(r => r._id === 'low')?.count || 0,
        medium: riskDistribution.find(r => r._id === 'medium')?.count || 0,
        high: riskDistribution.find(r => r._id === 'high')?.count || 0
      }
    };

    console.log('✅ Dashboard overview compiled');

    res.json({
      success: true,
      overview,
      message: 'Dashboard overview retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard overview',
      error: error.message
    });
  }
};

module.exports = {
  getInstructorDashboard,
  getStudentDashboard, 
  getDashboardOverview
};

console.log('✅ AI Proctoring Dashboard Controller loaded');