const mongoose = require('mongoose');

const proctoringSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // Duration in milliseconds
  },
  overallRiskScore: {
    type: Number,
    default: 0
  },
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'LOW'
  },
  alerts: [{
    timestamp: Date,
    type: {
      type: String,
      enum: ['webcam', 'audio', 'browser']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    description: String,
    riskScore: Number,
    details: mongoose.Schema.Types.Mixed
  }],
  analyses: [{
    timestamp: Date,
    category: {
      type: String,
      enum: ['face_detection', 'eye_movement', 'audio_analysis', 'browser_activity']
    },
    riskScore: Number,
    alert: Boolean,
    details: mongoose.Schema.Types.Mixed
  }],
  summary: {
    totalAlerts: Number,
    alertRate: Number,
    categoryBreakdown: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'terminated'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProctoringSession', proctoringSessionSchema);