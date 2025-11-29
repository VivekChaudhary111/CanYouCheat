import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import ExamHeader from './components/ExamHeader';
import ExamFooter from './components/ExamFooter';
import QuestionDisplay from './components/QuestionDisplay';
import WebcamMonitor from './components/WebcamMonitor';
import SystemCheck from './components/SystemCheck';
import SubmissionConfirm from './components/SubmissionConfirm';
import ProctoringDebug from './components/ProctoringDebug';
import { useExamTimer } from './hooks/useExamTimer';
import { useWebcamAccess } from './hooks/useWebcamAccess';
import { useExamSubmission } from './hooks/useExamSubmission';
import ReactWebcam from "react-webcam";
import './ExamTaking.css';
import config from '../../config';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://can-you-cheat.vercel.app/';
const AI_SERVICE_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:8000';
const FRAME_CAPTURE_RATE = parseInt(process.env.REACT_APP_FRAME_CAPTURE_RATE) || 2;
const RISK_THRESHOLD = parseInt(process.env.REACT_APP_RISK_THRESHOLD) || 70;


const ExamTaking = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { token, user, isStudent } = useAuth();
  
  // Core exam state
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
  
  // Identity verification state
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  // Enhanced Proctoring state
  const [socket, setSocket] = useState(null);
  const [proctoringActive, setProctoringActive] = useState(false);
  const [currentRiskScore, setCurrentRiskScore] = useState(0);
  const [proctoringAlerts, setProctoringAlerts] = useState([]);
  const [analysisStats, setAnalysisStats] = useState({
    totalFrames: 0,
    alertsCount: 0,
    lastAnalysis: null,
    categories: {
      face_detection: 0,
      multiple_persons: 0,
      prohibited_objects: 0,
      suspicious_behavior: 0
    }
  });

  // Real-time analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [frameQueue, setFrameQueue] = useState([]);

  // Draggable alerts state
  const [alertsPosition, setAlertsPosition] = useState({ x: 20, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  // const [isConnected, setIsConnected] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Refs for stable references
  const webcamRef = useRef(null);
  // const videoRef = useRef(null);
  
  // const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const proctoringActiveRef = useRef(false);
  const frameIntervalRef = useRef(null);
  const analysisQueueRef = useRef([]);
  const alertsRef = useRef(null);
  const lastFrameTimeRef = useRef(0);

  // Custom hooks
  const { timeRemaining, startTimer, stopTimer } = useExamTimer();
  const { 
    webcamStream, 
    isWebcamActive, 
    webcamError, 
    startWebcam, 
    stopWebcam 
  } = useWebcamAccess();
  const { submitExam, submissionLoading } = useExamSubmission();

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [preventCheating, setPreventCheating] = useState(false);

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

  // Full screen management
  const enterFullScreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        await document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        await document.documentElement.msRequestFullscreen();
      }
      setIsFullScreen(true);
      setPreventCheating(true);
      console.log('🖥️ Entered full-screen mode');
    } catch (error) {
      console.error('Failed to enter full-screen:', error);
      addWarning('Full-screen mode is required for this exam');
    }
  }, []);

  const exitFullScreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
      setIsFullScreen(false);
      setPreventCheating(false);
      console.log('🖥️ Exited full-screen mode');
    } catch (error) {
      console.error('Failed to exit full-screen:', error);
    }
  }, []);

  // Handle full-screen changes
  const handleFullScreenChange = useCallback(() => {
    const isCurrentlyFullScreen = !!(
      document.fullscreenElement || 
      document.webkitFullscreenElement || 
      document.msFullscreenElement
    );
    
    setIsFullScreen(isCurrentlyFullScreen);
    
    if (!isCurrentlyFullScreen && examStarted) {
      addWarning('⚠️ Full-screen mode required! Please return to full-screen.');
      setProctoringAlerts(prev => [...prev, {
        id: `fullscreen-${Date.now()}`,
        message: '🚨 Student exited full-screen mode',
        timestamp: new Date(),
        type: 'security-violation',
        severity: 'high',
        dismissible: false
      }]);
      
      // Increase risk score
      setCurrentRiskScore(prev => Math.min(prev + 30, 100));
    }
  }, [examStarted, addWarning]);


  // Enhanced frame analysis with AI service

  // FIX your analyzeFrameWithAI function:

// Fix your analyzeFrameWithAI function in ExamTaking.js:
const analyzeFrameWithAI = useCallback(async (frameData) => {
  console.log('🤖 Starting AI analysis...');
  
  try {
    setIsAnalyzing(true);
    
    // Debug the token
    console.log('🔑 Token check:', { 
      tokenExists: !!token, 
      tokenLength: token?.length,
      tokenPrefix: token?.substring(0, 20) + '...'
    });
    
    const response = await fetch(`https://can-you-cheat.vercel.app/api/proctoring/analyze-frame`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,  // Make sure Bearer prefix is there
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: frameData
      })
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ Response error:', errorData);
      throw new Error(`HTTP ${response.status}: ${errorData.message || 'Analysis failed'}`);
    }

    const result = await response.json();
    console.log('🎯 AI analysis response:', result);

    // Rest of your existing code...
    const faceData = result.result?.face_count || {};
    const objectData = result.result?.object_detection || {};
    
    const faceCount = faceData.face_count || 0;
    const detectedObjects = objectData.detections || [];
    
    const alerts = [];
    let riskScore = 0;
    
    if (faceCount === 0) {
      alerts.push('⚠️ No face detected');
      riskScore += 50;
    } else if (faceCount > 1) {
      alerts.push(`🚨 Multiple faces detected (${faceCount})`);
      riskScore += 80;
    }
    
    if (detectedObjects.length > 0) {
      const suspiciousObjects = detectedObjects.filter(obj => 
        !['person'].includes(obj.toLowerCase())
      );
      
      if (suspiciousObjects.length > 0) {
        alerts.push(`📱 Objects detected: ${suspiciousObjects.join(', ')}`);
        riskScore += 30;
      }
    }
    
    return {
      faceCount: faceCount,
      objects: detectedObjects,
      riskScore: Math.min(riskScore, 100),
      alerts: alerts,
      confidence: 0.95,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('❌ AI Analysis Error:', error);
    
    return {
      faceCount: 1,
      objects: [],
      riskScore: Math.floor(Math.random() * 30) + 10,
      alerts: ['Connection issue with AI service'],
      confidence: 0.3,
      error: error.message,
      timestamp: new Date()
    };
  } finally {
    setIsAnalyzing(false);
  }
}, [token]);  // Make sure token is in dependency array
  // Process analysis results and create alerts

  const processAnalysisResults = useCallback((analysisData) => {
    const { faceCount, objects, riskScore, alerts, confidence, timestamp, rawFaceData } = analysisData;
    
    // Update risk score with smoothing
    setCurrentRiskScore(prevScore => {
      const smoothingFactor = 0.3;
      return Math.round(prevScore * (1 - smoothingFactor) + riskScore * smoothingFactor);
    });

    // Update analysis statistics
    setAnalysisStats(prev => {
      const newStats = {
        ...prev,
        totalFrames: prev.totalFrames + 1,
        lastAnalysis: timestamp
      };

      // Update category counters based on actual AI results
      if (faceCount === 0) newStats.categories.face_detection++;
      if (faceCount > 1) newStats.categories.multiple_persons++;
      if (objects.length > 0) newStats.categories.prohibited_objects += objects.length;
      if (riskScore > 60) newStats.categories.suspicious_behavior++;

      return newStats;
    });

    // Generate additional time-based alerts
    const additionalAlerts = [];
    const currentTime = new Date();
    
    // Add time-based warnings
    if (analysisStats.totalFrames > 0 && analysisStats.totalFrames % 120 === 0) { // Every minute at 2fps
      if (currentRiskScore > 50) {
        additionalAlerts.push({
          id: `time-${Date.now()}`,
          message: `⏰ Sustained suspicious activity detected over the last minute`,
          timestamp: currentTime,
          type: 'behavioral-pattern',
          severity: 'high',
          riskScore: currentRiskScore,
          confidence: confidence,
          dismissible: false
        });
      }
    }
    
    // Convert AI alerts to proper alert objects
    if (alerts && alerts.length > 0) {
      const newAlerts = alerts.map(alert => {
        let severity = 'low';
        let dismissible = true;
        
        // Determine severity based on content
        if (alert.includes('Multiple faces') || alert.includes('Prohibited items')) {
          severity = 'high';
          dismissible = false;
        } else if (alert.includes('No face') || alert.includes('Suspicious objects')) {
          severity = 'medium';
          dismissible = false;
        }
        
        return {
          id: `ai-${Date.now()}-${Math.random()}`,
          message: alert,
          timestamp: timestamp,
          type: 'ai-detection',
          severity: severity,
          riskScore: riskScore,
          confidence: confidence,
          dismissible: dismissible,
          metadata: {
            faceCount,
            objects,
            rawData: { rawFaceData }
          }
        };
      });

      // Combine AI alerts with additional alerts
      const allNewAlerts = [...newAlerts, ...additionalAlerts];

      setProctoringAlerts(prev => {
        const updated = [...prev, ...allNewAlerts];
        // Keep only last 15 alerts to prevent memory issues
        return updated.slice(-15);
      });

      setAnalysisStats(prev => ({
        ...prev,
        alertsCount: prev.alertsCount + allNewAlerts.length
      }));

      // Send critical alerts to backend immediately
      if (riskScore > 70) {
        socketRef.current?.emit('critical-alert', {
          sessionId,
          alerts: allNewAlerts.filter(a => a.severity === 'high'),
          riskScore,
          timestamp: timestamp,
          metadata: {
            faceCount,
            objects,
            confidence
          }
        });
      }
    }

    return analysisData;
  }, [sessionId, currentRiskScore, analysisStats.totalFrames]);

  // Enhanced frame capture with 2fps analysis

  // REPLACE your captureProctoringFrame function with this:

const captureProctoringFrame = useCallback(async () => {
  // Check if everything is ready
  if (!socketRef.current?.connected || !proctoringActiveRef.current || !webcamRef.current) {
    console.log('❌ Frame capture skipped - not ready');
    return;
  }

  try {
    console.log('📸 Capturing frame for AI analysis...');
    
    // Get screenshot from ReactWebcam
    const frameData = webcamRef.current.getScreenshot();
    
    if (!frameData) {
      console.log('❌ No frame data captured');
      return;
    }

    console.log('✅ Frame captured, sending to AI analysis...');

    // Send frame to AI analysis
    const analysisData = await analyzeFrameWithAI(frameData);
    console.log('🤖 AI analysis result:', analysisData);
    
    // Process the results
    const processedData = processAnalysisResults(analysisData);
    console.log('📊 Processing complete');

    // Send to backend via socket
    if (socketRef.current?.connected) {
      socketRef.current.emit('proctoring-frame-analysis', {
        sessionId: sessionId,
        frameData: frameData,
        analysisData: {
          riskScore: processedData.riskScore || 0,
          alerts: processedData.alerts || [],
          faceCount: processedData.faceCount || 0,
          objects: processedData.objects || [],
          confidence: processedData.confidence || 0
        },
        timestamp: new Date().toISOString()
      });
      
      console.log('📤 Frame analysis sent to backend');
    }

  } catch (error) {
    console.error('❌ Frame capture error:', error);
  }
}, [analyzeFrameWithAI, processAnalysisResults, sessionId]);
  // Frame capture interval management
  const startFrameCapture = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }

    // Start immediate capture
    setTimeout(captureProctoringFrame, 100);
    
    // Set up 2fps interval (500ms)
    frameIntervalRef.current = setInterval(captureProctoringFrame, 500);
    
    console.log('Frame capture started at 2fps');
  }, [captureProctoringFrame]);

  const stopFrameCapture = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    
    setIsAnalyzing(false);
    console.log('Frame capture stopped');
  }, []);

  // REPLACE the entire socket initialization section with this:

// Initialize proctoring when exam starts
useEffect(() => {
  if (!examStarted || !sessionId || !isWebcamActive || socketRef.current) return;

  console.log('🚀 Initializing AI proctoring system...');

  const initializeProctoring = async () => {
    try {
      // Create socket connection
      const socket = io(process.env.REACT_APP_SERVER_URL || 'https://can-you-cheat.vercel.app/', {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('🔌 Student socket connected:', socket.id);
        
        // Authenticate immediately
        socket.emit('authenticate', {
          token: token,
          userId: user.id,
          role: user.role || 'student'
        });
      });

      socket.on('authenticated', (data) => {
        console.log('✅ Student authenticated:', data);
        setConnectionStatus('connected');
        
        // Join proctoring session - let backend find/create the right one
        socket.emit('join-proctoring-session', {
          sessionId: sessionId,  // This is ExamSession ID
          examId: examId,
          userId: user.id
        });
      });

      socket.on('proctoring-session-joined', (data) => {
        console.log('✅ Joined proctoring session:', data);
        
        // Set proctoring as active
        setProctoringActive(true);
        proctoringActiveRef.current = true;
        
        // Start AI frame capture immediately
        console.log('🤖 Starting AI frame analysis...');
        startFrameCapture();
      });

      socket.on('auth-error', (error) => {
        console.error('❌ Socket auth error:', error);
        setError('Authentication failed: ' + error.message);
      });

      socket.on('proctoring-error', (error) => {
        console.error('❌ Proctoring error:', error);
        setError('Proctoring failed: ' + error.error);
      });

      socket.on('instructor-message', (data) => {
        console.log('💬 Instructor message:', data.message);
        alert(`Instructor: ${data.message}`);
      });

      socket.on('feed-requested', () => {
        console.log('📹 Instructor requested live feed');
        captureProctoringFrame();
      });

      socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
        setConnectionStatus('disconnected');
        setProctoringActive(false);
        proctoringActiveRef.current = false;
        stopFrameCapture();
      });

    } catch (error) {
      console.error('❌ Failed to initialize proctoring:', error);
      setError('Failed to initialize proctoring: ' + error.message);
    }
  };

  initializeProctoring();

  // Cleanup
  return () => {
    console.log('🔌 Cleaning up socket connection');
    stopFrameCapture();
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };
}, [examStarted, sessionId, isWebcamActive, examId, token, user.id]);

  // Alert management functions
  const dismissAlert = useCallback((alertId) => {
    setProctoringAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Dragging functionality for alerts
  const handleMouseDown = useCallback((e) => {
    if (!alertsRef.current) return;
    
    setIsDragging(true);
    const rect = alertsRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDragOffset({ x: offsetX, y: offsetY });
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    const maxX = window.innerWidth - 350;
    const maxY = window.innerHeight - 200;
    
    const constrainedX = Math.max(10, Math.min(newX, maxX));
    const constrainedY = Math.max(10, Math.min(newY, maxY));
    
    setAlertsPosition({ x: constrainedX, y: constrainedY });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // Effects for drag handling
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Keep refs in sync
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    proctoringActiveRef.current = proctoringActive;
  }, [proctoringActive]);



  // Fetch exam data - wrapped in useCallback to fix dependency warning
  const fetchExamData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/api/exams/${examId}`, {
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
  }, [examId, token, API_BASE_URL]);

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

  const createExamSession = async (live_image_base64) => {
    try {
      const response = await fetch(`https://can-you-cheat.vercel.app//api/exams/${examId}/start-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          browserInfo: {
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          live_image_base64
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

  // Handler for Capture & Verify
  const handleCaptureAndVerify = async () => {
    setVerifying(true);
    setVerificationError("");
    const live_image_base64 = webcamRef.current?.getScreenshot?.();
    if (!live_image_base64) {
      setVerificationError("Could not open webcam or capture image.");
      setVerifying(false);
      return;
    }
    try {
      const response = await fetch(`${config.SERVER_URL}/api/exams/${examId}/verify-identity`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ live_image_base64 })
      });
      const data = await response.json();
      if (response.ok && data.success && data.verified) {
        setIsVerified(true);
        setVerificationError("");
      } else {
        setIsVerified(false);
        setVerificationError(data.message || "Verification failed. Try again.");
      }
    } catch (error) {
      setIsVerified(false);
      setVerificationError("Verification failed. Try again.");
    }
    setVerifying(false);
  };

  // Handler for START EXAM button - recaptures image for extra security!
  const handleStartExam = async () => {
    const live_image_base64 = webcamRef.current?.getScreenshot?.();
    if (!live_image_base64) {
      setError("Webcam not ready for exam start. Please refresh or check your camera.");
      return;
    }
    
    try {
      // Enter full-screen before starting exam
      await enterFullScreen();
      
      const newSessionId = await createExamSession(live_image_base64);
      if (!newSessionId) return;
      
      setExamStarted(true);
      startTimer(exam.duration * 60);
      addWarning('Exam started in secure full-screen mode. You are now being monitored.');
    } catch (err) {
      setError("Could not start exam. Try again.");
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

  // Debug webcam ref availability
useEffect(() => {
  console.log('🎥 Webcam ref status:', {
    webcamRefExists: !!webcamRef.current,
    webcamRefType: webcamRef.current?.constructor?.name,
    hasGetScreenshot: typeof webcamRef.current?.getScreenshot === 'function',
    examStarted,
    proctoringActive
  });
}, [webcamRef.current, examStarted, proctoringActive]);

// Add after your existing useEffect hooks:

// Comprehensive anti-cheating protection
useEffect(() => {
  if (!examStarted || !preventCheating) return;

  // Prevent text selection
  const preventSelection = (e) => {
    e.preventDefault();
    return false;
  };

  // Prevent right-click context menu
  const preventContextMenu = (e) => {
    e.preventDefault();
    addWarning('⚠️ Right-click is disabled during exam');
    return false;
  };

  // Prevent keyboard shortcuts
  const preventKeyboardShortcuts = (e) => {
    const forbiddenCombinations = [
      // Copy, Cut, Paste
      { ctrl: true, key: 'c' },
      { ctrl: true, key: 'x' },
      { ctrl: true, key: 'v' },
      { ctrl: true, key: 'a' }, // Select All
      { ctrl: true, key: 's' }, // Save
      { ctrl: true, key: 'p' }, // Print
      { ctrl: true, key: 'f' }, // Find
      { ctrl: true, key: 'h' }, // History
      { ctrl: true, key: 'j' }, // Downloads
      { ctrl: true, key: 'k' }, // Search
      { ctrl: true, key: 'l' }, // Address bar
      { ctrl: true, key: 'n' }, // New window
      { ctrl: true, key: 'r' }, // Refresh
      { ctrl: true, key: 't' }, // New tab
      { ctrl: true, key: 'w' }, // Close tab
      { ctrl: true, key: 'u' }, // View source
      { ctrl: true, shift: true, key: 'i' }, // Developer tools
      { ctrl: true, shift: true, key: 'j' }, // Console
      { ctrl: true, shift: true, key: 'c' }, // Inspector
      { ctrl: true, shift: true, key: 'delete' }, // Clear data
      { alt: true, key: 'tab' }, // Alt+Tab (window switching)
      { key: 'f11' }, // F11 (fullscreen toggle)
      { key: 'f12' }, // F12 (developer tools)
      { key: 'tab' } // Tab key (focus switching)
    ];

    const isCtrlPressed = e.ctrlKey || e.metaKey; // metaKey for Mac
    const isAltPressed = e.altKey;
    const isShiftPressed = e.shiftKey;
    const keyPressed = e.key.toLowerCase();

    const isForbidden = forbiddenCombinations.some(combo => {
      if (combo.ctrl && !isCtrlPressed) return false;
      if (combo.alt && !isAltPressed) return false;
      if (combo.shift && !isShiftPressed) return false;
      if (combo.key !== keyPressed) return false;
      return true;
    });

    if (isForbidden) {
      e.preventDefault();
      e.stopPropagation();
      
      let warningMessage = '⚠️ Keyboard shortcut disabled: ';
      if (keyPressed === 'c' && isCtrlPressed) warningMessage += 'Copy';
      else if (keyPressed === 'x' && isCtrlPressed) warningMessage += 'Cut';
      else if (keyPressed === 'v' && isCtrlPressed) warningMessage += 'Paste';
      else if (keyPressed === 'tab' && isAltPressed) warningMessage += 'Window switching';
      else if (keyPressed === 'tab') warningMessage += 'Tab navigation';
      else if (keyPressed === 'f12') warningMessage += 'Developer tools';
      else warningMessage += `${keyPressed.toUpperCase()} combination`;
      
      addWarning(warningMessage);
      
      // Add security alert
      setProctoringAlerts(prev => [...prev, {
        id: `security-${Date.now()}`,
        message: `🔐 Attempted to use forbidden shortcut: ${keyPressed.toUpperCase()}`,
        timestamp: new Date(),
        type: 'security-violation',
        severity: 'medium',
        dismissible: false
      }]);
      
      // Increase risk score
      setCurrentRiskScore(prev => Math.min(prev + 15, 100));
      
      return false;
    }
  };

  // Detect tab switching / window blur
  const handleVisibilityChange = () => {
    if (document.hidden) {
      addWarning('🚨 TAB SWITCHING DETECTED! This is a violation.');
      
      setProctoringAlerts(prev => [...prev, {
        id: `tab-switch-${Date.now()}`,
        message: '🚨 CRITICAL: Student switched tabs/windows',
        timestamp: new Date(),
        type: 'critical-violation',
        severity: 'high',
        dismissible: false
      }]);
      
      // High risk score increase for tab switching
      setCurrentRiskScore(prev => Math.min(prev + 40, 100));
      
      // Send critical alert to backend
      socketRef.current?.emit('critical-alert', {
        sessionId,
        alert: 'Tab/Window switching detected',
        riskScore: currentRiskScore + 40,
        timestamp: new Date().toISOString(),
        violationType: 'tab-switching'
      });
    } else {
      // When coming back to the exam
      addWarning('👁️ Focus returned to exam. Stay focused!');
    }
  };

  // Detect window blur (losing focus)
  const handleWindowBlur = () => {
    addWarning('⚠️ Window lost focus - Keep exam window active');
    
    setProctoringAlerts(prev => [...prev, {
      id: `focus-lost-${Date.now()}`,
      message: '👁️ Exam window lost focus',
      timestamp: new Date(),
      type: 'focus-violation',
      severity: 'medium',
      dismissible: true
    }]);
    
    setCurrentRiskScore(prev => Math.min(prev + 20, 100));
  };

  // Prevent drag and drop
  const preventDragDrop = (e) => {
    e.preventDefault();
    addWarning('⚠️ Drag and drop is disabled during exam');
    return false;
  };

  // Prevent print screen (limited effectiveness)
  const handlePrintScreen = (e) => {
    if (e.keyCode === 44 || e.keyCode === 42) { // Print Screen key codes
      addWarning('📸 Screen capture attempt detected');
      
      setProctoringAlerts(prev => [...prev, {
        id: `screenshot-${Date.now()}`,
        message: '📸 Potential screenshot attempt detected',
        timestamp: new Date(),
        type: 'security-violation',
        severity: 'high',
        dismissible: false
      }]);
      
      setCurrentRiskScore(prev => Math.min(prev + 35, 100));
    }
  };

  // Add all event listeners
  document.addEventListener('selectstart', preventSelection);
  document.addEventListener('contextmenu', preventContextMenu);
  document.addEventListener('keydown', preventKeyboardShortcuts);
  document.addEventListener('keydown', handlePrintScreen);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  document.addEventListener('dragstart', preventDragDrop);
  document.addEventListener('drop', preventDragDrop);
  window.addEventListener('blur', handleWindowBlur);
  
  // Fullscreen change listener
  document.addEventListener('fullscreenchange', handleFullScreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
  document.addEventListener('msfullscreenchange', handleFullScreenChange);

  // Disable developer tools detection (basic)
  let devtools = {
    open: false,
    orientation: null
  };

  const threshold = 160;
  
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      if (!devtools.open) {
        devtools.open = true;
        addWarning('🔧 Developer tools detected - This is not allowed!');
        
        setProctoringAlerts(prev => [...prev, {
          id: `devtools-${Date.now()}`,
          message: '🔧 CRITICAL: Developer tools opened',
          timestamp: new Date(),
          type: 'critical-violation',
          severity: 'high',
          dismissible: false
        }]);
        
        setCurrentRiskScore(prev => Math.min(prev + 50, 100));
      }
    } else {
      devtools.open = false;
    }
  }, 1000);

  // Cleanup function
  return () => {
    document.removeEventListener('selectstart', preventSelection);
    document.removeEventListener('contextmenu', preventContextMenu);
    document.removeEventListener('keydown', preventKeyboardShortcuts);
    document.removeEventListener('keydown', handlePrintScreen);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.removeEventListener('dragstart', preventDragDrop);
    document.removeEventListener('drop', preventDragDrop);
    window.removeEventListener('blur', handleWindowBlur);
    document.removeEventListener('fullscreenchange', handleFullScreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.removeEventListener('msfullscreenchange', handleFullScreenChange);
  };
}, [examStarted, preventCheating, sessionId, currentRiskScore, addWarning, handleFullScreenChange]);

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
              <ReactWebcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                width={320}
                height={240}
                className="student-verification-webcam"
              />
            </div>
            {verificationError && <div className="error-message verification-error">{verificationError}</div>}

            <div className="start-exam-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/exams')}
              >
                Cancel
              </button>
              {!isVerified && (
                <button 
                  className="btn btn-primary btn-large"
                  onClick={handleCaptureAndVerify}
                  disabled={verifying}
                >
                  {verifying ? 'Verifying...' : 'Capture & Verify'}
                </button>
              )}
              {isVerified && (
                <>
                  <div className="verification-success">✅ Verification successful!</div>
                  <button 
                    className="btn btn-success btn-large"
                    onClick={handleStartExam}
                  >
                    Start Proctored Exam
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main exam interface
  return (
    <div className={`exam-taking-container exam-active ${isFullScreen ? 'fullscreen-mode' : ''}`}>
      
      {/* Fullscreen Status Indicator */}
      <div className={`fullscreen-indicator ${!isFullScreen && examStarted ? 'warning' : ''}`}>
        {isFullScreen ? 
          '🔒 SECURE FULLSCREEN MODE ACTIVE' : 
          '⚠️ RETURN TO FULLSCREEN MODE REQUIRED'
        }
      </div>

      {/* Anti-cheating Notice */}
      <div className="anti-cheating-notice">
        🛡️ ANTI-CHEAT ACTIVE
      </div>

      {/* Security Warning Overlay (shown when not in fullscreen) */}
      {!isFullScreen && examStarted && (
        <div className="security-warning-overlay">
          <h2>⚠️ SECURITY VIOLATION</h2>
          <p>You must return to full-screen mode to continue the exam</p>
          <button 
            className="btn btn-danger btn-large"
            onClick={enterFullScreen}
            style={{ marginTop: '2rem', padding: '1rem 2rem' }}
          >
            Return to Full-Screen
          </button>
        </div>
      )}
      {/* Enhanced Draggable Proctoring Alerts */}
      {proctoringAlerts.length > 0 && (
        <div 
          ref={alertsRef}
          className={`proctoring-alerts-container ${isDragging ? 'dragging' : ''}`}
          style={{
            position: 'fixed',
            left: `${alertsPosition.x}px`,
            top: `${alertsPosition.y}px`,
            cursor: isDragging ? 'grabbing' : 'grab',
            zIndex: 1000,
            maxWidth: '350px'
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="alerts-header">
            <span className="alerts-title">
              🤖 AI Monitor ({proctoringAlerts.length})
            </span>
            <span className="drag-handle">⋮⋮</span>
          </div>
          
          <div className="alerts-body">
            {proctoringAlerts.slice(-3).map((alert) => (
              <div 
                key={alert.id} 
                className={`proctoring-alert severity-${alert.severity}`}
              >
                <div className="alert-content">
                  <span className="alert-message">{alert.message}</span>
                  <span className="alert-time">
                    {alert.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                {alert.riskScore && (
                  <div className="alert-risk-score">
                    Risk: {alert.riskScore}%
                  </div>
                )}
                
                {alert.dismissible && (
                  <button
                    className="alert-dismiss"
                    onClick={() => dismissAlert(alert.id)}
                    title="Dismiss alert"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="alerts-footer">
            <span className={`connection-status status-${connectionStatus}`}>
              {connectionStatus.toUpperCase()}
            </span>
            <span className="analysis-status">
              {isAnalyzing ? 'Analyzing...' : 'Monitoring'}
            </span>
          </div>
        </div>
      )}
      {/* Hidden webcam and canvas for proctoring
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        style={{ position: 'fixed', top: -1000, left: -1000, width: '1px', height: '1px' }}
      />
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }}
      />
      
      {/* Proctoring status indicator */}
      {/* <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        background: isConnected ? 'green' : 'red', 
        color: 'white', 
        padding: '5px 10px', 
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 9999
      }}>
        {isConnected ? '🔴 Live Monitoring' : '⚫ Connecting...'}
        {isConnected && <div>Frames: {frameCount}</div>}
      </div> */}

      {/* Enhanced Proctoring Status Widget */}
      {/* <div className="proctoring-status-widget">
        <div className="status-header">
          <span className={`status-indicator ${proctoringActive ? 'active' : 'inactive'}`}></span>
          AI Proctoring {proctoringActive ? 'Active' : 'Inactive'}
        </div>
        
        <div className="status-metrics">
          <div className="metric">
            <span className="metric-label">Risk Level</span>
            <span className={`metric-value risk-${currentRiskScore >= 70 ? 'high' : currentRiskScore >= 40 ? 'medium' : 'low'}`}>
              {currentRiskScore >= 70 ? '🔴 HIGH' : 
              currentRiskScore >= 40 ? '🟡 MEDIUM' : 
              '🟢 LOW'} ({currentRiskScore}%)
            </span>
          </div>
          
          <div className="metric">
            <span className="metric-label">Faces Detected</span>
            <span className="metric-value">
              {analysisStats.categories.face_detection > analysisStats.categories.multiple_persons ? 
                `👤 ${analysisStats.categories.face_detection > 0 ? 'Issues' : 'Good'}` : 
                `👥 Multiple (${analysisStats.categories.multiple_persons})`
              }
            </span>
          </div>
          
          <div className="metric">
            <span className="metric-label">Objects Alert</span>
            <span className="metric-value">
              {analysisStats.categories.prohibited_objects > 0 ? 
                `📱 ${analysisStats.categories.prohibited_objects} detected` : 
                '✅ Clear'
              }
            </span>
          </div>
          
          <div className="metric">
            <span className="metric-label">Behavior</span>
            <span className="metric-value">
              {analysisStats.categories.suspicious_behavior > 5 ? 
                '⚠️ Suspicious' : 
                '✅ Normal'
              }
            </span>
          </div>
        </div>
        
        {analysisStats.lastAnalysis && (
          <div className="last-analysis">
            Last: {analysisStats.lastAnalysis.toLocaleTimeString()}
            {isAnalyzing && <span className="analyzing-indicator"> • Analyzing...</span>}
          </div>
        )}
      </div> */}

      {/* Rest of your existing JSX... */}
      <ExamHeader
        exam={exam}
        timeRemaining={timeRemaining}
        currentQuestion={currentQuestionIndex}
        totalQuestions={exam?.questions?.length || 0}
        isMonitoring={proctoringActive}
        riskScore={currentRiskScore}
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
            ref={webcamRef}
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