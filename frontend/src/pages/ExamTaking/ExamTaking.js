import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ExamHeader from './components/ExamHeader';
import QuestionDisplay from './components/QuestionDisplay';
import NavigationPanel from './components/NavigationPanel';
import WebcamMonitor from './components/WebcamMonitor';
import SystemCheck from './components/SystemCheck';
import SubmissionConfirm from './components/SubmissionConfirm';
import ExamVerification from './components/ExamVerification'; // Import verification component
import { useExamTimer } from './hooks/useExamTimer';
import { useWebcamAccess } from './hooks/useWebcamAccess';
import { useExamSubmission } from './hooks/useExamSubmission';
import './ExamTaking.css';

// Simple loading spinner component (or use a library/CSS)
const LoadingSpinner = () => <div className="loading-spinner"></div>;

const ExamTaking = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { token, user, isStudent } = useAuth();

  // ## State Management
  // --- Exam Data & Progress ---
  const [exam, setExam] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [sessionId, setSessionId] = useState(null);

  // --- Exam Flow Control ---
  const [examFlowState, setExamFlowState] = useState('loading'); // loading, systemCheck, verification, preStart, active, error
  const [systemCheckPassed, setSystemCheckPassed] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [examStarted, setExamStarted] = useState(false); // Tracks if the timer has started
  const [showSubmissionConfirm, setShowSubmissionConfirm] = useState(false);

  // --- UI State ---
  const [loadingMessage, setLoadingMessage] = useState('Loading Proctored Exam...');
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]); // For proctoring warnings during the exam

  // ## Custom Hooks
  const { timeRemaining, startTimer, stopTimer, formatTime } = useExamTimer();
  const {
    webcamStream,
    isWebcamActive,
    webcamError,
    startWebcam,
    stopWebcam
  } = useWebcamAccess();
  const { submitExam, submissionLoading } = useExamSubmission();

  // ## Data Fetching
  const fetchExamData = useCallback(async () => {
    setLoadingMessage('Fetching exam details...');
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/exams/${examId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (response.ok) {
        setExam(data.exam);
        const initialAnswers = {};
        data.exam.questions.forEach((_, index) => {
          initialAnswers[index] = null; // Initialize with null or appropriate default
        });
        setAnswers(initialAnswers);
        setExamFlowState('systemCheck'); // Move to the next state after fetching
      } else {
        throw new Error(data.message || 'Failed to fetch exam data');
      }
    } catch (err) {
      console.error('❌ Error fetching exam:', err);
      setError(`Failed to load exam: ${err.message}`);
      setExamFlowState('error');
    }
  }, [examId, token]);

  // Initial effect to check role and fetch data
  useEffect(() => {
    if (!isStudent) {
      navigate('/dashboard'); // Redirect non-students
      return;
    }
    if (examId && token) {
      fetchExamData();
    } else {
      setError("Missing exam ID or authentication token.");
      setExamFlowState('error');
    }
  }, [examId, token, isStudent, navigate, fetchExamData]);

  // ## Exam Session Management
  const createExamSession = async () => {
    setLoadingMessage('Creating exam session...');
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/exams/${examId}/start-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId: user.id,
          browserInfo: {
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSessionId(data.sessionId);
        console.log('✅ Exam session created:', data.sessionId);
        return data.sessionId;
      } else {
        throw new Error(data.message || 'Failed to create exam session');
      }
    } catch (err) {
      console.error('❌ Error creating session:', err);
      setError(`Failed to start session: ${err.message}`);
      setExamFlowState('error'); // Revert to error state if session fails
      return null;
    }
  };

  // ## Event Handlers & Callbacks
  // --- System Check ---
  const handleSystemCheckComplete = async (checkResults) => {
    if (checkResults.passed) {
      setSystemCheckPassed(true);
      setLoadingMessage('Initializing webcam...');
      const webcamStarted = await startWebcam(); // Start webcam AFTER check passes
      if (webcamStarted) {
        setExamFlowState('verification'); // Move to verification
      } else {
        setError('Webcam access failed or was denied. Webcam is required for this proctored exam.');
        setExamFlowState('error'); // Go to error state if webcam fails
      }
    } else {
      setError('System check failed. Please resolve the issues and refresh the page to try again.');
      setExamFlowState('error'); // Stay in error state
    }
  };

  // --- Verification ---
  const handleVerificationSuccess = () => {
    console.log('✅ Identity verification successful.');
    setIsVerified(true);
    setExamFlowState('preStart'); // Move to pre-start screen
  };

  const handleVerificationFail = (failError) => {
    console.error('❌ Identity verification failed:', failError);
    setError(`Identity Verification Failed: ${failError}. Please ensure you are centered, well-lit, and match your registration photo. Refresh the page to try again.`);
    setExamFlowState('error'); // Go to error state on failure
    stopWebcam(); // Stop webcam on verification failure
  };

  // --- Start Exam ---
  const handleStartExam = async () => {
    setExamFlowState('loading'); // Show loading while creating session
    setLoadingMessage('Starting exam session...');
    const newSessionId = await createExamSession();
    if (newSessionId) {
      setExamStarted(true);
      startTimer(exam.duration * 60); // Start timer (duration in minutes -> seconds)
      addWarning('🚀 Exam started. Monitoring is active.');
      setExamFlowState('active'); // Finally, move to the active exam state
    }
    // Error handling is done within createExamSession
  };

  // --- During Exam ---
  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleQuestionNavigation = (direction) => {
    if (direction === 'next' && currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleQuestionJump = (questionIndex) => {
    if (questionIndex >= 0 && questionIndex < exam.questions.length) {
      setCurrentQuestionIndex(questionIndex);
    }
  };

  // --- Submission ---
  const triggerSubmit = () => {
    setShowSubmissionConfirm(true);
  };

  const cancelSubmit = () => {
    setShowSubmissionConfirm(false);
  };

  const confirmSubmit = async (submissionType = 'manual') => {
    setError(''); // Clear previous submission errors
    setShowSubmissionConfirm(false); // Close modal immediately

    const submissionData = {
      sessionId,
      examId,
      answers,
      endTime: new Date().toISOString(),
      submissionType
    };

    const result = await submitExam(submissionData); // submitExam handles its own loading state

    if (result.success) {
      console.log(`✅ Exam ${submissionType}ly submitted.`);
      stopTimer();
      stopWebcam();
      navigate('/exams', {
        state: { message: `Exam submitted ${submissionType}ly.` }
      });
    } else {
      console.error(`❌ Exam ${submissionType} submission failed:`, result.message);
      setError(`Failed to submit exam: ${result.message}. Please try again or contact support.`);
      // Keep user on the exam page to allow retry or show error prominently
      setExamFlowState('active'); // Stay in active state but show error banner
      // Do NOT navigate away on failed submission
    }
  };

  // Auto-submit handler - uses confirmSubmit
  const handleAutoSubmit = useCallback(() => {
    if (examStarted && !submissionLoading) { // Prevent multiple submits
        console.warn('⏱️ Time expired. Auto-submitting exam...');
        addWarning('Time expired! Submitting your answers automatically.');
        confirmSubmit('auto');
    }
  }, [examStarted, submissionLoading, confirmSubmit]); // Add confirmSubmit dependency

  // Effect for timer expiration
  useEffect(() => {
    if (timeRemaining === 0 && examStarted) {
      handleAutoSubmit();
    }
  }, [timeRemaining, examStarted, handleAutoSubmit]);


  // ## Proctoring Warnings & Navigation Prevention
  const addWarning = useCallback((message) => {
    const warning = { id: Date.now(), message, timestamp: new Date().toISOString() };
    setWarnings(prev => [warning, ...prev].slice(0, 5)); // Keep only last 5 warnings
    // Optional: Log warning to backend here
  }, []);

  useEffect(() => {
    if (examStarted) {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your exam is in progress and may be submitted automatically.';
        return e.returnValue; // For older browsers
      };
      const handleVisibilityChange = () => {
        if (document.hidden) {
          addWarning('⚠️ Warning: Tab switched or window minimized!');
          // Log this event to backend session immediately
          // fetch(`http://localhost:5000/api/exams/sessions/${sessionId}/log`, { method: 'POST', ... });
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [examStarted, addWarning, sessionId]);

  // ## Render Logic based on Flow State

  // --- Loading State ---
  if (examFlowState === 'loading') {
    return (
      <div className="exam-taking-container loading-container">
        <LoadingSpinner />
        <h2>{loadingMessage}</h2>
        <p>Please wait...</p>
      </div>
    );
  }

  // --- Error State ---
  if (examFlowState === 'error') {
    return (
      <div className="exam-taking-container error-container">
        <h2>🚫 Exam Access Error</h2>
        <p className="error-message">{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/exams')}>
          Back to Exams List
        </button>
        {/* Optionally add a retry button that calls fetchExamData again */}
      </div>
    );
  }

  // --- System Check State ---
  if (examFlowState === 'systemCheck') {
    return (
      <div className="exam-taking-container">
        <SystemCheck
          exam={exam}
          onSystemCheckComplete={handleSystemCheckComplete}
          onCancel={() => navigate('/exams')}
        />
      </div>
    );
  }

  // --- Verification State ---
  if (examFlowState === 'verification') {
    // Ensure webcam is active before showing verification
    if (!isWebcamActive) {
      return (
         <div className="exam-taking-container loading-container">
            <LoadingSpinner />
            <h2>Initializing Webcam...</h2>
            {webcamError && <p className="error-message">{webcamError}</p>}
         </div>
      );
    }
    return (
      <div className="exam-taking-container">
        <ExamVerification
          examId={examId}
          onVerificationSuccess={handleVerificationSuccess}
          onVerificationFail={handleVerificationFail}
          onCancel={() => { stopWebcam(); navigate('/exams'); }}
        />
      </div>
    );
  }

  // --- Pre-Start State ---
  if (examFlowState === 'preStart') {
    return (
      <div className="exam-taking-container pre-exam-container">
        <div className="exam-info-card">
          <h1>{exam.title}</h1>
          <p className="exam-description">{exam.description}</p>
          <div className="exam-details">
            <div className="detail-item"><span className="label">Duration:</span> <span className="value">{exam.duration} minutes</span></div>
            <div className="detail-item"><span className="label">Questions:</span> <span className="value">{exam.questions.length}</span></div>
            <div className="detail-item"><span className="label">Marks:</span> <span className="value">{exam.totalMarks}</span></div>
            <div className="detail-item"><span className="label">Passing:</span> <span className="value">{exam.passingScore}</span></div>
          </div>
          <div className="proctoring-notice">
            <h3>🔒 AI Proctoring Active</h3>
            <p>Identity verified. This exam will be monitored using:</p>
            {/* Dynamically list enabled features based on exam.proctoringSettings */}
            <ul>
              {exam.proctoringSettings?.faceDetectionEnabled && <li>Face detection and tracking</li>}
              {exam.proctoringSettings?.eyeTrackingEnabled && <li>Gaze direction analysis</li>}
              {/* Add other features as needed */}
              <li>Webcam & Microphone Recording</li>
              <li>Browser Activity Monitoring</li>
            </ul>
          </div>
          <div className="webcam-preview pre-start-webcam">
            <WebcamMonitor stream={webcamStream} isActive={isWebcamActive} error={webcamError} compact={false} />
          </div>
          <div className="start-exam-actions">
            <button className="btn btn-secondary" onClick={() => { stopWebcam(); navigate('/exams'); }}>
              Cancel
            </button>
            <button className="btn btn-primary btn-large" onClick={handleStartExam} disabled={!isWebcamActive}>
              Start Proctored Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Active Exam State ---
  if (examFlowState === 'active') {
    return (
      <div className="exam-taking-container exam-active">
        {/* Global Error Banner (for submission errors etc.) */}
        {error && (
            <div className="error-banner">
                <span>{error}</span>
                <button onClick={() => setError('')}>&times;</button>
            </div>
        )}
        {/* Warnings Area */}
        {warnings.length > 0 && (
          <div className="warnings-container">
            {warnings.map(warning => (
              <div key={warning.id} className="warning-alert">
                {warning.message}
              </div>
            ))}
          </div>
        )}

        <ExamHeader
          exam={exam}
          timeRemaining={timeRemaining}
          formatTime={formatTime}
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={exam.questions.length}
          onSubmit={triggerSubmit} // Use triggerSubmit to show modal
        />

        <div className="exam-content">
          <div className="exam-main">
            <QuestionDisplay
              question={exam.questions[currentQuestionIndex]}
              questionIndex={currentQuestionIndex}
              answer={answers[currentQuestionIndex]}
              onAnswerChange={handleAnswerChange}
              totalQuestions={exam.questions.length}
            />
            <NavigationPanel
              questions={exam.questions}
              answers={answers}
              currentQuestionIndex={currentQuestionIndex}
              onQuestionNavigation={handleQuestionNavigation}
              onQuestionJump={handleQuestionJump}
              onSubmit={triggerSubmit} // Use triggerSubmit
            />
          </div>
          <div className="exam-sidebar">
            <WebcamMonitor
              stream={webcamStream}
              isActive={isWebcamActive}
              error={webcamError}
              compact={true} // Use compact view during exam
              // Pass sessionId and examId for sending frames/flags
              sessionId={sessionId}
              examId={examId}
              onProctoringEvent={addWarning} // Callback for webcam monitor to add warnings
            />
            {/* You could add a proctoring status indicator here */}
          </div>
        </div>

        {/* Submission Confirmation Modal */}
        {showSubmissionConfirm && (
          <SubmissionConfirm
            exam={exam}
            answers={answers}
            onConfirm={() => confirmSubmit('manual')} // Use confirmSubmit
            onCancel={cancelSubmit}
            loading={submissionLoading}
          />
        )}
      </div>
    );
  }

  // Fallback if state is somehow invalid
  return (
    <div className="exam-taking-container error-container">
      <h2>Unexpected Error</h2>
      <p>An unexpected error occurred in the exam flow. Please refresh or go back.</p>
       <button className="btn btn-secondary" onClick={() => navigate('/exams')}>
          Back to Exams List
        </button>
    </div>
  );
};

export default ExamTaking;