import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ExamHeader from './components/ExamHeader';
import ExamFooter from './components/ExamFooter';
import QuestionDisplay from './components/QuestionDisplay';
import WebcamMonitor from './components/WebcamMonitor';
import SystemCheck from './components/SystemCheck';
import SubmissionConfirm from './components/SubmissionConfirm';
import { useExamTimer } from './hooks/useExamTimer';
import { useWebcamAccess } from './hooks/useWebcamAccess';
import { useExamSubmission } from './hooks/useExamSubmission';
import './ExamTaking.css';

const ExamTaking = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { token, user, isStudent } = useAuth();
  
  // State management
  const [exam, setExam] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [examStarted, setExamStarted] = useState(false);
  const [systemCheckPassed, setSystemCheckPassed] = useState(false);
  const [showSubmissionConfirm, setShowSubmissionConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [sessionId, setSessionId] = useState(null);

  // Custom hooks
  const { timeRemaining, startTimer, stopTimer, formatTime } = useExamTimer();
  const { 
    webcamStream, 
    isWebcamActive, 
    webcamError, 
    startWebcam, 
    stopWebcam 
  } = useWebcamAccess();
  const { submitExam, submissionLoading } = useExamSubmission();

  // Fetch exam data - wrapped in useCallback to fix dependency warning
  const fetchExamData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`http://localhost:5000/api/exams/${examId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        console.log('📊 Exam data received:', data.exam);
        console.log('📸 Questions with images:', data.exam.questions.filter(q => q.image).length);
        
        // Log each question's image status
        data.exam.questions.forEach((q, index) => {
          if (q.image) {
            console.log(`🖼️ Question ${index + 1} has image:`, {
              hasData: !!q.image.data,
              altText: q.image.altText,
              type: q.image.type
            });
          }
        });
        
        setExam(data.exam);
        
        // Initialize answers object
        const initialAnswers = {};
        data.exam.questions.forEach((_, index) => {
          initialAnswers[index] = null;
        });
        setAnswers(initialAnswers);
      } else {
        throw new Error(data.message || 'Failed to fetch exam data');
      }
    } catch (error) {
      console.error('Error fetching exam:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [examId, token]);

  // Fetch exam data
  useEffect(() => {
    if (!isStudent) {
      navigate('/dashboard');
      return;
    }
    
    if (examId && token) {
      fetchExamData();
    }
  }, [examId, token, isStudent, navigate, fetchExamData]);

  // Auto-submit when time runs out - wrapped in useCallback
  const handleAutoSubmit = useCallback(async () => {
    try {
      const submissionData = {
        sessionId,
        examId,
        answers,
        endTime: new Date().toISOString(),
        submissionType: 'auto'
      };

      await submitExam(submissionData);
      stopWebcam();
      
      navigate('/exams', { 
        state: { 
          message: 'Time expired! Exam has been automatically submitted.',
          type: 'warning'
        }
      });
    } catch (error) {
      console.error('Error auto-submitting exam:', error);
      navigate('/exams', { 
        state: { 
          message: 'Time expired! There was an error submitting your exam.',
          type: 'error'
        }
      });
    }
  }, [sessionId, examId, answers, submitExam, stopWebcam, navigate]);

  useEffect(() => {
    if (timeRemaining === 0 && examStarted) {
      handleAutoSubmit();
    }
  }, [timeRemaining, examStarted, handleAutoSubmit]);

  const createExamSession = async () => {
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
            // Fixed: Use window.screen instead of global screen
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSessionId(data.sessionId);
        return data.sessionId;
      } else {
        throw new Error(data.message || 'Failed to create exam session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      setError(error.message);
      return null;
    }
  };

  const handleSystemCheckComplete = async (checkResults) => {
    if (checkResults.passed) {
      setSystemCheckPassed(true);
      
      // Start webcam
      const webcamStarted = await startWebcam();
      if (!webcamStarted) {
        setError('Webcam access is required for this proctored exam');
        return;
      }
    } else {
      setError('System check failed. Please resolve the issues before starting the exam.');
    }
  };

  const handleStartExam = async () => {
    try {
      const newSessionId = await createExamSession();
      if (!newSessionId) return;

      setExamStarted(true);
      startTimer(exam.duration * 60); // Convert minutes to seconds
      
      // Add warning for exam start
      addWarning('Exam started. You are now being monitored.');
      
    } catch (error) {
      console.error('Error starting exam:', error);
      setError('Failed to start exam. Please try again.');
    }
  };

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
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

  const handleSubmitExam = () => {
    setShowSubmissionConfirm(true);
  };

  const handleConfirmSubmission = async () => {
    try {
      const submissionData = {
        sessionId,
        examId,
        answers,
        endTime: new Date().toISOString(),
        submissionType: 'manual'
      };

      const result = await submitExam(submissionData);
      
      if (result.success) {
        stopTimer();
        stopWebcam();
        navigate('/exams', { 
          state: { message: 'Exam submitted successfully!' }
        });
      } else {
        throw new Error(result.message || 'Failed to submit exam');
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      setError(error.message);
      setShowSubmissionConfirm(false);
    }
  };

  const addWarning = (message) => {
    const warning = {
      id: Date.now(),
      message,
      timestamp: new Date().toISOString()
    };
    
    setWarnings(prev => [...prev, warning]);
    
    // Auto-remove warning after 5 seconds
    setTimeout(() => {
      setWarnings(prev => prev.filter(w => w.id !== warning.id));
    }, 5000);
  };

  // Prevent navigation away from exam
  useEffect(() => {
    if (examStarted) {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your exam progress may be lost.';
        return e.returnValue;
      };

      const handleVisibilityChange = () => {
        if (document.hidden) {
          addWarning('Warning: Tab switching detected!');
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [examStarted]);

  // Rest of the component remains the same...
  if (loading) {
    return (
      <div className="exam-taking-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading Proctored Exam</h2>
          <p>Please wait while we prepare your exam environment.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exam-taking-container">
        <div className="error-state">
          <h2>Exam Access Error</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/exams')}>
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="exam-taking-container">
        <div className="error-state">
          <h2>Exam Not Found</h2>
          <p>The requested exam could not be found.</p>
          <button className="btn btn-primary" onClick={() => navigate('/exams')}>
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  // System check phase
  if (!systemCheckPassed) {
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

  // Pre-exam phase
  if (!examStarted) {
    return (
      <div className="exam-taking-container">
        <div className="pre-exam-container">
          <div className="exam-info-card">
            <h1>{exam.title}</h1>
            <p className="exam-description">{exam.description}</p>
            
            <div className="exam-details">
              <div className="detail-item">
                <span className="label">Duration:</span>
                <span className="value">{exam.duration} minutes</span>
              </div>
              <div className="detail-item">
                <span className="label">Total Questions:</span>
                <span className="value">{exam.questions.length}</span>
              </div>
              <div className="detail-item">
                <span className="label">Total Marks:</span>
                <span className="value">{exam.totalMarks}</span>
              </div>
              <div className="detail-item">
                <span className="label">Passing Score:</span>
                <span className="value">{exam.passingScore}</span>
              </div>
            </div>

            <div className="proctoring-notice">
              <h3>AI Proctoring Active</h3>
              <p>This exam is monitored by AI-enhanced proctoring technology:</p>
              <ul>
                {exam.proctoringSettings?.faceDetectionEnabled && <li>Face detection and tracking</li>}
                {exam.proctoringSettings?.eyeTrackingEnabled && <li>Eye movement analysis</li>}
                {exam.proctoringSettings?.voiceDetectionEnabled && <li>Audio monitoring</li>}
                {exam.proctoringSettings?.multiplePersonDetection && <li>Multiple person detection</li>}
                {exam.proctoringSettings?.browserActivityMonitoring && <li>Browser activity monitoring</li>}
              </ul>
            </div>

            <div className="webcam-preview">
              <WebcamMonitor 
                stream={webcamStream}
                isActive={isWebcamActive}
                error={webcamError}
                compact={false}
              />
            </div>

            <div className="start-exam-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/exams')}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary btn-large"
                onClick={handleStartExam}
                disabled={!isWebcamActive}
              >
                Start Proctored Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main exam interface
  return (
    <div className="exam-taking-container exam-active">
      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="warnings-container">
          {warnings.map(warning => (
            <div key={warning.id} className="warning-alert">
              {warning.message}
            </div>
          ))}
        </div>
      )}

      {/* Exam Header */}
      <ExamHeader
        exam={exam}
        timeRemaining={timeRemaining}
        currentQuestion={currentQuestionIndex}
        totalQuestions={exam.questions.length}
        isMonitoring={isWebcamActive}
      />

      <div className="exam-content">
        <div className="exam-main">
          {/* Question Display */}
          <QuestionDisplay
            question={exam.questions[currentQuestionIndex]}
            questionIndex={currentQuestionIndex}
            answer={answers[currentQuestionIndex]}
            onAnswerChange={handleAnswerChange}
            totalQuestions={exam.questions.length}
          />
        </div>

        {/* Webcam Monitor */}
        <div className="exam-sidebar">
          <WebcamMonitor 
            stream={webcamStream}
            isActive={isWebcamActive}
            error={webcamError}
            compact={true}
          />
        </div>
      </div>

      {/* Add ExamFooter here */}
      <ExamFooter
        currentQuestion={currentQuestionIndex}
        totalQuestions={exam.questions.length}
        onPrevious={() => handleQuestionNavigation('prev')}
        onNext={() => handleQuestionNavigation('next')}
        onSubmit={handleSubmitExam}
        answeredQuestions={Object.values(answers).filter(answer => answer !== null && answer !== '')}
        canSubmit={Object.values(answers).filter(answer => answer !== null && answer !== '').length > 0}
      />

      {/* Submission Confirmation Modal */}
      {showSubmissionConfirm && (
        <SubmissionConfirm
          exam={exam}
          answers={answers}
          onConfirm={handleConfirmSubmission}
          onCancel={() => setShowSubmissionConfirm(false)}
          loading={submissionLoading}
        />
      )}
    </div>
  );
};

export default ExamTaking;