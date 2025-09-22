const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  duration: {
    type: Number, // Duration in minutes
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    points: Number
  }],
  settings: {
    allowMultipleAttempts: {
      type: Boolean,
      default: false
    },
    shuffleQuestions: {
      type: Boolean,
      default: true
    },
    proctoringEnabled: {
      type: Boolean,
      default: true
    }
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Exam', examSchema);