const express = require('express');
const router = express.Router();
const proctoringController = require('../controllers/proctoringController');
const auth = require('../middlewares/auth');

// Student routes - require student role
router.post('/session', auth, proctoringController.createProctoringSession);
// router.post('/analyze-frame', auth, proctoringController.analyzeFrame);
router.post('/analyze-frame', proctoringController.analyzeFrame);
router.post('/session/:sessionId/frame', auth, proctoringController.storeFrameAnalysis);
router.patch('/session/:sessionId/end', auth, proctoringController.endProctoringSession);

// Instructor routes - require instructor role and exam access
router.get('/exam/:examId', auth, proctoringController.getExamProctoringData);
router.get('/exam/:examId/live', auth, proctoringController.getLiveProctoringStatus);
router.get('/session/:sessionId/frames', auth, proctoringController.getSessionFrameAnalysis);

// Shared routes - require authentication but allow both roles
router.get('/session/:sessionId', auth, proctoringController.getProctoringSession);
router.get('/session/:sessionId/status', auth, proctoringController.getSessionStatus);
// Health check for proctoring service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Proctoring Service',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      student: [
        'POST /session - Create proctoring session',
        'POST /analyze-frame - Analyze webcam frame',
        'POST /session/:id/frame - Store frame analysis',
        'PATCH /session/:id/end - End session'
      ],
      instructor: [
        'GET /exam/:id - Get exam proctoring data',
        'GET /exam/:id/live - Get live proctoring status',
        'GET /session/:id/frames - Get session frame analysis'
      ],
      shared: [
        'GET /session/:id - Get session details',
        'GET /session/:id/status - Get session status'
      ]
    }
  });
});

// Error handling for proctoring routes
router.use((error, req, res, next) => {
  console.error('❌ Proctoring route error:', {
    error: error.message,
    path: req.path,
    method: req.method,
    user: req.user?.email,
    timestamp: new Date().toISOString()
  });

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Proctoring service error',
    service: 'proctoring',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

module.exports = router;