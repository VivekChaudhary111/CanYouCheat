const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

console.log('🔧 Defining User model for AI Proctoring System...');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  role: {
    type: String,
    required: [true, 'Role is required for AI proctoring system'],
    enum: {
      values: ['student', 'instructor'],
      message: 'Role must be either student or instructor'
    },
    default: 'student'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  // AI Proctoring specific fields
  examHistory: [{
    examId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Exam' 
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    flaggedBehaviors: [String]
  }],
  profilePicture: {
    type: String, // URL to stored image for face recognition
    default: null
  },
  // AI Proctoring preferences
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    riskThreshold: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

// Configure passport-local-mongoose plugin for AI proctoring authentication
userSchema.plugin(passportLocalMongoose, {
  usernameField: 'email',
  usernameLowerCase: true,
  session: false, // We use JWT for AI proctoring system
  selectFields: 'name email role isActive lastLogin examHistory profilePicture preferences createdAt updatedAt',
  errorMessages: {
    MissingPasswordError: 'Password is required',
    AttemptTooSoonError: 'Account is currently locked. Try again later.',
    TooManyAttemptsError: 'Account locked due to too many failed login attempts',
    NoSaltValueStoredError: 'Authentication not possible. No salt value stored',
    IncorrectPasswordError: 'Password or username are incorrect',
    IncorrectUsernameError: 'Password or username are incorrect',
    MissingUsernameError: 'Email is required',
    UserExistsError: 'A user with the given email is already registered'
  },
  // Security options for AI proctoring system
  limitAttempts: true,
  maxAttempts: 5,
  digestAlgorithm: 'sha256',
  encoding: 'hex',
  saltlen: 32,
  iterations: 25000,
  keylen: 512
});

// Indexes for better query performance in AI proctoring system
userSchema.index({ email: 1, role: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ lastLogin: -1 });

// Virtual for user's public profile (excluding sensitive data)
userSchema.virtual('publicProfile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    profilePicture: this.profilePicture,
    lastLogin: this.lastLogin,
    examHistory: this.examHistory
  };
});

// Methods for AI proctoring system
userSchema.methods.canTakeExam = function() {
  return this.isActive && this.role === 'student';
};

userSchema.methods.canProctor = function() {
  return this.isActive && this.role === 'instructor';
};

console.log('✅ User model configured for AI Proctoring System');

module.exports = mongoose.model('User', userSchema);