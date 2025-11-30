# CanYouCheat Backend - AI Proctoring API Server

> **Powerful Node.js backend server providing AI-enhanced exam proctoring capabilities with real-time behavior analysis and comprehensive reporting.**

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [AI Components](#ai-components)
- [Database Schema](#database-schema)
- [WebSocket Events](#websocket-events)
- [Testing](#testing)
- [Deployment](#deployment)

## Overview

The CanYouCheat backend is a robust Node.js application built with Express.js that provides comprehensive API services for AI-enhanced exam proctoring. It handles user authentication, exam management, real-time behavior analysis, and evidence storage.

### Key Capabilities
- **Secure Authentication** - JWT-based role-based access control
- **AI Behavior Analysis** - Real-time suspicious behavior detection
- **Risk Assessment** - Dynamic scoring algorithms
- **Real-time Communication** - Socket.IO for live monitoring
- **Exam Management** - Complete CRUD operations for exams
- **Analytics & Reporting** - Comprehensive proctoring reports

## Features

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control (Student, Instructor, Admin)
- Secure password hashing with bcrypt
- Token refresh and validation
- Session management

### AI-Powered Proctoring
- Real-time behavior analysis engine
- Face detection and tracking
- Eye movement analysis
- Audio anomaly detection
- Risk scoring algorithms
- Evidence capture and storage

### Exam Management
- Complete exam lifecycle management
- Question bank management
- Student assignment and tracking
- Time-based exam controls
- Submission handling

### Real-time Monitoring
- WebSocket-based live communication
- Real-time behavior data streaming
- Instant alert notifications
- Live dashboard updates

## Architecture

```
Backend Architecture
├── API Layer (Express.js)
├── Authentication (JWT + Passport)
├── AI Processing Engine
├── Business Logic Services
├── Database Layer (MongoDB)
├── Real-time (Socket.IO)
└── File Storage System
```

### Component Breakdown

```
src/
├── app.js                 # Express app configuration
├── server.js             # Server entry point
├── controllers/          # Request handlers
│   ├── authController.js      # Authentication logic
│   ├── examController.js      # Exam management
│   ├── proctoringController.js # Proctoring operations
│   └── dashboardController.js  # Analytics & reporting
├── models/               # Database schemas
│   ├── User.js               # User model
│   ├── Exam.js               # Exam model
│   ├── ExamSession.js        # Session tracking
│   ├── ExamSubmission.js     # Submission data
│   └── ProctoringSession.js  # Proctoring records
├── routes/               # API route definitions
├── middlewares/          # Custom middleware
├── services/             # Business logic
├── ai/                   # AI/ML components
│   ├── behaviorAnalyzer.js   # Behavior analysis
│   └── riskScorer.js         # Risk assessment
├── socket/               # WebSocket handlers
├── config/               # Configuration files
└── utils/                # Utility functions
```

## Installation

### Prerequisites
- Node.js v16.0.0 or higher
- MongoDB v4.4 or higher
- npm or yarn package manager

### Setup Steps

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp .env.example .env
# Edit .env file with your configurations
```

4. **Database setup**
```bash
# Ensure MongoDB is running
mongod

# Run database migrations (if any)
npm run migrate
```

5. **Start development server**
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Configuration

### Environment Variables

Create a `.env` file in the backend root:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/canyoucheat
DB_NAME=canyoucheat

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=24h
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRE=7d

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf

# AI Configuration
AI_CONFIDENCE_THRESHOLD=0.7
FACE_DETECTION_INTERVAL=1000
RISK_SCORE_THRESHOLD=75
BEHAVIOR_ANALYSIS_WINDOW=30000

# Socket.IO
SOCKET_CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Database Configuration

The application uses MongoDB with Mongoose ODM. Connection is configured in `src/config/db.js`.

## API Reference

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

```javascript
// Request Body
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "student" // or "instructor"
}

// Response
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

#### POST /api/auth/login
Authenticate user and receive JWT token.

```javascript
// Request Body
{
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "student"
}

// Response
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

#### GET /api/auth/verify
Verify JWT token validity.

```javascript
// Headers
Authorization: Bearer jwt_token_here

// Response
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

### Exam Management Endpoints

#### GET /api/exams
Get all exams (filtered by user role).

```javascript
// Response
{
  "success": true,
  "exams": [
    {
      "id": "exam_id",
      "title": "Math Final Exam",
      "subject": "Mathematics",
      "duration": 120,
      "totalQuestions": 50,
      "isActive": true,
      "startDate": "2025-10-15T09:00:00.000Z",
      "endDate": "2025-10-15T11:00:00.000Z"
    }
  ]
}
```

#### POST /api/exams
Create a new exam (Instructor only).

```javascript
// Request Body
{
  "title": "Physics Midterm",
  "subject": "Physics",
  "description": "Comprehensive physics examination",
  "duration": 90,
  "totalQuestions": 40,
  "startDate": "2025-10-20T10:00:00.000Z",
  "endDate": "2025-10-20T11:30:00.000Z",
  "questions": [
    {
      "question": "What is the speed of light?",
      "type": "multiple-choice",
      "options": ["299,792,458 m/s", "300,000,000 m/s", "186,000 mi/s"],
      "correctAnswer": 0,
      "points": 2
    }
  ],
  "proctoringSettings": {
    "enableFaceDetection": true,
    "enableEyeTracking": true,
    "enableAudioMonitoring": true,
    "riskThreshold": 75
  }
}

// Response
{
  "success": true,
  "message": "Exam created successfully",
  "exam": {
    "id": "new_exam_id",
    "title": "Physics Midterm",
    // ... other exam details
  }
}
```

### Proctoring Endpoints

#### POST /api/proctoring/start
Start a proctoring session for an exam.

```javascript
// Request Body
{
  "examId": "exam_id",
  "userId": "user_id"
}

// Response
{
  "success": true,
  "sessionId": "proctoring_session_id",
  "message": "Proctoring session started"
}
```

#### POST /api/proctoring/analyze
Submit behavior data for analysis.

```javascript
// Request Body
{
  "sessionId": "proctoring_session_id",
  "behaviorData": {
    "faceDetection": {
      "facesDetected": 1,
      "facePosition": { "x": 320, "y": 240 },
      "confidence": 0.95
    },
    "eyeTracking": {
      "gazeDirection": "center",
      "lookAwayDuration": 500
    },
    "audioAnalysis": {
      "volumeLevel": 0.3,
      "speechDetected": false,
      "backgroundNoise": 0.1
    }
  },
  "timestamp": "2025-10-15T10:30:00.000Z"
}

// Response
{
  "success": true,
  "riskScore": 25,
  "alerts": [],
  "recommendations": ["Continue monitoring"]
}
```

### Dashboard Endpoints

#### GET /api/dashboard/stats
Get dashboard statistics for the user.

```javascript
// Response (Student)
{
  "success": true,
  "stats": {
    "totalExams": 15,
    "completedExams": 12,
    "upcomingExams": 3,
    "averageScore": 85.5,
    "proctoringStats": {
      "totalSessions": 12,
      "averageRiskScore": 15.2,
      "flaggedSessions": 1
    }
  }
}

// Response (Instructor)
{
  "success": true,
  "stats": {
    "totalExams": 8,
    "activeExams": 3,
    "totalStudents": 150,
    "examsSessions": 1200,
    "proctoringStats": {
      "totalSessions": 1200,
      "averageRiskScore": 22.8,
      "flaggedSessions": 48
    }
  }
}
```

## AI Components

### Behavior Analyzer (`src/ai/behaviorAnalyzer.js`)

The behavior analyzer processes webcam and audio data to detect suspicious activities.

```javascript
const BehaviorAnalyzer = {
  analyzeFaceDetection(imageData) {
    // Face detection and tracking logic
    return {
      facesDetected: number,
      primaryFace: {
        position: { x, y, width, height },
        confidence: number,
        landmarks: array
      },
      suspiciousActivity: boolean
    };
  },

  analyzeEyeMovement(eyeData) {
    // Eye tracking analysis
    return {
      gazeDirection: string,
      lookAwayDuration: number,
      suspiciousGazePattern: boolean
    };
  },

  analyzeAudio(audioData) {
    // Audio analysis for voices and background noise
    return {
      volumeLevel: number,
      speechDetected: boolean,
      multipleVoices: boolean,
      backgroundNoise: number
    };
  }
};
```

### Risk Scorer (`src/ai/riskScorer.js`)

The risk scorer calculates risk scores based on behavior patterns.

```javascript
const RiskScorer = {
  calculateRiskScore(behaviorData) {
    let riskScore = 0;
    
    // Face detection risks
    if (behaviorData.facesDetected === 0) riskScore += 30;
    if (behaviorData.facesDetected > 1) riskScore += 50;
    
    // Eye movement risks
    if (behaviorData.lookAwayDuration > 5000) riskScore += 20;
    
    // Audio risks
    if (behaviorData.speechDetected) riskScore += 25;
    if (behaviorData.multipleVoices) riskScore += 40;
    
    return Math.min(riskScore, 100);
  },

  assessRiskLevel(score) {
    if (score >= 75) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    if (score >= 25) return 'LOW';
    return 'MINIMAL';
  }
};
```

## Database Schema

### User Model
```javascript
const userSchema = {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'] },
  bio: String,
  institution: String,
  department: String,
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now }
};
```

### Exam Model
```javascript
const examSchema = {
  title: { type: String, required: true },
  subject: String,
  description: String,
  instructor: { type: ObjectId, ref: 'User', required: true },
  duration: { type: Number, required: true }, // minutes
  totalQuestions: Number,
  questions: [questionSchema],
  startDate: Date,
  endDate: Date,
  isActive: { type: Boolean, default: true },
  proctoringSettings: {
    enableFaceDetection: Boolean,
    enableEyeTracking: Boolean,
    enableAudioMonitoring: Boolean,
    riskThreshold: Number
  },
  studentsAssigned: [{ type: ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
};
```

### Proctoring Session Model
```javascript
const proctoringSessionSchema = {
  examId: { type: ObjectId, ref: 'Exam', required: true },
  userId: { type: ObjectId, ref: 'User', required: true },
  sessionId: { type: String, unique: true },
  startTime: Date,
  endTime: Date,
  behaviorData: [{
    timestamp: Date,
    faceDetection: Object,
    eyeTracking: Object,
    audioAnalysis: Object,
    riskScore: Number
  }],
  overallRiskScore: Number,
  flags: [String],
  evidenceFiles: [String],
  status: { type: String, enum: ['active', 'completed', 'flagged'] }
};
```

## WebSocket Events

### Client → Server Events

```javascript
// Join proctoring session
socket.emit('join-proctoring', {
  sessionId: 'session_id',
  userId: 'user_id',
  examId: 'exam_id'
});

// Submit behavior data
socket.emit('behavior-data', {
  sessionId: 'session_id',
  data: behaviorAnalysisResult,
  timestamp: new Date()
});

// Heartbeat for connection monitoring
socket.emit('heartbeat', {
  sessionId: 'session_id',
  timestamp: new Date()
});
```

### Server → Client Events

```javascript
// Risk score update
socket.emit('risk-update', {
  sessionId: 'session_id',
  riskScore: 45,
  riskLevel: 'MEDIUM',
  timestamp: new Date()
});

// Security alert
socket.emit('security-alert', {
  sessionId: 'session_id',
  type: 'MULTIPLE_FACES_DETECTED',
  severity: 'HIGH',
  message: 'Multiple faces detected in frame',
  timestamp: new Date()
});

// Session status update
socket.emit('session-update', {
  sessionId: 'session_id',
  status: 'ACTIVE',
  participants: 1,
  duration: 1800000 // milliseconds
});
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js

# Run tests matching pattern
npm test -- --grep "authentication"
```

### Test Structure

```
tests/
├── auth.test.js           # Authentication tests
├── exam.test.js           # Exam management tests
├── proctoring.test.js     # Proctoring functionality tests
├── ai.test.js             # AI component tests
├── socket.test.js         # WebSocket tests
└── integration/           # Integration tests
    ├── api.test.js        # API integration tests
    └── database.test.js   # Database integration tests
```

### Example Test

```javascript
// tests/auth.test.js
describe('Authentication', () => {
  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testPassword123',
          role: 'student'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongPassword',
          role: 'student'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
```

## Deployment

### Production Setup

1. **Environment Configuration**
```bash
# Set production environment variables
export NODE_ENV=production
export MONGO_URI=mongodb://production-server:27017/canyoucheat
export JWT_SECRET=production-jwt-secret
```

2. **Build and Start**
```bash
npm run build
npm start
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

```bash
# Build and run Docker container
docker build -t canyoucheat-backend .
docker run -p 5000:5000 -d canyoucheat-backend
```

### Health Checks

The server provides health check endpoints for monitoring:

```javascript
// GET /health
{
  "status": "OK",
  "timestamp": "2025-10-15T10:30:00.000Z",
  "uptime": 3600000,
  "version": "1.0.0",
  "database": "connected",
  "memory": {
    "used": "150MB",
    "total": "512MB"
  }
}
```

## Performance & Monitoring

### Logging

The application uses structured logging with Winston:

```javascript
// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console()
  ]
});
```

### Performance Metrics

Monitor key performance indicators:
- API response times
- Database query performance
- WebSocket connection counts
- AI processing latency
- Memory usage and CPU utilization

## Security

### Security Measures
- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Security Headers
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style
- Use ESLint configuration
- Follow async/await patterns
- Write comprehensive JSDoc comments
- Maintain test coverage above 80%

---

**Built with care for Academic Integrity**

*Last updated: October 2025*