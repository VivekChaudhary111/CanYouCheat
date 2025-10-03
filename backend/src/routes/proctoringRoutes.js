const express = require('express');
const router = express.Router();
const proctoringController = require('../controllers/proctoringController');
const auth = require('../middlewares/auth');

// Get proctoring sessions
router.get('/sessions', auth, proctoringController.getProctoringSessions);

// Get specific proctoring session
router.get('/sessions/:id', auth, proctoringController.getProctoringSession);

// Get session statistics
router.get('/stats', auth, proctoringController.getSessionStats);

module.exports = router;