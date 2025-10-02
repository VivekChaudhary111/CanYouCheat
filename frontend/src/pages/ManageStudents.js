import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ManageStudents.css';

const ManageStudents = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { token, isInstructor } = useAuth();
  
  const [exam, setExam] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [operationLoading, setOperationLoading] = useState(false);

  // Enhanced data fetching with AI proctoring context
const fetchExamData = useCallback(async () => {
  try {
    setLoading(true);
    setError('');
    
    console.log('🔍 Fetching AI proctoring exam management data for:', examId);

    // Fetch exam details with student management info
    const examResponse = await fetch(`http://localhost:5000/api/exams/${examId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!examResponse.ok) {
      throw new Error('Failed to fetch AI-proctored exam details');
    }

    const examData = await examResponse.json();
    setExam(examData.exam);
    
    // Fetch all available students
    const studentsResponse = await fetch('http://localhost:5000/api/auth/students', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (studentsResponse.ok) {
      const studentsData = await studentsResponse.json();
      console.log('📊 Students data:', studentsData); // Debug log
      setAllStudents(studentsData.students || []);
    } else {
      console.warn('⚠️ Failed to fetch students list');
      setAllStudents([]);
    }

    // Fetch current assignments and submissions
    const assignmentsResponse = await fetch(`http://localhost:5000/api/exams/${examId}/students`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (assignmentsResponse.ok) {
      const assignmentsData = await assignmentsResponse.json();
      console.log('📊 Assignments data:', assignmentsData); // Debug log
      
      setAssignedStudents(assignmentsData.assignedStudents || []);
      setSubmissions(assignmentsData.submissions || []);
      
      // Update exam data if it includes more details
      if (assignmentsData.exam) {
        setExam(assignmentsData.exam);
      }
    } else {
      console.warn('⚠️ Failed to fetch assignments');
      setAssignedStudents([]);
      setSubmissions([]);
    }

    console.log('✅ AI proctoring exam management data loaded successfully');
    
  } catch (error) {
    console.error('❌ Error loading AI proctoring exam data:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
}, [examId, token]);
  useEffect(() => {
    if (!isInstructor) {
      navigate('/dashboard');
      return;
    }
    
    if (examId && token) {
      fetchExamData();
    }
  }, [examId, token, isInstructor, navigate, fetchExamData]);

  // Enhanced student management operations
const handleBulkAssign = async () => {
  if (selectedStudents.size === 0) return;

  try {
    setOperationLoading(true);
    setError('');
    setSuccess('');

    console.log('📋 Assigning students to AI-proctored exam:', selectedStudents);

    const response = await fetch(`http://localhost:5000/api/exams/${examId}/students`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studentIds: Array.from(selectedStudents),
        action: 'add'
      })
    });

    const data = await response.json();

    if (response.ok) {
      setSuccess(`Successfully assigned ${selectedStudents.size} students to AI-proctored exam`);
      setSelectedStudents(new Set());
      await fetchExamData(); // Refresh data
      
      console.log('✅ Students assigned successfully to AI proctoring system');
    } else {
      throw new Error(data.message || 'Failed to assign students to AI-proctored exam');
    }
  } catch (error) {
    console.error('❌ Error assigning students to AI proctoring:', error);
    setError(error.message);
  } finally {
    setOperationLoading(false);
  }
};

const handleBulkRemove = async () => {
  if (selectedStudents.size === 0) return;

  const confirmRemove = window.confirm(
    `Are you sure you want to remove ${selectedStudents.size} students from this AI-proctored exam? This will also delete any existing submissions.`
  );

  if (!confirmRemove) return;

  try {
    setOperationLoading(true);
    setError('');
    setSuccess('');

    console.log('🗑️ Removing students from AI-proctored exam:', selectedStudents);

    const response = await fetch(`http://localhost:5000/api/exams/${examId}/students`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studentIds: Array.from(selectedStudents),
        action: 'remove'
      })
    });

    const data = await response.json();

    if (response.ok) {
      setSuccess(`Successfully removed ${selectedStudents.size} students from AI-proctored exam`);
      setSelectedStudents(new Set());
      await fetchExamData(); // Refresh data
      
      console.log('✅ Students removed successfully from AI proctoring system');
    } else {
      throw new Error(data.message || 'Failed to remove students from AI-proctored exam');
    }
  } catch (error) {
    console.error('❌ Error removing students from AI proctoring:', error);
    setError(error.message);
  } finally {
    setOperationLoading(false);
  }
};
  // Enhanced filtering and sorting with AI context
  const processedStudents = useMemo(() => {
    let availableStudents = allStudents.filter(student => 
      !assignedStudents.some(assigned => assigned._id === student._id)
    );
    
    let processedAssigned = assignedStudents.map(student => {
      const submission = submissions.find(sub => sub.student._id === student._id);
      return {
        ...student,
        submission,
        status: submission ? 
          (submission.passed ? 'completed' : 'completed') : 
          'pending'
      };
    });

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      availableStudents = availableStudents.filter(student =>
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
      );
      processedAssigned = processedAssigned.filter(student =>
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      processedAssigned = processedAssigned.filter(student => {
        switch (statusFilter) {
          case 'completed':
            return student.submission;
          case 'pending':
            return !student.submission;
          case 'flagged':
            return student.submission?.flaggedForReview;
          case 'high-risk':
            return student.submission?.proctoringData?.riskScore > 70;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    const sortFunction = (a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'email':
          return a.email.localeCompare(b.email);
        case 'score':
          return (b.submission?.percentage || 0) - (a.submission?.percentage || 0);
        case 'riskScore':
          return (b.submission?.proctoringData?.riskScore || 0) - (a.submission?.proctoringData?.riskScore || 0);
        case 'submitted':
          if (!a.submission && !b.submission) return 0;
          if (!a.submission) return 1;
          if (!b.submission) return -1;
          return new Date(b.submission.submittedAt) - new Date(a.submission.submittedAt);
        default:
          return 0;
      }
    };

    availableStudents.sort(sortFunction);
    processedAssigned.sort(sortFunction);

    return { availableStudents, assignedStudents: processedAssigned };
  }, [allStudents, assignedStudents, submissions, searchQuery, statusFilter, sortBy]);

  // Statistics calculation with AI insights
  const statistics = useMemo(() => {
    const totalAssigned = assignedStudents.length;
    const totalSubmitted = submissions.length;
    const totalPassed = submissions.filter(sub => sub.passed).length;
    const totalFlagged = submissions.filter(sub => sub.flaggedForReview).length;
    const highRiskSubmissions = submissions.filter(sub => sub.proctoringData?.riskScore > 70).length;
    const averageRisk = totalSubmitted > 0 ? 
      Math.round(submissions.reduce((sum, sub) => sum + (sub.proctoringData?.riskScore || 0), 0) / totalSubmitted) : 0;

    return {
      totalAssigned,
      totalAvailable: allStudents.length - totalAssigned,
      totalSubmitted,
      pendingSubmissions: totalAssigned - totalSubmitted,
      totalPassed,
      totalFlagged,
      highRiskSubmissions,
      averageRiskScore: averageRisk,
      completionRate: totalAssigned > 0 ? Math.round((totalSubmitted / totalAssigned) * 100) : 0,
      passRate: totalSubmitted > 0 ? Math.round((totalPassed / totalSubmitted) * 100) : 0
    };
  }, [allStudents, assignedStudents, submissions]);

  // Helper functions
  const toggleStudentSelection = (studentId) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  const selectAllAvailable = () => {
    if (selectedStudents.size === processedStudents.availableStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(processedStudents.availableStudents.map(s => s._id)));
    }
  };

  const clearSelection = () => {
    setSelectedStudents(new Set());
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskLevelClass = (riskScore) => {
    if (riskScore >= 80) return 'risk-high';
    if (riskScore >= 60) return 'risk-medium';
    if (riskScore >= 30) return 'risk-low';
    return 'risk-minimal';
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Loading state
  if (loading) {
    return (
      <div className="manage-students-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading AI Proctoring Student Management</h2>
          <p>Initializing behavior analysis and student tracking systems...</p>
          <div className="loading-features">
            <div className="feature-item">🎥 Webcam monitoring setup</div>
            <div className="feature-item">🤖 AI behavior analysis models</div>
            <div className="feature-item">📊 Risk assessment algorithms</div>
            <div className="feature-item">👥 Student assignment management</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !exam) {
    return (
      <div className="manage-students-container">
        <div className="error-state">
          <div className="error-icon">❌</div>
          <h2>Error Loading AI Proctoring Management</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button className="btn btn-primary" onClick={() => navigate('/exams')}>
              Back to Exams
            </button>
            <button className="btn btn-secondary" onClick={fetchExamData}>
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-students-container">
      {/* Header */}
      <div className="students-header">
        <div className="header-content">
          <button 
            className="back-button"
            onClick={() => navigate('/exams')}
          >
            ← Back to Exams
          </button>
          <div className="exam-info">
            <h1>👥 AI Proctoring Student Management</h1>
            <h2>{exam?.title}</h2>
            <p className="exam-description">{exam?.description}</p>
            <div className="exam-metadata">
              <div className="metadata-item">📅 Duration: {exam?.duration} minutes</div>
              <div className="metadata-item">📋 Questions: {exam?.questions?.length || 0}</div>
              <div className="metadata-item">🎯 Passing Score: {exam?.passingScore}%</div>
              <div className="metadata-item">🤖 AI Proctoring: Enabled</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {success && (
        <div className="alert alert-success">
          <div className="alert-icon">✅</div>
          <div className="alert-content">
            <strong>Success!</strong>
            <p>{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <div className="alert-icon">❌</div>
          <div className="alert-content">
            <strong>Error!</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* AI Proctoring Features Panel */}
      <div className="ai-proctoring-panel">
        <div className="panel-header">
          <div className="panel-icon">🤖</div>
          <div className="panel-title">
            <h3>AI Proctoring Features</h3>
            <p>Advanced behavior analysis and integrity monitoring for your exam</p>
          </div>
        </div>
        <div className="ai-features-grid">
          <div className="ai-feature-card">
            <div className="feature-header">
              <div className="feature-icon">👁️</div>
              <div className="feature-name">Eye Tracking Analysis</div>
            </div>
            <div className="feature-description">
              Monitor gaze patterns and detect suspicious eye movements during the exam
            </div>
            <div className="feature-status enabled">
              <span>✅</span> Active
            </div>
          </div>
          
          <div className="ai-feature-card">
            <div className="feature-header">
              <div className="feature-icon">👤</div>
              <div className="feature-name">Face Detection</div>
            </div>
            <div className="feature-description">
              Continuous facial recognition to ensure the right person is taking the exam
            </div>
            <div className="feature-status enabled">
              <span>✅</span> Active
            </div>
          </div>
          
          <div className="ai-feature-card">
            <div className="feature-header">
              <div className="feature-icon">🎤</div>
              <div className="feature-name">Audio Monitoring</div>
            </div>
            <div className="feature-description">
              Detect background conversations and unauthorized communication attempts
            </div>
            <div className="feature-status enabled">
              <span>✅</span> Active
            </div>
          </div>
          
          <div className="ai-feature-card">
            <div className="feature-header">
              <div className="feature-icon">🖥️</div>
              <div className="feature-name">Browser Activity</div>
            </div>
            <div className="feature-description">
              Monitor tab switches, copy-paste activities, and other browser behaviors
            </div>
            <div className="feature-status enabled">
              <span>✅</span> Active
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="statistics-section">
        <h3>📊 AI Proctoring Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{statistics.totalAssigned}</h3>
              <p>Assigned Students</p>
              <small>Ready for AI monitoring</small>
            </div>
          </div>
          
          <div className="stat-card available">
            <div className="stat-icon">➕</div>
            <div className="stat-content">
              <h3>{statistics.totalAvailable}</h3>
              <p>Available Students</p>
              <small>Can be assigned</small>
            </div>
          </div>
          
          <div className="stat-card completed">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{statistics.totalSubmitted}</h3>
              <p>Completed Exams</p>
              <small>{statistics.completionRate}% completion rate</small>
            </div>
          </div>
          
          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{statistics.pendingSubmissions}</h3>
              <p>Pending Submissions</p>
              <small>Yet to take exam</small>
            </div>
          </div>
          
          <div className="stat-card flagged">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <h3>{statistics.totalFlagged}</h3>
              <p>AI Flagged</p>
              <small>Require review</small>
            </div>
          </div>
          
          <div className="stat-card progress">
            <div className="stat-icon">🤖</div>
            <div className="stat-content">
              <h3>{statistics.averageRiskScore}</h3>
              <p>Avg Risk Score</p>
              <small>AI behavior analysis</small>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="students-controls">
        <div className="controls-left">
          <div className="search-input-wrapper">
            <div className="search-icon">🔍</div>
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Students</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="flagged">AI Flagged</option>
            <option value="high-risk">High Risk (AI)</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="name">Sort by Name</option>
            <option value="email">Sort by Email</option>
            <option value="score">Sort by Score</option>
            <option value="riskScore">Sort by Risk Score</option>
            <option value="submitted">Sort by Submission</option>
          </select>
        </div>
        
        <div className="controls-right">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ⊞
            </button>
            <button
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              ☰
            </button>
          </div>
          
          {selectedStudents.size > 0 && (
            <div className="selection-summary">
              <span className="selection-count">
                {selectedStudents.size} selected
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedStudents.size > 0 && (
        <div className="bulk-actions-panel">
          <div className="bulk-info">
            <div className="bulk-count">{selectedStudents.size}</div>
            <div className="bulk-description">
              students selected for AI proctoring operations
            </div>
          </div>
          <div className="bulk-actions">
            <button
              className="btn btn-success"
              onClick={handleBulkAssign}
              disabled={operationLoading}
            >
              {operationLoading ? '⏳ Processing...' : '➕ Assign to AI Exam'}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleBulkRemove}
              disabled={operationLoading}
            >
              🗑️ Remove from Exam
            </button>
            <button
              className="btn btn-secondary"
              onClick={clearSelection}
            >
              ✖️ Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Students Content */}
      <div className="students-content">
        {/* Available Students Section */}
        <div className="students-section">
          <div className="section-header">
            <div className="section-title">
              <h2>🎯 Available Students ({processedStudents.availableStudents.length})</h2>
              <p>Students who can be assigned to this AI-proctored exam</p>
            </div>
            <div className="section-actions">
              <button
                className="btn btn-outline"
                onClick={selectAllAvailable}
                disabled={processedStudents.availableStudents.length === 0}
              >
                {selectedStudents.size === processedStudents.availableStudents.length ? 
                  '☑️ Deselect All' : '☐ Select All'
                }
              </button>
            </div>
          </div>

          {processedStudents.availableStudents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No Available Students Found</h3>
              <p>
                {searchQuery || statusFilter !== 'all' 
                  ? 'No students match your current search or filter criteria.'
                  : 'All students have already been assigned to this AI-proctored exam.'
                }
              </p>
            </div>
          ) : (
            <div className={`students-display ${viewMode}-view`}>
              {viewMode === 'grid' ? (
                <div className="students-grid">
                  {processedStudents.availableStudents.map((student) => (
                    <div
                      key={student._id}
                      className={`student-card ${selectedStudents.has(student._id) ? 'selected' : ''}`}
                      onClick={() => toggleStudentSelection(student._id)}
                    >
                      <div className="card-header">
                        <div className="student-avatar">
                          {getInitials(student.name)}
                        </div>
                        <div className="student-basic-info">
                          <h3 className="student-name">{student.name}</h3>
                          <p className="student-email">{student.email}</p>
                        </div>
                        <div className="selection-indicator">
                          {selectedStudents.has(student._id) ? (
                            <span className="selected-check">☑️</span>
                          ) : (
                            <span className="unselected-check">☐</span>
                          )}
                        </div>
                      </div>

                      <div className="ai-features-preview">
                        <div className="feature-list">
                          <div className="feature-item">🎥 Webcam Ready</div>
                          <div className="feature-item">🤖 AI Monitoring</div>
                          <div className="feature-item">📊 Behavior Analysis</div>
                        </div>
                      </div>

                      <div className="selection-hint">
                        <p className="hint-text">
                          {selectedStudents.has(student._id) 
                            ? 'Selected for AI proctoring assignment'
                            : 'Click to select for AI-proctored exam'
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="students-table-container">
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>Select</th>
                        <th>Student</th>
                        <th>Status</th>
                        <th>AI Proctoring</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedStudents.availableStudents.map((student) => (
                        <tr
                          key={student._id}
                          className={`available-row ${selectedStudents.has(student._id) ? 'selected' : ''}`}
                          onClick={() => toggleStudentSelection(student._id)}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedStudents.has(student._id)}
                              onChange={() => {}}
                              style={{ pointerEvents: 'none' }}
                            />
                          </td>
                          <td>
                            <div className="student-info">
                              <div className="student-avatar-sm">
                                {getInitials(student.name)}
                              </div>
                              <div>
                                <strong>{student.name}</strong>
                                <small>{student.email}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="status-badge ready">
                              ✅ Ready for Assignment
                            </span>
                          </td>
                          <td>
                            <div className="ai-status">
                              <span className="feature-item">🤖 AI Ready</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Assigned Students Section */}
        <div className="students-section">
          <div className="section-header">
            <div className="section-title">
              <h2>📋 Assigned Students ({processedStudents.assignedStudents.length})</h2>
              <p>Students assigned to this AI-proctored exam with their progress and AI analysis</p>
            </div>
          </div>

          {processedStudents.assignedStudents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No Students Assigned Yet</h3>
              <p>Select students from the available list above to assign them to this AI-proctored exam.</p>
            </div>
          ) : (
            <div className={`students-display ${viewMode}-view`}>
              {viewMode === 'grid' ? (
                <div className="students-grid">
                  {processedStudents.assignedStudents.map((student) => (
                    <div
                      key={student._id}
                      className={`student-card assigned ${student.submission?.flaggedForReview ? 'flagged' : ''}`}
                    >
                      <div className="card-header">
                        <div className="student-avatar">
                          {getInitials(student.name)}
                        </div>
                        <div className="student-basic-info">
                          <h3 className="student-name">{student.name}</h3>
                          <p className="student-email">{student.email}</p>
                        </div>
                        <div className={`student-status status-${student.status}`}>
                          {student.status === 'completed' ? '✅ Completed' : 
                           student.status === 'progress' ? '⏳ In Progress' : '📋 Pending'}
                        </div>
                      </div>

                      {student.submission ? (
                        <div className="submission-summary">
                          <div className="summary-grid">
                            <div className="summary-item">
                              <div className="item-label">Score</div>
                              <div className={`item-value ${student.submission.passed ? 'passed' : 'failed'}`}>
                                {student.submission.percentage}%
                                <small>({student.submission.score}/{student.submission.maxScore})</small>
                              </div>
                            </div>
                            
                            <div className="summary-item">
                              <div className="item-label">Result</div>
                              <div className={`item-value ${student.submission.passed ? 'passed' : 'failed'}`}>
                                {student.submission.passed ? 'PASSED' : 'FAILED'}
                              </div>
                            </div>
                            
                            <div className="summary-item">
                              <div className="item-label">AI Risk Score</div>
                              <div className={`item-value risk ${getRiskLevelClass(student.submission.proctoringData?.riskScore || 0)}`}>
                                {student.submission.proctoringData?.riskScore || 0}/100
                                <small>{student.submission.proctoringData?.riskScore > 70 ? 'High Risk' : 
                                       student.submission.proctoringData?.riskScore > 40 ? 'Medium Risk' : 'Low Risk'}</small>
                              </div>
                            </div>
                            
                            <div className="summary-item">
                              <div className="item-label">Submitted</div>
                              <div className="item-value">
                                {formatDate(student.submission.submittedAt)}
                              </div>
                            </div>
                          </div>

                          {student.submission.proctoringData?.flaggedBehaviors?.length > 0 && (
                            <div className="flagged-behaviors">
                              <span className="behaviors-label">⚠️ AI Flagged Behaviors:</span>
                              <div className="behaviors-tags">
                                {student.submission.proctoringData.flaggedBehaviors.slice(0, 3).map((behavior, index) => (
                                  <span key={index} className="behavior-tag">
                                    {behavior.replace(/_/g, ' ')}
                                  </span>
                                ))}
                                {student.submission.proctoringData.flaggedBehaviors.length > 3 && (
                                  <span className="behavior-more">
                                    +{student.submission.proctoringData.flaggedBehaviors.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {student.submission.flaggedForReview && (
                            <div className="review-notice">
                              <div className="notice-icon">⚠️</div>
                              <div className="notice-text">Requires Manual Review</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="no-submission">
                          <div className="no-submission-text">
                            📋 Exam not taken yet
                          </div>
                        </div>
                      )}

                      <div className="card-actions">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => toggleStudentSelection(student._id)}
                        >
                          {selectedStudents.has(student._id) ? '☑️ Selected' : '☐ Select'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="students-table-container">
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>Select</th>
                        <th>Student</th>
                        <th>Status</th>
                        <th>Score</th>
                        <th>AI Risk</th>
                        <th>Flagged Behaviors</th>
                        <th>Submitted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedStudents.assignedStudents.map((student) => (
                        <tr
                          key={student._id}
                          className={`${student.submission?.flaggedForReview ? 'flagged-row' : ''}`}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedStudents.has(student._id)}
                              onChange={() => toggleStudentSelection(student._id)}
                            />
                          </td>
                          <td>
                            <div className="student-info">
                              <div className="student-avatar-sm">
                                {getInitials(student.name)}
                              </div>
                              <div>
                                <strong>{student.name}</strong>
                                <small>{student.email}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${student.status === 'completed' ? 'ready' : 'ready'}`}>
                              {student.status === 'completed' ? '✅ Completed' : '📋 Pending'}
                            </span>
                          </td>
                          <td>
                            {student.submission ? (
                              <div className="score-display">
                                <span className="score-percentage">{student.submission.percentage}%</span>
                                <small>{student.submission.score}/{student.submission.maxScore}</small>
                              </div>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                          <td>
                            {student.submission ? (
                              <div className={`risk-display ${getRiskLevelClass(student.submission.proctoringData?.riskScore || 0)}`}>
                                <span className="risk-score">{student.submission.proctoringData?.riskScore || 0}</span>
                                <small>{student.submission.proctoringData?.riskScore > 70 ? 'High' : 
                                       student.submission.proctoringData?.riskScore > 40 ? 'Medium' : 'Low'}</small>
                              </div>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                          <td className="behaviors-cell">
                            {student.submission?.proctoringData?.flaggedBehaviors?.length > 0 ? (
                              <div className="behaviors-summary">
                                {student.submission.proctoringData.flaggedBehaviors.slice(0, 2).map((behavior, index) => (
                                  <span key={index} className="behavior-tag-sm">
                                    {behavior.replace(/_/g, ' ')}
                                  </span>
                                ))}
                                {student.submission.proctoringData.flaggedBehaviors.length > 2 && (
                                  <span className="behaviors-count">
                                    +{student.submission.proctoringData.flaggedBehaviors.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span>None</span>
                            )}
                          </td>
                          <td>
                            {student.submission ? formatDate(student.submission.submittedAt) : '-'}
                          </td>
                          <td>
                            <div className="action-buttons">
                              {student.submission && (
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => navigate(`/exams/${examId}/results`)}
                                  title="View AI Analysis"
                                >
                                  📊 Details
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageStudents;