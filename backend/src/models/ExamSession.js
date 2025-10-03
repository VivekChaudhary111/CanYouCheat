const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema({
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
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  expectedEndTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'terminated', 'suspended'],
    default: 'active'
  },
  browserInfo: {
    userAgent: String,
    screenResolution: String,
    timezone: String,
    ipAddress: String
  },
  systemInfo: {
    cameraEnabled: {
      type: Boolean,
      default: false
    },
    microphoneEnabled: {
      type: Boolean,
      default: false
    },
    fullscreenEnabled: {
      type: Boolean,
      default: false
    },
    networkStability: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    }
  },
  proctoringData: {
    faceDetectionEvents: [{
      timestamp: Date,
      eventType: String,
      data: mongoose.Schema.Types.Mixed,
      riskLevel: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        default: 'LOW'
      }
    }],
    eyeTrackingEvents: [{
      timestamp: Date,
      eventType: String,
      data: mongoose.Schema.Types.Mixed,
      riskLevel: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        default: 'LOW'
      }
    }],
    voiceDetectionEvents: [{
      timestamp: Date,
      eventType: String,
      data: mongoose.Schema.Types.Mixed,
      riskLevel: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        default: 'LOW'
      }
    }],
    multiplePersonEvents: [{
      timestamp: Date,
      eventType: String,
      data: mongoose.Schema.Types.Mixed,
      riskLevel: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        default: 'LOW'
      }
    }],
    browserActivityEvents: [{
      timestamp: Date,
      eventType: String,
      data: mongoose.Schema.Types.Mixed,
      riskLevel: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        default: 'LOW'
      }
    }],
    overallRiskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'LOW'
    }
  },
  tempAnswers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  lastSaved: {
    type: Date,
    default: Date.now
  },
  flags: [{
    type: {
      type: String,
      enum: [
        'multiple_faces',
        'no_face_detected',
        'suspicious_eye_movement',
        'audio_detected',
        'tab_switch',
        'fullscreen_exit',
        'copy_paste_detected',
        'right_click_detected'
      ]
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    description: String
  }]
}, {
  timestamps: true
});

// Indexes for better performance
examSessionSchema.index({ exam: 1, student: 1 });
examSessionSchema.index({ status: 1 });
examSessionSchema.index({ startTime: 1 });

console.log('✅ AI Proctoring Exam Session Model loaded with behavior tracking capabilities');

module.exports = mongoose.model('ExamSession', examSessionSchema);