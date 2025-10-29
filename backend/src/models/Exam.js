const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Exam description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  duration: {
    type: Number,
    required: [true, 'Exam duration is required'],
    min: [5, 'Exam duration must be at least 5 minutes'],
    max: [480, 'Exam duration cannot exceed 8 hours']
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks are required'],
    min: [1, 'Total marks must be at least 1']
  },
  passingScore: {
    type: Number,
    required: [true, 'Passing score is required'],
    min: [0, 'Passing score cannot be negative']
  },
  // AI Proctoring specific settings for behavior analysis
  proctoringSettings: {
    faceDetectionEnabled: {
      type: Boolean,
      default: true
    },
    eyeTrackingEnabled: {
      type: Boolean,
      default: true
    },
    voiceDetectionEnabled: {
      type: Boolean,
      default: true
    },
    multiplePersonDetection: {
      type: Boolean,
      default: true
    },
    browserActivityMonitoring: {
      type: Boolean,
      default: true
    },
    riskThreshold: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    },
    allowedViolations: {
      type: Number,
      default: 3,
      min: 0
    }
  },
  // ✅ Fixed: Explicitly disable _id for questions subdocuments
  questions: [{
    _id: false, // Disable automatic _id generation for questions
    questionText: {
      type: String,
      required: true
    },
    questionType: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'short-answer', 'essay'],
      required: true
    },
    options: [{
      _id: false,
      text: String,
      isCorrect: Boolean
    }],
    correctAnswer: String,
    marks: {
      type: Number,
      required: true,
      min: 1
    },
    timeLimit: {
      type: Number,
      default: null
    },
    // IMPORTANT: Image field structure
    image: {
      data: {
        type: String, // Base64 string
        required: false
      },
      name: {
        type: String,
        required: false
      },
      type: {
        type: String,
        required: false
      },
      altText: {
        type: String,
        required: false,
        default: ''
      }
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  allowedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // AI Proctoring analytics for behavior monitoring
  examSessions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startTime: Date,
    endTime: Date,
    overallRiskScore: {
      type: Number,
      min: 0,
      max: 100
    },
    violations: [{
      _id: false, // Disable _id for violations too
      type: String,
      timestamp: Date,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      }
    }],
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'terminated'],
      default: 'in-progress'
    }
  }]
}, {
  timestamps: true
});

// Indexes for AI proctoring system performance optimization
examSchema.index({ createdBy: 1, isActive: 1 });
examSchema.index({ startDate: 1, endDate: 1 });
examSchema.index({ 'examSessions.student': 1 });

// Virtual for exam status - supports behavior analysis workflow
examSchema.virtual('status').get(function() {
  const now = new Date();
  if (now < this.startDate) return 'upcoming';
  if (now > this.endDate) return 'completed';
  return 'active';
});

// Method to check if exam is accessible - part of risk scoring system
examSchema.methods.isAccessibleBy = function(userId, userRole) {
  if (userRole === 'instructor' && this.createdBy && this.createdBy.toString() === userId.toString()) {
    return true;
  }
  if (userRole === 'student') {
    return this.isActive && 
           this.allowedStudents.some(studentId => studentId.toString() === userId.toString()) && 
           new Date() >= this.startDate && 
           new Date() <= this.endDate;
  }
  return false;
};

// Method to calculate AI risk score based on proctoring settings
examSchema.methods.calculateRiskLevel = function() {
  const settings = this.proctoringSettings;
  let riskFactors = 0;
  let totalFactors = 0;

  // Count enabled AI proctoring features
  Object.keys(settings).forEach(key => {
    if (typeof settings[key] === 'boolean') {
      totalFactors++;
      if (settings[key]) riskFactors++;
    }
  });

  return Math.round((riskFactors / totalFactors) * 100);
};

console.log('✅ AI Proctoring Exam Model loaded with behavior analysis capabilities');

module.exports = mongoose.model('Exam', examSchema);