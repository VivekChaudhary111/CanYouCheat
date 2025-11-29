import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ExamResults.css';

const ExamResults = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { token, isInstructor, isStudent, user } = useAuth();
  
  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [userSubmission, setUserSubmission] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [sortBy, setSortBy] = useState('submittedAt');

  // Fetch AI proctoring exam results - now supports both instructor and student views
  const fetchExamResults = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Fetching AI proctoring results for exam:', examId, 'as', isStudent ? 'student' : 'instructor');
      
      // Different endpoints for instructor vs student
      const endpoint = isStudent 
        ? `https://canyoucheat.onrender.com/api/exams/${examId}/my-result`
        : `https://canyoucheat.onrender.com/api/exams/${examId}/results`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ AI proctoring results fetched successfully');
        setExam(data.exam);
        
        if (isStudent) {
          // For students, we get their individual submission
          setUserSubmission(data.submission);
          setStatistics(data.examStats || {});
        } else {
          // For instructors, we get all submissions and statistics
          setSubmissions(data.submissions || []);
          setStatistics(data.statistics || {});
        }
      } else {
        throw new Error(data.message || 'Failed to fetch AI proctoring results');
      }
    } catch (error) {
      console.error('❌ Error fetching AI proctoring results:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [examId, token, isStudent]);

  useEffect(() => {
    if (!isInstructor && !isStudent) {
      navigate('/dashboard');
      return;
    }
    
    if (examId && token) {
      fetchExamResults();
    }
  }, [examId, token, isInstructor, isStudent, navigate, fetchExamResults]);

  // Filter and sort submissions (instructor only)
  const filteredSubmissions = submissions
    .filter(submission => {
      if (filterStatus !== 'all' && 
          (filterStatus === 'passed' ? !submission.passed : submission.passed)) {
        return false;
      }
      
      if (filterRisk !== 'all') {
        const riskScore = submission.aiAnalysis?.riskScore || 0;
        if (filterRisk === 'high' && riskScore < 80) return false;
        if (filterRisk === 'medium' && (riskScore < 50 || riskScore >= 80)) return false;
        if (filterRisk === 'low' && riskScore >= 50) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.percentage - a.percentage;
        case 'riskScore':
          return (b.aiAnalysis?.riskScore || 0) - (a.aiAnalysis?.riskScore || 0);
        case 'studentName':
          return a.student.name.localeCompare(b.student.name);
        case 'submittedAt':
        default:
          return new Date(b.submittedAt) - new Date(a.submittedAt);
      }
    });

  // Get risk level styling
  const getRiskLevelClass = (riskScore) => {
    if (riskScore >= 80) return 'risk-high';
    if (riskScore >= 50) return 'risk-medium';
    if (riskScore >= 20) return 'risk-low';
    return 'risk-minimal';
  };

  // Get performance level styling
  const getPerformanceLevelClass = (percentage) => {
    if (percentage >= 90) return 'performance-excellent';
    if (percentage >= 80) return 'performance-good';
    if (percentage >= 70) return 'performance-average';
    if (percentage >= 60) return 'performance-below-average';
    return 'performance-poor';
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate time taken for submission
  const calculateTimeTaken = (submission) => {
    if (!submission.session) return 'N/A';
    
    const start = new Date(submission.session.startTime);
    const end = new Date(submission.submittedAt);
    const minutes = Math.round((end - start) / (1000 * 60));
    
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  if (loading) {
    return (
      <div className="exam-results-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading AI Proctoring Results</h2>
          <p>
            {isStudent 
              ? 'Analyzing your performance and AI behavior assessment...'
              : 'Analyzing behavioral data and generating comprehensive reports...'
            }
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exam-results-container">
        <div className="error-state">
          <div className="error-icon">❌</div>
          <h2>Error Loading AI Proctoring Results</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button className="btn btn-primary" onClick={() => navigate('/exams')}>
              Back to Exams
            </button>
            <button className="btn btn-secondary" onClick={fetchExamResults}>
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Student View - Individual Results
  if (isStudent) {
    if (!userSubmission) {
      return (
        <div className="exam-results-container">
          <div className="no-submission-state">
            <div className="no-submission-icon">📋</div>
            <h2>No Submission Found</h2>
            <p>You haven't submitted this AI-proctored exam yet.</p>
            <button className="btn btn-primary" onClick={() => navigate('/exams')}>
              Back to Exams
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="exam-results-container student-view">
        {/* Header */}
        <div className="results-header">
          <div className="header-content">
            <button 
              className="btn btn-secondary back-button"
              onClick={() => navigate('/exams')}
            >
              ← Back to Exams
            </button>
            <div className="exam-info">
              <h1>📊 Your AI-Proctored Exam Results</h1>
              <h2>{exam?.title}</h2>
              <p className="exam-description">{exam?.description}</p>
            </div>
          </div>
        </div>

        {/* Student Performance Dashboard */}
        <div className="student-performance-grid">
          <div className={`performance-card main-score ${getPerformanceLevelClass(userSubmission.percentage)}`}>
            <div className="performance-icon">🎯</div>
            <div className="performance-content">
              <h3>{userSubmission.percentage}%</h3>
              <p>Your Score</p>
              <small>{userSubmission.score}/{userSubmission.maxScore} points</small>
            </div>
          </div>
          
          <div className={`performance-card result-status ${userSubmission.passed ? 'passed' : 'failed'}`}>
            <div className="performance-icon">{userSubmission.passed ? '✅' : '❌'}</div>
            <div className="performance-content">
              <h3>{userSubmission.passed ? 'PASSED' : 'FAILED'}</h3>
              <p>Exam Status</p>
              <small>Required: {exam?.passingScore}%</small>
            </div>
          </div>
          
          <div className={`performance-card ai-analysis ${getRiskLevelClass(userSubmission.aiAnalysis?.riskScore || 0)}`}>
            <div className="performance-icon">🤖</div>
            <div className="performance-content">
              <h3>{userSubmission.aiAnalysis?.riskScore || 0}/100</h3>
              <p>AI Risk Score</p>
              <small>{userSubmission.aiAnalysis?.riskLevel || 'Low Risk'}</small>
            </div>
          </div>
          
          <div className="performance-card exam-details">
            <div className="performance-icon">⏱️</div>
            <div className="performance-content">
              <h3>{calculateTimeTaken(userSubmission)}</h3>
              <p>Time Taken</p>
              <small>Allowed: {exam?.duration} minutes</small>
            </div>
          </div>
          
          <div className="performance-card submission-info">
            <div className="performance-icon">📅</div>
            <div className="performance-content">
              <h3>{formatDate(userSubmission.submittedAt)}</h3>
              <p>Submitted</p>
              <small>{userSubmission.submissionType === 'auto' ? 'Auto-submitted' : 'Manual submission'}</small>
            </div>
          </div>
          
          <div className={`performance-card review-status ${userSubmission.flaggedForReview ? 'flagged' : 'approved'}`}>
            <div className="performance-icon">{userSubmission.flaggedForReview ? '⚠️' : '✅'}</div>
            <div className="performance-content">
              <h3>{userSubmission.reviewStatus.toUpperCase()}</h3>
              <p>Review Status</p>
              <small>{userSubmission.flaggedForReview ? 'Manual review required' : 'AI approved'}</small>
            </div>
          </div>
        </div>

        {/* Detailed AI Analysis for Student */}
        <div className="detailed-analysis">
          <h3>🤖 AI Proctoring Analysis</h3>
          
          <div className="analysis-grid">
            <div className="analysis-card">
              <h4>📊 Behavior Summary</h4>
              <div className="behavior-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Events:</span>
                  <span className="stat-value">{userSubmission.aiAnalysis?.behaviorSummary?.totalEvents || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Suspicious Activities:</span>
                  <span className="stat-value">{userSubmission.aiAnalysis?.behaviorSummary?.suspiciousActivities || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Session Duration:</span>
                  <span className="stat-value">{userSubmission.aiAnalysis?.behaviorSummary?.sessionDuration || 0} min</span>
                </div>
              </div>
            </div>

            <div className="analysis-card">
              <h4>⚠️ Flagged Behaviors</h4>
              {userSubmission.aiAnalysis?.flaggedBehaviors?.length > 0 ? (
                <div className="flagged-behaviors">
                  {userSubmission.aiAnalysis.flaggedBehaviors.map((behavior, index) => (
                    <span key={index} className="behavior-tag">
                      {behavior.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="no-flags">
                  <span className="success-message">🎉 No suspicious behavior detected!</span>
                </div>
              )}
            </div>
          </div>

          {userSubmission.flaggedForReview && (
            <div className="review-notice">
              <div className="notice-icon">⚠️</div>
              <div className="notice-content">
                <h4>Manual Review Required</h4>
                <p>
                  Your submission has been flagged for manual review due to AI-detected activities. 
                  This doesn't necessarily indicate cheating - our instructors will review the session 
                  data to make a final determination.
                </p>
                <p><strong>Expected review completion:</strong> Within 2-3 business days</p>
              </div>
            </div>
          )}
        </div>

        {/* Performance Insights */}
        <div className="performance-insights">
          <h3>📈 Performance Insights</h3>
          <div className="insights-grid">
            <div className="insight-card">
              <h4>📚 Subject Mastery</h4>
              <p>
                {userSubmission.percentage >= 90 ? 'Excellent understanding demonstrated across all topics.' :
                 userSubmission.percentage >= 80 ? 'Good grasp of the subject with minor areas for improvement.' :
                 userSubmission.percentage >= 70 ? 'Satisfactory performance with some knowledge gaps.' :
                 userSubmission.percentage >= 60 ? 'Basic understanding present but needs significant improvement.' :
                 'Substantial review and study required to meet course objectives.'}
              </p>
            </div>
            
            <div className="insight-card">
              <h4>🤖 AI Integrity Assessment</h4>
              <p>
                {userSubmission.aiAnalysis?.riskScore <= 20 ? 'Exemplary exam behavior with no integrity concerns.' :
                 userSubmission.aiAnalysis?.riskScore <= 40 ? 'Minor irregularities detected but within normal range.' :
                 userSubmission.aiAnalysis?.riskScore <= 70 ? 'Some behavioral patterns flagged for review.' :
                 'Significant behavioral concerns detected requiring instructor review.'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions for Student */}
        <div className="student-actions">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/exams')}
          >
            📚 Back to My Exams
          </button>
          
          {userSubmission.percentage < exam?.passingScore && (
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/study-resources')}
            >
              📖 Study Resources
            </button>
          )}
        </div>
      </div>
    );
  }

  // Instructor View - All Results (existing code with improvements)
  return (
    <div className="exam-results-container instructor-view">
      {/* Header */}
      <div className="results-header">
        <div className="header-content">
          <button 
            className="btn btn-secondary back-button"
            onClick={() => navigate('/exams')}
          >
            ← Back to Exams
          </button>
          <div className="exam-info">
            <h1>📊 AI Proctoring Results Dashboard</h1>
            <h2>{exam?.title}</h2>
            <p className="exam-description">{exam?.description}</p>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="statistics-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{statistics.totalSubmissions || 0}</h3>
            <p>Total Submissions</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{statistics.passRate || 0}%</h3>
            <p>Pass Rate</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{statistics.averageScore || 0}%</h3>
            <p>Average Score</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <h3>{statistics.averageRiskScore || 0}</h3>
            <p>Avg AI Risk Score</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>{statistics.flaggedCount || 0}</h3>
            <p>Flagged Submissions</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{statistics.pendingReviews || 0}</h3>
            <p>Pending Reviews</p>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="results-controls">
        <div className="filters">
          <div className="filter-group">
            <label>Filter by Status:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Submissions</option>
              <option value="passed">Passed Only</option>
              <option value="failed">Failed Only</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Filter by AI Risk:</label>
            <select 
              value={filterRisk} 
              onChange={(e) => setFilterRisk(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk (80+)</option>
              <option value="medium">Medium Risk (50-79)</option>
              <option value="low">Low Risk (&lt;50)</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="submittedAt">Submission Time</option>
              <option value="score">Score (High to Low)</option>
              <option value="riskScore">AI Risk Score</option>
              <option value="studentName">Student Name</option>
            </select>
          </div>
        </div>
        
        <div className="results-summary">
          Showing {filteredSubmissions.length} of {submissions.length} submissions
        </div>
      </div>

      {/* Submissions Table */}
      <div className="submissions-section">
        {filteredSubmissions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No submissions match your filters</h3>
            <p>Try adjusting your filter criteria to see more results.</p>
          </div>
        ) : (
          <div className="submissions-table-container">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>AI Risk Score</th>
                  <th>Flagged Behaviors</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission) => (
                  <tr key={submission._id} className={submission.flaggedForReview ? 'flagged-row' : ''}>
                    <td className="student-cell">
                      <div className="student-info">
                        <strong>{submission.student?.name}</strong>
                        <small>{submission.student?.email}</small>
                      </div>
                    </td>
                    
                    <td className="score-cell">
                      <div className="score-display">
                        <span className="score-percentage">{submission.percentage}%</span>
                        <small>{submission.score}/{submission.maxScore}</small>
                      </div>
                    </td>
                    
                    <td className="status-cell">
                      <span className={`status-badge ${submission.passed ? 'passed' : 'failed'}`}>
                        {submission.passed ? '✅ Passed' : '❌ Failed'}
                      </span>
                    </td>
                    
                    <td className="risk-cell">
                      <div className={`risk-score ${getRiskLevelClass(submission.aiAnalysis?.riskScore || 0)}`}>
                        <span className="risk-value">{submission.aiAnalysis?.riskScore || 0}</span>
                        <small className="risk-level">{submission.aiAnalysis?.riskLevel || 'Low'}</small>
                      </div>
                    </td>
                    
                    <td className="behaviors-cell">
                      {submission.aiAnalysis?.flaggedBehaviors?.length > 0 ? (
                        <div className="behaviors-list">
                          {submission.aiAnalysis.flaggedBehaviors.slice(0, 2).map((behavior, index) => (
                            <span key={index} className="behavior-tag">
                              {behavior.replace(/_/g, ' ')}
                            </span>
                          ))}
                          {submission.aiAnalysis.flaggedBehaviors.length > 2 && (
                            <span className="behavior-more">
                              +{submission.aiAnalysis.flaggedBehaviors.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="no-behaviors">No flags</span>
                      )}
                    </td>
                    
                    <td className="submitted-cell">
                      <div className="submission-time">
                        <span>{formatDate(submission.submittedAt)}</span>
                        <small className="submission-type">
                          {submission.submissionType === 'auto' ? '⏰ Auto' : '✋ Manual'}
                        </small>
                      </div>
                    </td>
                    
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button 
                          className="btn btn-sm btn-outline"
                          onClick={() => navigate(`/exams/${examId}/student/${submission.student._id}/details`)}
                          title="View Detailed AI Analysis"
                        >
                          🔍 Details
                        </button>
                        {submission.flaggedForReview && (
                          <button 
                            className="btn btn-sm btn-warning"
                            onClick={() => navigate(`/exams/${examId}/student/${submission.student._id}/details`)}
                            title="Review Flagged Submission"
                          >
                            ⚠️ Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamResults;