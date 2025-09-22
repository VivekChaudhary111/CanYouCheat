const User = require('../models/User');
const jwt = require('jsonwebtoken');
const passport = require('passport');

console.log('🔧 Loading Auth Controller for AI Proctoring System...');

// Register a new user for AI proctoring system
exports.register = async (req, res) => {
  try {
    console.log('🔵 Registration attempt started for AI proctoring system');
    const { name, email, password, role } = req.body;

    // Validate input for AI proctoring system
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        message: 'All fields (name, email, password, role) are required for AI proctoring registration' 
      });
    }

    // Validate role for AI proctoring system (student/instructor)
    if (!['student', 'instructor'].includes(role)) {
      return res.status(400).json({ 
        message: 'Role must be either "student" or "instructor" for AI proctoring system' 
      });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Create new user instance for AI proctoring
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: role
    });

    // Register with passport-local-mongoose (handles hashing automatically)
    const registeredUser = await User.register(newUser, password);
    
    console.log('✅ User registered successfully for AI proctoring:', {
      id: registeredUser._id,
      email: registeredUser.email,
      role: registeredUser.role
    });

    // Generate JWT for immediate login in AI proctoring system
    const token = jwt.sign(
      { 
        id: registeredUser._id, 
        email: registeredUser.email,
        role: registeredUser.role 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      success: true,
      message: 'User registered successfully in AI proctoring system',
      token,
      user: registeredUser.publicProfile
    });

  } catch (error) {
    console.error('💥 Registration error in AI proctoring system:', error);
    
    if (error.name === 'UserExistsError') {
      return res.status(400).json({ 
        message: 'User with this email already exists in AI proctoring system' 
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: messages 
      });
    }

    res.status(500).json({ 
      message: 'Server error during AI proctoring registration', 
      error: error.message 
    });
  }
};

// Login using Passport Local Strategy for AI proctoring
exports.login = (req, res, next) => {
  console.log('🔵 Login attempt started for AI proctoring system');
  console.log('📝 Login data:', { email: req.body.email, role: req.body.role });
  
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      console.error('💥 Authentication error in AI proctoring system:', err);
      return res.status(500).json({ 
        message: 'Authentication failed in AI proctoring system', 
        error: err.message 
      });
    }
    
    if (!user) {
      console.log('❌ Authentication failed for AI proctoring system:', info?.message);
      return res.status(400).json({ 
        message: info?.message || 'Invalid credentials for AI proctoring system' 
      });
    }

    // Generate JWT token for AI proctoring system
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        role: user.role 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful for AI proctoring system:', user.email, 'as', user.role);

    res.status(200).json({
      success: true,
      message: `Login successful as ${user.role} in AI proctoring system`,
      token,
      user: user.publicProfile
    });

  })(req, res, next);
};

console.log('✅ Auth Controller loaded for AI Proctoring System');