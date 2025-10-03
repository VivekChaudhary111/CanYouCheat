const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

console.log('🔧 Configuring Passport Local Strategy for AI Proctoring System...');

// Configure Passport Local Strategy for role-based authentication
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password', 
  passReqToCallback: true // Pass the entire request to access role
}, async (req, email, password, done) => {
  try {
    console.log('🔐 Authenticating user:', email);
    
    const { role } = req.body;
    
    // Validate role for AI proctoring system (student/instructor)
    if (!role || !['student', 'instructor'].includes(role)) {
      console.log('❌ Invalid or missing role:', role);
      return done(null, false, { message: 'Role must be either student or instructor' });
    }

    // Find user by email and role for AI proctoring system
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(), 
      role: role,
      isActive: true 
    });

    if (!user) {
      console.log('❌ User not found:', { email, role });
      return done(null, false, { message: 'Invalid credentials' });
    }

    console.log('✅ User found, verifying password...');

    // Use passport-local-mongoose authenticate method
    user.authenticate(password, async (err, authenticatedUser, passwordErr) => {
      if (err) {
        console.error('💥 Authentication error:', err);
        return done(err);
      }
      
      if (passwordErr) {
        console.log('❌ Password verification failed');
        return done(null, false, { message: 'Invalid credentials' });
      }
      
      if (!authenticatedUser) {
        console.log('❌ Authentication failed');
        return done(null, false, { message: 'Invalid credentials' });
      }

      // Update last login for AI proctoring system tracking
      try {
        authenticatedUser.lastLogin = new Date();
        await authenticatedUser.save();
        console.log('✅ Login successful for AI proctoring user:', authenticatedUser.email);
      } catch (updateError) {
        console.error('⚠️ Failed to update last login:', updateError);
        // Don't fail authentication for this
      }

      return done(null, authenticatedUser);
    });

  } catch (error) {
    console.error('💥 Passport strategy error:', error);
    return done(error);
  }
}));

// Serialize user for session (though we use JWT for AI proctoring system)
passport.serializeUser((user, done) => {
  console.log('📝 Serializing user:', user._id);
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    console.log('📖 Deserializing user:', id);
    const user = await User.findById(id).select('-hash -salt');
    done(null, user);
  } catch (error) {
    console.error('💥 Deserialization error:', error);
    done(error, null);
  }
});

console.log('✅ Passport Local Strategy configured for AI Proctoring System');

module.exports = passport;