const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const auth = require('../middlewares/auth');

console.log('Loading Exam Routes for AI Proctoring System...');

// Debug: Check if controller methods are loaded
console.log('🔍 Available controller methods:', Object.keys(examController));

// Basic CRUD routes for AI-Enhanced Online Exam Proctoring System
router.get('/', auth, examController.getExams);
router.post('/', auth, examController.createExam);
router.get('/:id', auth, examController.getExamById);
router.put('/:id', auth, examController.updateExam);
router.delete('/:id', auth, examController.deleteExam);

// AI Proctoring System - Instructor Management Routes
console.log('🎓 Adding AI Proctoring instructor management routes...');
router.post('/:examId/verify-identity', auth, examController.verifyIdentity);
// Get exam results with AI behavior analysis (instructor)
router.get('/:examId/results', auth, examController.getExamResults);

// Get individual student result with AI analysis (student)
router.get('/:examId/my-result', auth, examController.getMyExamResult);

// Manage students for AI-monitored exam
router.get('/:examId/students', auth, examController.manageExamStudents);
router.put('/:examId/students', auth, examController.updateExamStudents);

// AI Proctoring System - Exam Taking Routes
console.log('🤖 Adding AI Proctoring exam taking routes...');

// Start AI-enhanced exam session  
router.post('/:examId/start-session', auth, examController.startExamSession);

// Submit exam with AI proctoring analysis
router.post('/:examId/submit', auth, examController.submitExam);

// Auto-save answers during AI-monitored exam
router.post('/:examId/autosave', auth, examController.autoSaveAnswers);

// AI Proctoring data collection endpoint
router.post('/:examId/proctoring-data', auth, examController.recordProctoringData);

console.log('✅ AI Proctoring exam routes loaded');
console.log('🎯 Ready for: Webcam Feed → Behavior Analysis → Risk Alerts → Report Generation');

module.exports = router;