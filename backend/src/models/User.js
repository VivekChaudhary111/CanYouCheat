const mongoose = require('mongoose');
let passportLocalMongoose = require('passport-local-mongoose');
// Fix for Node import behavior: if it's wrapped in default, unwrap it
if (passportLocalMongoose.default) {
    passportLocalMongoose = passportLocalMongoose.default;
}

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
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  institution: {
    type: String,
    maxlength: [200, 'Institution name cannot exceed 200 characters']
  },
  department: {
    type: String,
    maxlength: [100, 'Department name cannot exceed 100 characters']
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
    type: String, // URL to stored image (optional, cosmetic)
    default: null
  },
  // --- NEW FIELD FOR FACE VERIFICATION ---
  referenceImage: {
    type: String, // Store the Base64 image string captured during registration
    required: [
      function () { return this.role === 'student'; },
      'Reference image is required for identity verification'
    ]
  },
  // --- End of New Field ---
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

// Configure passport-local-mongoose plugin
userSchema.plugin(passportLocalMongoose, {
  usernameField: 'email',
  usernameLowerCase: true,
  session: false,
  // You might want to add 'referenceImage' here if you ever need passport to select it
  selectFields: 'name email role isActive lastLogin examHistory profilePicture referenceImage preferences createdAt updatedAt', // <-- Added referenceImage
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
  limitAttempts: true,
  maxAttempts: 5,
  digestAlgorithm: 'sha256',
  encoding: 'hex',
  saltlen: 32,
  iterations: 25000,
  keylen: 512
});

// Indexes for better query performance
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
    bio: this.bio,
    institution: this.institution,
    department: this.department,
    profilePicture: this.profilePicture, // Keep cosmetic picture
    lastLogin: this.lastLogin,
    // Probably exclude examHistory and referenceImage from public profile
  };
});

// Methods for AI proctoring system
userSchema.methods.canTakeExam = function() {
  return this.isActive && this.role === 'student';
};

userSchema.methods.canProctor = function() {
  return this.isActive && this.role === 'instructor';
};

console.log('✅ User model configured for AI Proctoring System (with Reference Image)');

module.exports = mongoose.model('User', userSchema);