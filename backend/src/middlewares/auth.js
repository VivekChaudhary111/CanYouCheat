const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('🔐 AI Proctoring auth middleware triggered');
    console.log('📋 Request headers:', {
      authorization: req.header('Authorization') ? 'Present' : 'Missing',
      contentType: req.header('Content-Type')
    });
    
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid Authorization header found');
      return res.status(401).json({ 
        success: false,
        message: 'No token provided, authorization denied' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Token extracted:', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20),
      tokenSuffix: token.substring(token.length - 20)
    });

    if (!process.env.JWT_SECRET) {
      console.error('💥 JWT_SECRET not configured!');
      return res.status(500).json({ 
        success: false,
        message: 'Server configuration error' 
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified for AI Proctoring user:', {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      exp: new Date(decoded.exp * 1000).toISOString()
    });

    // Optional: Verify user still exists and is active
    const user = await User.findById(decoded.id).select('_id email role isActive');
    if (!user || !user.isActive) {
      console.log('❌ User not found or inactive:', decoded.id);
      return res.status(401).json({ 
        success: false,
        message: 'User account not found or deactivated' 
      });
    }

    req.user = decoded;
    console.log('✅ AI Proctoring authentication successful');
    next();
  } catch (error) {
    console.error('💥 Token verification failed in AI Proctoring System:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired, please log in again' 
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token format' 
      });
    } else {
      return res.status(401).json({ 
        success: false,
        message: 'Token verification failed' 
      });
    }
  }
};

module.exports = auth;