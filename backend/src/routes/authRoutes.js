// filepath: backend/src/routes/authRoutes.js
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

// Get current user profile (protected route)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-hash -salt -password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      success: true,
      user: user.publicProfile || {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        examHistory: user.examHistory
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Logout route (for completeness, though we're using JWT)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully (clear token on client side)'
  });
});

module.exports = router;