const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middlewares/auth');

console.log('Loading Dashboard Routes for AI Proctoring System...');

// Role-specific dashboard routes
router.get('/instructor/dashboard', auth, (req, res, next) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Instructor role required.'
    });
  }
  next();
}, dashboardController.getInstructorDashboard);

router.get('/student/dashboard', auth, (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Student role required.'
    });
  }
  next();
}, dashboardController.getStudentDashboard);

// General dashboard overview (for admin or analytics)
router.get('/overview', auth, dashboardController.getDashboardOverview);

console.log('✅ AI Proctoring dashboard routes loaded');

module.exports = router;