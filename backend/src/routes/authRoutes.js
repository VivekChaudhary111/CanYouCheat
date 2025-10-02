const express = require('express');
const { register, login } = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');
const auth = require('../middlewares/auth');
const User = require('../models/User');

const router = express.Router();

// Register route - requires all fields for AI proctoring system
router.post('/register', validateRequest(['name', 'email', 'password', 'role']), register);

// Login route - role-based authentication for students and instructors
router.post('/login', validateRequest(['email', 'password', 'role']), login);

// Add this route for AI Proctoring user verification
router.get('/me', auth, async (req, res) => {
  try {
    console.log('🔍 Fetching user profile for AI Proctoring System:', req.user.id);
    
    const user = await User.findById(req.user.id).select('-hash -salt');
    if (!user) {
      console.log('❌ User not found in AI Proctoring database');
      return res.status(404).json({ 
        success: false,
        message: 'User not found in AI Proctoring System' 
      });
    }

    console.log('✅ User profile retrieved for AI Proctoring:', user.email);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching user profile' 
    });
  }
});

// NEW: Add endpoint to fetch all students for exam management
router.get('/students', auth, async (req, res) => {
  try {
    console.log('👥 Fetching all students for AI proctoring exam management');
    
    // Only instructors can fetch student lists
    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: 'Only instructors can access student lists'
      });
    }

    const students = await User.find({ role: 'student' })
      .select('name email createdAt')
      .sort({ name: 1 });

    console.log(`✅ Retrieved ${students.length} students for exam management`);

    res.json({
      success: true,
      students: students.map(student => ({
        _id: student._id,
        name: student.name,
        email: student.email,
        createdAt: student.createdAt
      })),
      totalCount: students.length,
      message: `Found ${students.length} students available for AI proctoring`
    });

  } catch (error) {
    console.error('❌ Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching students'
    });
  }
});

module.exports = router;