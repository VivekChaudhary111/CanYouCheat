const mongoose = require('mongoose');

const examSubmissionSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamSession',
    required: true
  },
  answers: [{
    questionIndex: {
      type: Number,
      required: true
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false // Made optional since we're using questionIndex
    },
    answer: mongoose.Schema.Types.Mixed,
    isCorrect: {
      type: Boolean,
      default: false
    },
    points: {
      type: Number,
      default: 0
    },
    maxPoints: {
      type: Number,
      required: true
    }
  }],
  score: {
    type: Number,
    required: true,
    min: 0
  },
  maxScore: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  passed: {
    type: Boolean,
    required: true
  },
  submittedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  submissionType: {
    type: String,
    enum: ['manual', 'auto', 'timeout'],
    default: 'manual'
  },
  proctoringData: {
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    flaggedBehaviors: [String],
    totalEvents: {
      type: Number,
      default: 0
    },
    suspiciousActivities: {
      type: Number,
      default: 0
    }
  },
  flaggedForReview: {
    type: Boolean,
    default: false
  },
  reviewStatus: {
    type: String,
    enum: ['pending', 'approved', 'flagged', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewComments: String
}, {
  timestamps: true
});

// Indexes for efficient queries
examSubmissionSchema.index({ exam: 1, student: 1 }, { unique: true });
examSubmissionSchema.index({ submittedAt: -1 });
examSubmissionSchema.index({ flaggedForReview: 1 });
examSubmissionSchema.index({ reviewStatus: 1 });

console.log('✅ AI Proctoring Exam Submission Model loaded with behavior analysis tracking');

module.exports = mongoose.model('ExamSubmission', examSubmissionSchema);