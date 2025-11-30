const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const crypto = require('crypto');

console.log('🔧 Configuring Passport Local Strategy for AI Proctoring System...');

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password', 
  passReqToCallback: true
}, async (req, email, password, done) => {
  try {
    console.log('🔐 Authenticating user:', email);
    
    const { role } = req.body;
    
    if (!role || !['student', 'instructor'].includes(role)) {
      console.log('❌ Invalid or missing role:', role);
      return done(null, false, { message: 'Role must be either student or instructor' });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase().trim(), 
      role: role,
      isActive: true 
    }).select('+hash +salt');

    if (!user) {
      console.log('❌ User not found:', { email, role });
      return done(null, false, { message: 'Invalid credentials' });
    }

    console.log('✅ User found, verifying password...');

    // ✅ Direct crypto validation (bypass passport-local-mongoose authenticate)
    try {
      const hash = crypto.pbkdf2Sync(password, user.salt, 25000, 512, 'sha256').toString('hex');
      
      if (hash !== user.hash) {
        console.log('❌ Password verification failed');
        return done(null, false, { message: 'Invalid credentials' });
      }

      console.log('✅ Password verification successful');

      // Update last login
      user.lastLogin = new Date();
      await user.save();
      console.log('✅ Login successful for AI proctoring user:', user.email);

      return done(null, user);

    } catch (error) {
      console.error('💥 Password verification error:', error);
      return done(null, false, { message: 'Authentication failed' });
    }

  } catch (error) {
    console.error('💥 Passport strategy error:', error);
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-hash -salt');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

console.log('✅ Passport Local Strategy configured for AI Proctoring System');

module.exports = passport;