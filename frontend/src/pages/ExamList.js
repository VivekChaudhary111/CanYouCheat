import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ExamList.css';

const ExamList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { token, isInstructor, isStudent, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Fetch exams with proper error handling for AI proctoring system
  const fetchExams = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Fetching AI-monitored exams...');
      
      const response = await fetch('http://localhost:5000/api/exams', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ AI proctoring exams fetched:', data.exams?.length || 0);
        setExams(data.exams || []);
      } else {
        throw new Error(data.message || 'Failed to fetch AI-monitored exams');
      }
    } catch (error) {
      console.error('❌ Error fetching AI proctoring exams:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    fetchExams();
  }, [isAuthenticated, navigate, fetchExams]);

  // Handle starting AI-monitored exam
  const handleStartExam = (examId) => {
    console.log('🚀 Starting AI-monitored exam:', examId);
    navigate(`/exams/${examId}/take`);
  };

  // Handle viewing exam results with AI analysis
  const handleViewResults = (examId) => {
    console.log('📊 Viewing AI proctoring results:', examId);
    navigate(`/exams/${examId}/results`);
  };

  // Handle managing students for AI proctoring
  const handleManageStudents = (examId) => {
    console.log('👥 Managing students for AI proctoring:', examId);
    navigate(`/exams/${examId}/students`);
  };

  // Handle editing AI-monitored exam
  const handleEditExam = (examId) => {
    console.log('✏️ Editing AI-monitored exam:', examId);
    navigate(`/exams/${examId}/edit`);
  };

  // Create demo exam for testing
  const handleCreateDemoExam = async () => {
    try {
      setMessage('Creating demo AI-monitored exam...');
      
      const response = await fetch('http://localhost:5000/api/exams/create-demo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Demo exam created successfully!');
        fetchExams(); // Refresh the list
      } else {
        throw new Error(data.message || 'Failed to create demo exam');
      }
    } catch (error) {
      console.error('❌ Error creating demo exam:', error);
      setError(error.message);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if exam is available for taking
  const isExamAvailable = (exam) => {
    const now = new Date();
    const startDate = new Date(exam.startDate);
    const endDate = new Date(exam.endDate);
    
    return exam.isActive && now >= startDate && now <= endDate && !exam.hasSubmitted;
  };

  if (loading) {
    return (
      <div className="exam-list-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading AI-Monitored Exams</h2>
          <p>Fetching your proctored examinations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-list-container">
      <div className="exam-list-header">
        <h1>
          {isStudent ? '📚 Your AI-Monitored Exams' : '🎓 Manage AI-Proctored Exams'}
        </h1>
        <p className="ai-proctoring-description">
          🤖 AI-Enhanced Online Exam Proctoring System with real-time behavior analysis
        </p>
        
        {/* Action buttons */}
        <div className="header-actions">
          {isInstructor && (
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/create-exam')}
            >
              ➕ Create AI-Monitored Exam
            </button>
          )}
          
          {exams.length === 0 && (
            <button 
              className="btn btn-secondary"
              onClick={handleCreateDemoExam}
            >
              🧪 Create Demo Exam
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="alert alert-success">
          {message}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Exam List */}
      {exams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No AI-Monitored Exams Available</h3>
          <p>
            {isStudent 
              ? 'You have no assigned AI-proctored exams at the moment.'
              : 'Create your first AI-monitored exam to get started.'
            }
          </p>
          
          {isInstructor && (
            <button 
              className="btn btn-primary btn-large"
              onClick={() => navigate('/create-exam')}
            >
              Create Your First AI-Monitored Exam
            </button>
          )}
        </div>
      ) : (
        <div className="exam-grid">
          {exams.map((exam) => (
            <div key={exam._id} className="exam-card">
              <div className="exam-card-header">
                <h3 className="exam-title">{exam.title}</h3>
                <div className="exam-status">
                  {exam.hasSubmitted ? (
                    <span className="status-badge completed">✅ Completed</span>
                  ) : exam.isActive ? (
                    <span className="status-badge active">🟢 Active</span>
                  ) : (
                    <span className="status-badge inactive">🔴 Inactive</span>
                  )}
                </div>
              </div>

              <div className="exam-card-body">
                <p className="exam-description">{exam.description}</p>
                
                <div className="exam-details">
                  <div className="detail-row">
                    <span className="detail-label">⏱️ Duration:</span>
                    <span className="detail-value">{exam.duration} minutes</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">❓ Questions:</span>
                    <span className="detail-value">{exam.questionCount}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">📊 Total Marks:</span>
                    <span className="detail-value">{exam.totalMarks}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">✅ Passing Score:</span>
                    <span className="detail-value">{exam.passingScore}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">📅 Available:</span>
                    <span className="detail-value">
                      {formatDate(exam.startDate)} - {formatDate(exam.endDate)}
                    </span>
                  </div>
                </div>

                {/* AI Proctoring Features */}
                <div className="ai-features">
                  <h4>🤖 AI Proctoring Features:</h4>
                  <div className="feature-tags">
                    {exam.aiFeatures?.faceDetectionEnabled && (
                      <span className="feature-tag">👤 Face Detection</span>
                    )}
                    {exam.aiFeatures?.eyeTrackingEnabled && (
                      <span className="feature-tag">👁️ Eye Tracking</span>
                    )}
                    {exam.aiFeatures?.multiplePersonDetection && (
                      <span className="feature-tag">👥 Multi-Person Detection</span>
                    )}
                    {exam.aiFeatures?.browserActivityMonitoring && (
                      <span className="feature-tag">💻 Browser Monitoring</span>
                    )}
                  </div>
                </div>

                {/* Submission Details for Students */}
                {isStudent && exam.hasSubmitted && exam.submissionDetails && (
                  <div className="submission-summary">
                    <h4>📋 Your Results:</h4>
                    <div className="result-details">
                      <span>Score: {exam.submissionDetails.score}/{exam.totalMarks}</span>
                      <span>Percentage: {exam.submissionDetails.percentage}%</span>
                      <span className={exam.submissionDetails.passed ? 'passed' : 'failed'}>
                        {exam.submissionDetails.passed ? '✅ Passed' : '❌ Failed'}
                      </span>
                      {exam.submissionDetails.aiRiskScore > 0 && (
                        <span className="risk-score">
                          🤖 AI Risk Score: {exam.submissionDetails.aiRiskScore}/100
                        </span>
                      )}
                      {exam.submissionDetails.flaggedForReview && (
                        <span className="flagged">⚠️ Flagged for Review</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons - THIS IS THE IMPORTANT PART */}
              <div className="exam-card-actions">
                {isStudent && (
                  <>
                    {isExamAvailable(exam) ? (
                      <button 
                        className="btn btn-primary btn-large"
                        onClick={() => handleStartExam(exam._id)}
                      >
                        🚀 Start AI-Proctored Exam
                      </button>
                    ) : exam.hasSubmitted ? (
                      <button 
                        className="btn btn-secondary"
                        onClick={() => handleViewResults(exam._id)}
                      >
                        📊 View Results
                      </button>
                    ) : (
                      <button className="btn btn-disabled" disabled>
                        {!exam.isActive ? '⏸️ Not Active' : 
                         new Date() < new Date(exam.startDate) ? '⏳ Not Started' : 
                         '⌛ Expired'}
                      </button>
                    )}
                  </>
                )}

                {isInstructor && (
                  <div className="instructor-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleViewResults(exam._id)}
                    >
                      📊 View Results
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleManageStudents(exam._id)}
                    >
                      👥 Manage Students
                    </button>
                    <button 
                      className="btn btn-outline"
                      onClick={() => handleEditExam(exam._id)}
                    >
                      ✏️ Edit Exam
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamList;