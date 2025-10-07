# AI-Enhanced Online Exam Proctoring System - Frontend

<div align="center">
  <h3>Modern React.js Frontend for AI-Powered Exam Proctoring</h3>
  <p>Advanced user interface for secure remote examinations with real-time AI behavior analysis</p>
  
  ![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)
  ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript)
  ![CSS3](https://img.shields.io/badge/CSS3-Modern-1572B6?style=for-the-badge&logo=css3)
  ![Responsive](https://img.shields.io/badge/Design-Responsive-green?style=for-the-badge)
</div>

---

## Quick Start

### Prerequisites
- Node.js (v16.0.0 or higher)
- npm (v8.0.0 or higher) or yarn
- Modern web browser with webcam/microphone support
- Backend server running on `http://localhost:5000`

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/VivekChaudhary111/CanYouCheat.git
cd CanYouCheat/frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

The application will be available at `http://localhost:3000`

---

## Project Architecture

### Folder Structure
```
src/
├── components/          # Reusable UI components
│   ├── Navbar.js       # Navigation bar with user profile
│   └── Navbar.css      # Navigation styling
├── context/            # React Context providers
│   └── AuthContext.js  # Authentication state management
├── pages/              # Page components (route-specific)
│   ├── Auth.css        # Authentication pages styling
│   ├── ChangePassword.js
│   ├── CreateExam.js   # Exam creation interface
│   ├── Dashboard.js    # Main dashboard
│   ├── ExamList.js     # Exam listing and management
│   ├── ExamResults.js  # Results and analytics
│   ├── Login.js        # User authentication
│   ├── Profile.js      # User profile management
│   ├── Settings.js     # System preferences
│   └── ExamTaking/     # Exam-taking module
│       ├── ExamTaking.js
│       ├── components/ # Exam-specific components
│       ├── hooks/      # Custom hooks for exam logic
│       └── utils/      # Exam utility functions
├── services/           # API communication services
├── utils/              # Shared utility functions
├── hooks/              # Custom React hooks
├── App.js              # Main application component
└── index.js            # Application entry point
```

### Component Hierarchy
```
App
├── Navbar (if authenticated)
├── AuthContext.Provider
└── Router
    ├── LoginPage
    ├── RegisterPage
    ├── Dashboard
    ├── ExamList
    ├── CreateExam (Instructor only)
    ├── ExamTaking
    │   ├── SystemCheck
    │   ├── WebcamMonitor
    │   ├── QuestionDisplay
    │   └── SubmissionConfirm
    ├── Profile
    ├── Settings
    └── ChangePassword
```

---

## Core Features

### Authentication System
- **Multi-role Support**: Students, Instructors, Administrators
- **JWT Token Management**: Secure session handling
- **Password Security**: Strength validation and secure storage
- **Session Persistence**: Automatic login restoration

```javascript
// Authentication Context Usage
const { user, isAuthenticated, isInstructor, login, logout } = useAuth();
```

### Student Features
- **Exam Taking Interface**: Full-screen proctored exam experience
- **Real-time Monitoring**: Webcam and audio surveillance
- **System Checks**: Pre-exam technical verification
- **Progress Tracking**: Live exam progress and time management
- **Results Viewing**: Post-exam performance analytics

### Instructor Features
- **Exam Creation**: Comprehensive exam builder with AI settings
- **Student Management**: Assign and manage exam participants
- **Live Monitoring**: Real-time proctoring dashboard
- **Analytics Dashboard**: Detailed performance and behavior insights
- **Evidence Review**: AI-flagged incidents and manual verification

### AI Proctoring Integration
- **Behavior Analysis**: Real-time suspicious activity detection
- **Risk Scoring**: AI-powered integrity assessment
- **Evidence Collection**: Automated screenshot and video capture
- **Multi-modal Detection**: Face, eye, audio, and movement analysis

---

## Key Components

### ExamTaking Module
The most critical component handling the actual exam experience:

```javascript
// Core exam-taking components
ExamTaking/
├── ExamTaking.js          # Main exam controller
├── components/
│   ├── SystemCheck.js     # Pre-exam verification
│   ├── WebcamMonitor.js   # AI monitoring interface
│   ├── QuestionDisplay.js # Question rendering
│   └── SubmissionConfirm.js # Exam submission
├── hooks/
│   ├── useExamTimer.js    # Time management
│   ├── useWebcamAccess.js # Camera permissions
│   └── useExamSubmission.js # Answer handling
└── utils/
    ├── cameraUtils.js     # Camera utilities
    └── examValidation.js  # Answer validation
```

### Authentication Flow
```javascript
// Login process with role-based routing
const handleLogin = async (credentials) => {
  const result = await login(email, password, role);
  if (result.success) {
    navigate(role === 'instructor' ? '/dashboard' : '/exams');
  }
};
```

### AI Monitoring Integration
```javascript
// WebcamMonitor component
const WebcamMonitor = () => {
  const [behaviorData, setBehaviorData] = useState({});
  const [riskScore, setRiskScore] = useState(0);
  
  // Real-time AI analysis
  useEffect(() => {
    analyzeBehavior(videoStream);
  }, [videoStream]);
};
```

---

## Design System

### Color Palette
```css
/* Primary Colors - AI/Technology Theme */
--primary-blue: #3b82f6;      /* Main actions */
--primary-purple: #8b5cf6;    /* AI features */
--success-green: #10b981;     /* Success states */
--warning-amber: #f59e0b;     /* Cautions */
--danger-red: #ef4444;        /* Alerts/Errors */

/* Neutral Colors */
--gray-50: #f9fafb;          /* Backgrounds */
--gray-900: #111827;         /* Text */
--white: #ffffff;            /* Cards/Modals */
```

### Typography
```css
/* Font Stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Scales */
--text-xs: 0.75rem;      /* 12px - Labels */
--text-sm: 0.875rem;     /* 14px - Body text */
--text-base: 1rem;       /* 16px - Default */
--text-lg: 1.125rem;     /* 18px - Headings */
--text-xl: 1.25rem;      /* 20px - Page titles */
--text-2xl: 1.5rem;      /* 24px - Main headings */
```

### Responsive Breakpoints
```css
/* Mobile First Approach */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

---

## State Management

### AuthContext Pattern
```javascript
// Global authentication state
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Computed properties
  const isInstructor = user?.role === 'instructor';
  const isStudent = user?.role === 'student';
  
  return (
    <AuthContext.Provider value={{ 
      user, isAuthenticated, isInstructor, isStudent, login, logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Local State Patterns
```javascript
// Component-level state for forms
const [formData, setFormData] = useState({
  email: '',
  password: '',
  role: 'student'
});

// Async operation state
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [success, setSuccess] = useState(false);
```

---

## API Integration

### Service Layer Structure
```javascript
// API base configuration
const API_BASE = 'http://localhost:5000/api';

// Authentication service
export const authService = {
  login: (credentials) => post('/auth/login', credentials),
  register: (userData) => post('/auth/register', userData),
  verify: () => get('/auth/verify')
};

// Exam service
export const examService = {
  getExams: () => get('/exams'),
  createExam: (examData) => post('/exams', examData),
  submitExam: (examId, answers) => post(`/exams/${examId}/submit`, answers)
};
```

### Error Handling Pattern
```javascript
// Consistent error handling across components
const handleApiError = (error) => {
  if (error.response?.status === 401) {
    logout(); // Token expired
    navigate('/login');
  } else {
    setError(error.response?.data?.message || 'An error occurred');
  }
};
```

---

## Testing Strategy

### Testing Structure
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- ExamTaking.test.js
```

### Test Categories
- **Unit Tests**: Individual components and utilities
- **Integration Tests**: Component interactions and API calls
- **E2E Tests**: Full user workflows (planned)

### Example Test Pattern
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import Login from '../pages/Login';

test('login form submission', async () => {
  render(
    <AuthProvider>
      <Login />
    </AuthProvider>
  );
  
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' }
  });
  
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  
  expect(screen.getByText(/signing in/i)).toBeInTheDocument();
});
```

---

## Browser Compatibility

### Supported Browsers
| Browser | Version | Features |
|---------|---------|----------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | WebRTC supported |
| Edge | 90+ | Full support |

### Required Browser APIs
- **MediaDevices API**: Webcam and microphone access
- **WebRTC**: Real-time communication
- **LocalStorage**: Session persistence
- **Fullscreen API**: Exam-taking mode
- **Notification API**: Alert system

---

## Performance Optimizations

### Code Splitting
```javascript
// Lazy loading for better performance
const ExamTaking = lazy(() => import('./pages/ExamTaking/ExamTaking'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/exam/:id" element={<ExamTaking />} />
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</Suspense>
```

### Optimization Strategies
- **Image Optimization**: WebP format with fallbacks
- **Bundle Analysis**: Regular bundle size monitoring
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: For large data lists
- **Service Workers**: Caching strategy (planned)

---

## Security Features

### Client-Side Security
- **JWT Token Management**: Secure storage and automatic refresh
- **Input Validation**: XSS prevention and data sanitization
- **HTTPS Enforcement**: Secure communication only
- **CSP Headers**: Content Security Policy implementation
- **Session Management**: Automatic logout on inactivity

### Proctoring Security
- **Screen Recording Prevention**: Fullscreen enforcement
- **Tab Switching Detection**: Activity monitoring
- **Copy-Paste Blocking**: Exam integrity measures
- **Developer Tools Detection**: Anti-cheating measures

---

## Accessibility (A11y)

### WCAG 2.1 Compliance
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: ARIA labels and descriptions
- **Color Contrast**: WCAG AA standard compliance
- **Focus Management**: Logical tab order
- **Alternative Text**: Images and icons
- **Form Labels**: Proper form associations

### Accessibility Testing
```bash
# Install accessibility testing tools
npm install --save-dev @axe-core/react

# Integration in tests
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
```

---

## Analytics & Monitoring

### User Analytics
- **Exam Completion Rates**: Success/failure tracking
- **Performance Metrics**: Load times and interactions
- **Error Tracking**: Client-side error reporting
- **User Behavior**: Navigation patterns and feature usage

### AI Monitoring Dashboard
- **Real-time Behavior Analysis**: Live proctoring feed
- **Risk Assessment Visualization**: Dynamic charts and alerts
- **Evidence Management**: Flagged incident review
- **Statistical Reports**: Comprehensive analytics

---

## Additional Resources

### Development Resources
- [React Documentation](https://reactjs.org/docs)
- [Create React App Guide](https://create-react-app.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [WebRTC API Reference](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

### AI Proctoring Resources
- [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices)
- [Computer Vision with JavaScript](https://docs.opencv.org/4.x/df/d0a/tutorial_js_table_of_contents_setup.html)
- [Machine Learning in Browser](https://www.tensorflow.org/js)

### Security Best Practices
- [OWASP Frontend Security](https://owasp.org/www-project-front-end-security/)
- [React Security Best Practices](https://snyk.io/blog/10-react-security-best-practices/)

---

## Contributing

### Development Workflow
1. **Fork the repository** and create a feature branch
2. **Follow coding standards** and component patterns
3. **Write tests** for new functionality
4. **Update documentation** as needed
5. **Submit pull request** with detailed description

### Code Standards
- **ESLint Configuration**: Consistent code formatting
- **Prettier Integration**: Automatic code formatting
- **Component Naming**: PascalCase for components
- **File Organization**: Feature-based folder structure
- **Git Conventions**: Conventional commit messages

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] Accessibility tested

## Screenshots (if applicable)
Add screenshots for UI changes
```

---

## Support & Contact

### Team Contact
- **Project Lead**: Vivek Chaudhary
- **Repository**: [CanYouCheat](https://github.com/VivekChaudhary111/CanYouCheat)
- **Branch**: `vivek` (active development)

### Issue Reporting
For bugs, feature requests, or questions:
1. Check existing issues first
2. Use appropriate issue templates
3. Provide detailed reproduction steps
4. Include browser and system information

---

## License

This project is part of the **AI-Enhanced Online Exam Proctoring System** developed for educational purposes and academic integrity enhancement.

---

<div align="center>
  <p><strong>Built with care for secure online education</strong></p>
  <p>Ensuring Academic Integrity with AI-Powered Proctoring</p>
</div>