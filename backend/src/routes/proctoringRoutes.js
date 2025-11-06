const express = require('express');
const router = express.Router();
const proctoringController = require('../controllers/proctoringController');
const auth = require('../middlewares/auth');
const multer = require('multer');
const upload = multer();

// Get proctoring sessions
router.get('/sessions', auth, proctoringController.getProctoringSessions);

// Get specific proctoring session
router.get('/sessions/:id', auth, proctoringController.getProctoringSession);

// Get session statistics
router.get('/stats', auth, proctoringController.getSessionStats);

// Analyze single frame (accepts JSON base64 or multipart file)
router.post('/analyze-frame', auth, upload.single('file'), proctoringController.analyzeFrame);

module.exports = router;