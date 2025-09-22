const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const auth = require('../middlewares/auth');

// Create exam (instructors only)
router.post('/', auth, examController.createExam);

// Get all exams
router.get('/', auth, examController.getExams);

// Get exam by ID
router.get('/:id', auth, examController.getExamById);

// Enroll student in exam
router.post('/:examId/enroll', auth, examController.enrollStudent);

// Update exam (instructors only)
router.put('/:id', auth, examController.updateExam);

// Delete exam (instructors only)
router.delete('/:id', auth, examController.deleteExam);

module.exports = router;