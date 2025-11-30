import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import './ProctoringDashboard.css';
const AI_SERVICE_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:8000';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ProctoringDashboard = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const socketRef = useRef(null);

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exam, setExam] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [liveFeed, setLiveFeed] = useState(null);
  const [message, setMessage] = useState('');

  // Live data state
  const [activeStudents, setActiveStudents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    highRiskStudents: 0,
    totalAlerts: 0
  });

  // Filter states
  const [studentFilter, setStudentFilter] = useState('all');
  const [alertFilter, setAlertFilter] = useState('all');

  // Early return checks
  useEffect(() => {
    if (!examId) {
      console.error('❌ No examId in URL');
      navigate('/dashboard');
      return;
    }

    if (!token || user?.role !== 'instructor') {
      navigate('/login');
      return;
    }

    console.log('✅ ExamId found:', examId);
    
    // Initialize everything
    initializeProctoring();

    // Cleanup function
    return () => {
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket...');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [examId, token, user]);

  // Initialize proctoring
  const initializeProctoring = async () => {
    try {
      setLoading(true);
      
      // Fetch exam details
      await fetchExamData();
      
      // Initialize socket connection
      initializeSocket();
      
    } catch (error) {
      console.error('❌ Failed to initialize proctoring:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch exam data
  const fetchExamData = async () => {
    try {
      const examResponse = await fetch(`${API_BASE_URL}/api/exams/${examId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!examResponse.ok) throw new Error('Failed to fetch exam');
      const examData = await examResponse.json();
      setExam(examData);
      
      console.log('📚 Exam data loaded:', examData.title);
      
    } catch (error) {
      throw new Error(`Failed to fetch exam: ${error.message}`);
    }
  };

  // Initialize socket connection
  const initializeSocket = () => {
    if (socketRef.current?.connected) {
      console.log('🔌 Socket already connected');
      return;
    }

    console.log('🔌 Initializing instructor socket...');

    const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true
    });

    // Connection events
    socket.on('connect', () => {
      console.log('🔌 Instructor socket connected:', socket.id);
      
      // Authenticate
      socket.emit('authenticate', {
        token: token,
        userId: user.id,
        role: user.role || 'instructor'
      });
    });

    socket.on('authenticated', (data) => {
      console.log('✅ Instructor authenticated:', data);
      setIsConnected(true);
      
      // Join exam monitoring
      socket.emit('join-exam-monitoring', {
        examId: examId,
        instructorId: user.id
      });
    });

    socket.on('auth-error', (error) => {
      console.error('❌ Socket auth error:', error);
      setError('Authentication failed');
    });

    // Exam monitoring events
    socket.on('current-active-sessions', (data) => {
      console.log('📋 Current active sessions:', data.sessions);
      
      const formattedSessions = data.sessions.map(session => ({
        userId: session.userId,
        sessionId: session.sessionId,
        studentName: session.studentName || `Student ${session.userId}`,
        studentEmail: session.studentEmail,
        status: 'active',
        riskScore: session.riskScore || 0,
        alertCount: session.alertCount || 0,
        frameCount: session.frameCount || 0,
        joinedAt: new Date(session.startTime),
        lastActivity: new Date(session.lastActivity),
        lastFrame: null
      }));
      
      setActiveStudents(formattedSessions);
      updateStats(formattedSessions, alerts);
    });

    // Student events
    socket.on('student-joined-proctoring', (data) => {
      const { userId, sessionId, timestamp } = data;
      console.log('👤 Student joined:', userId);
      
      setActiveStudents(prev => {
        const exists = prev.find(s => s.userId === userId);
        if (!exists) {
          const newStudent = {
            userId: userId,
            sessionId: sessionId,
            studentName: `Student ${userId}`,
            studentEmail: '',
            status: 'active',
            riskScore: 0,
            alertCount: 0,
            frameCount: 0,
            joinedAt: new Date(timestamp),
            lastActivity: new Date(timestamp),
            lastFrame: null
          };
          const updated = [...prev, newStudent];
          updateStats(updated, alerts);
          return updated;
        }
        return prev;
      });
    });

    socket.on('student-live-frame', (data) => {
      const { userId, frameData, analysisData, studentInfo } = data;
      
      // Update selected student's live feed
      if (selectedStudent && selectedStudent.userId === userId) {
        setLiveFeed(frameData);
      }
      
      // Update student in list
      setActiveStudents(prev => {
        const updated = prev.map(student => 
          student.userId === userId 
            ? { 
                ...student, 
                lastFrame: frameData,
                riskScore: analysisData?.riskScore || student.riskScore,
                lastActivity: new Date(),
                frameCount: student.frameCount + 1,
                status: 'active'
              }
            : student
        );
        updateStats(updated, alerts);
        return updated;
      });
    });

    socket.on('high-risk-activity', (data) => {
      const { userId, sessionId, riskScore, alerts: riskAlerts, frameData, timestamp } = data;
      
      console.log('🚨 High-risk activity:', { userId, riskScore });
      
      // Create alert
      const newAlert = {
        id: Date.now(),
        studentId: userId,
        studentName: activeStudents.find(s => s.userId === userId)?.studentName || 'Unknown Student',
        type: 'high_risk_behavior',
        severity: 'critical',
        message: `High risk behavior detected (Risk Score: ${riskScore})`,
        timestamp: new Date(timestamp),
        frameData: frameData,
        dismissed: false
      };
      
      setAlerts(prev => {
        const updated = [newAlert, ...prev];
        updateStats(activeStudents, updated);
        return updated;
      });
      
      // Update student risk score
      setActiveStudents(prev => {
        const updated = prev.map(student => 
          student.userId === userId 
            ? { ...student, riskScore: riskScore, alertCount: student.alertCount + 1 }
            : student
        );
        updateStats(updated, alerts);
        return updated;
      });

      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('High Risk Activity Detected', {
          body: `Student ${newAlert.studentName} - Risk Score: ${riskScore}`,
          icon: '/favicon.ico'
        });
      }
    });

    socket.on('critical-alert-broadcast', (data) => {
      const { userId, alert, violationType, riskScore, timestamp } = data;
      
      const newAlert = {
        id: Date.now(),
        studentId: userId,
        studentName: activeStudents.find(s => s.userId === userId)?.studentName || 'Unknown Student',
        type: violationType || 'violation',
        severity: riskScore >= 80 ? 'critical' : 'high',
        message: alert,
        timestamp: new Date(timestamp),
        dismissed: false
      };
      
      setAlerts(prev => {
        const updated = [newAlert, ...prev];
        updateStats(activeStudents, updated);
        return updated;
      });
    });

    socket.on('student-disconnected', (data) => {
      const { userId, reason, timestamp } = data;
      console.log('❌ Student disconnected:', userId, reason);
      
      setActiveStudents(prev => {
        const updated = prev.map(student => 
          student.userId === userId 
            ? { ...student, status: 'disconnected', lastActivity: new Date(timestamp) }
            : student
        );
        updateStats(updated, alerts);
        return updated;
      });
    });

    // Message events
    socket.on('message-sent', (data) => {
      console.log('✅ Message sent to student:', data);
      setMessage(''); // Clear message input
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    socketRef.current = socket;
  };

  // Update stats
  const updateStats = (students, currentAlerts) => {
    setStats({
      totalStudents: students.length,
      activeStudents: students.filter(s => s.status === 'active').length,
      highRiskStudents: students.filter(s => s.riskScore >= 70).length,
      totalAlerts: currentAlerts.length
    });
  };

  // Handle student selection
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    
    // Request fresh feed from this student
    if (socketRef.current && student.status === 'active') {
      socketRef.current.emit('request-student-feed', {
        userId: student.userId
      });
    }
  };

  // Send message to student
  const handleSendMessage = (studentId, messageText) => {
    if (socketRef.current && messageText.trim()) {
      socketRef.current.emit('instructor-message', {
        examId: examId,
        userId: studentId,
        message: messageText.trim(),
        timestamp: new Date().toISOString()
      });
    }
  };

  // Send quick message
  const sendQuickMessage = (studentId, messageText) => {
    handleSendMessage(studentId, messageText);
  };

  // Dismiss alert
  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, dismissed: true }
        : alert
    ));
  };

  // Filter functions
  const getFilteredStudents = () => {
    return activeStudents.filter(student => {
      if (studentFilter === 'active') return student.status === 'active';
      if (studentFilter === 'high-risk') return student.riskScore >= 70;
      if (studentFilter === 'disconnected') return student.status === 'disconnected';
      return true;
    });
  };

  const getFilteredAlerts = () => {
    return alerts.filter(alert => {
      if (alert.dismissed) return false;
      if (alertFilter === 'critical') return alert.severity === 'critical';
      if (alertFilter === 'high') return alert.severity === 'high';
      if (alertFilter === 'info') return alert.severity === 'info';
      return true;
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="instructor-proctoring loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading proctoring dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="instructor-proctoring error">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="instructor-proctoring">
      {/* Header */}
      <div className="proctoring-header">
        <div className="header-left">
          <h1>AI Proctoring Dashboard</h1>
          <div className="exam-info">
            <h2>{exam?.title || 'Loading...'}</h2>
            <span className="exam-code">Code: {exam?.examCode || 'N/A'}</span>
          </div>
        </div>
        <div className="live-stats">
          <div className="stat">
            <span className="stat-value">{stats.activeStudents}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.highRiskStudents}</span>
            <span className="stat-label">High Risk</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.totalAlerts}</span>
            <span className="stat-label">Alerts</span>
          </div>
          <div className="stat">
            <span className="stat-value" style={{ color: isConnected ? '#22c55e' : '#ef4444' }}>
              {isConnected ? 'LIVE' : 'OFF'}
            </span>
            <span className="stat-label">Status</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="proctoring-content">
        {/* Students Panel */}
        <div className="students-panel">
          <div className="panel-header">
            <h3>Students ({getFilteredStudents().length})</h3>
            <select 
              value={studentFilter} 
              onChange={(e) => setStudentFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Students</option>
              <option value="active">Active Only</option>
              <option value="high-risk">High Risk</option>
              <option value="disconnected">Disconnected</option>
            </select>
          </div>
          
          <div className="students-list">
            {getFilteredStudents().map(student => (
              <div 
                key={student.userId}
                className={`student-item ${selectedStudent?.userId === student.userId ? 'selected' : ''} ${
                  student.riskScore >= 70 ? 'risk-high' : 
                  student.riskScore >= 40 ? 'risk-medium' : 'risk-low'
                }`}
                onClick={() => handleStudentSelect(student)}
              >
                <div className="student-avatar">
                  👤
                  <div className={`status-indicator ${student.status}`}></div>
                </div>
                <div className="student-details">
                  <div className="student-name">{student.studentName}</div>
                  <div className="student-meta">
                    Risk: <span className="risk-score">{student.riskScore}%</span>
                  </div>
                  <div className="student-activity">
                    Frames: {student.frameCount} | Alerts: {student.alertCount}
                  </div>
                </div>
                {student.status === 'active' && (
                  <div className="student-actions">
                    <button 
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (socketRef.current) {
                          socketRef.current.emit('request-student-feed', {
                            userId: student.userId
                          });
                        }
                      }}
                      title="Request Live Feed"
                    >
                      📹
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {getFilteredStudents().length === 0 && (
              <div className="no-students">
                <p>No students match the current filter</p>
              </div>
            )}
          </div>
        </div>

        {/* Student Details Panel */}
        <div className="student-details-panel">
          {selectedStudent ? (
            <StudentDetailView 
              student={selectedStudent}
              liveFeed={liveFeed}
              onSendMessage={handleSendMessage}
              onSendQuickMessage={sendQuickMessage}
              message={message}
              setMessage={setMessage}
            />
          ) : (
            <div className="no-selection">
              <h3>Select a Student</h3>
              <p>Choose a student from the left panel to view their live proctoring feed and details.</p>
            </div>
          )}
        </div>

        {/* Alerts Panel */}
        <div className="alerts-panel">
          <div className="panel-header">
            <h3>Live Alerts ({getFilteredAlerts().length})</h3>
            <select 
              value={alertFilter} 
              onChange={(e) => setAlertFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Alerts</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="info">Info</option>
            </select>
          </div>
          
          <div className="alerts-list">
            {getFilteredAlerts().map(alert => (
              <div 
                key={alert.id} 
                className={`alert-item severity-${alert.severity}`}
              >
                <div className="alert-header">
                  <span className="alert-type-icon">
                    {alert.severity === 'critical' ? '🚨' : 
                     alert.severity === 'high' ? '⚠️' : 'ℹ️'}
                  </span>
                  <span className="alert-student">{alert.studentName}</span>
                  <span className="alert-time">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="alert-content">
                  {alert.message}
                </div>
                <div className="alert-actions">
                  <button 
                    className="dismiss-btn"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
            
            {getFilteredAlerts().length === 0 && (
              <div className="no-alerts">
                No active alerts
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Student Detail View Component
const StudentDetailView = ({ 
  student, 
  liveFeed, 
  onSendMessage, 
  onSendQuickMessage, 
  message, 
  setMessage 
}) => {
  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(student.userId, message);
    }
  };

  const quickMessages = [
    'Please look at the camera',
    'Return to exam window',
    'Stop talking during the exam',
    'Keep hands visible on camera'
  ];

  return (
    <div className="student-detail-view">
      <div className="student-header">
        <h3>{student.studentName}</h3>
        <div className="student-status">
          Status: <span className={`status ${student.status}`}>
            {student.status.toUpperCase()}
          </span>
          {' | '}
          Risk: <span className={`risk risk-${
            student.riskScore >= 70 ? 'high' : 
            student.riskScore >= 40 ? 'medium' : 'low'
          }`}>
            {student.riskScore}%
          </span>
        </div>
      </div>

      <div className="live-feed">
        <h4>Live Camera Feed</h4>
        {liveFeed ? (
          <img 
            src={liveFeed} 
            alt="Student Live Feed" 
            className="student-webcam"
          />
        ) : (
          <div className="no-feed">
            <p>No live feed available</p>
            <p>Waiting for student frames...</p>
          </div>
        )}
      </div>

      <div className="analysis-data">
        <h4>Session Analytics</h4>
        <div className="analysis-grid">
          <div className="metric">
            <span className="label">Frames Captured</span>
            <span className="value">{student.frameCount}</span>
          </div>
          <div className="metric">
            <span className="label">Alerts Count</span>
            <span className="value">{student.alertCount}</span>
          </div>
          <div className="metric">
            <span className="label">Session Time</span>
            <span className="value">
              {student.joinedAt ? Math.floor((new Date() - student.joinedAt) / 60000) : 0}m
            </span>
          </div>
          <div className="metric">
            <span className="label">Last Activity</span>
            <span className="value">
              {student.lastActivity ? 
                Math.floor((new Date() - student.lastActivity) / 1000) + 's ago' : 
                'N/A'
              }
            </span>
          </div>
        </div>
      </div>

      <div className="message-student">
        <h4>Send Message</h4>
        <div className="message-input-group">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button 
            onClick={handleSendMessage}
            className="send-btn"
            disabled={!message.trim()}
          >
            Send
          </button>
        </div>
        
        <div className="quick-messages">
          {quickMessages.map((msg, index) => (
            <button
              key={index}
              onClick={() => onSendQuickMessage(student.userId, msg)}
            >
              {msg}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProctoringDashboard;