const mongoose = require('mongoose');

const proctoringSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'disconnected', 'terminated'],
    default: 'active'
  },
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  frameAnalyses: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    analysisData: {
      riskScore: Number,
      alerts: [String],
      confidence: Number,
      faceCount: Number,
      objects: [String],
      error: String
    },
    thumbnailData: String,
    metadata: {
      frameNumber: Number,
      quality: String,
      processingTime: Number
    }
  }],
  alerts: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['high_risk', 'critical', 'system', 'behavioral', 'technical']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    message: String,
    riskScore: Number,
    violationType: String,
    frameData: String,
    metadata: mongoose.Schema.Types.Mixed
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// REMOVE the conflicting sessionId index - only keep these:
proctoringSessionSchema.index({ userId: 1, examId: 1 });
proctoringSessionSchema.index({ examId: 1, status: 1 });
proctoringSessionSchema.index({ startTime: -1 });

module.exports = mongoose.model('ProctoringSession', proctoringSessionSchema);