import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ExamResults.css'; // Reuse existing styles

const StudentAnalysisDetails = () => {
  const { examId, studentId } = useParams();
  const navigate = useNavigate();
  const { token, isInstructor } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    if (!isInstructor) {
      navigate('/dashboard');
      return;
    }

    const fetchStudentDetails = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(
          `https://canyoucheat.onrender.com/api/exams/${examId}/student/${studentId}/details`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const data = await response.json();

        if (response.ok) {
          setStudentData(data);
        } else {
          throw new Error(data.message || 'Failed to fetch student details');
        }
      } catch (error) {
        console.error('❌ Error fetching student details:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (examId && studentId && token) {
      fetchStudentDetails();
    }
  }, [examId, studentId, token, isInstructor, navigate]);

  if (loading) {
    return (
      <div className="exam-results-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading Detailed AI Analysis</h2>
          <p>Analyzing student behavioral data and exam session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exam-results-container">
        <div className="error-state">
          <div className="error-icon">❌</div>
          <h2>Error Loading Student Details</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate(`/exams/${examId}/results`)}>
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  const { detailedAnalysis, exam } = studentData;

  return (
    <div className="exam-results-container">
      <div className="results-header">
        <button 
          className="btn btn-secondary back-button"
          onClick={() => navigate(`/exams/${examId}/results`)}
        >
          ← Back to Results
        </button>
        <div className="exam-info">
          <h1>🔍 Detailed AI Analysis</h1>
          <h2>{detailedAnalysis.basicInfo.studentName}</h2>
          <p>{exam.title}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="statistics-grid">
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>{detailedAnalysis.basicInfo.percentage}%</h3>
            <p>Exam Score</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <h3>{detailedAnalysis.aiAnalysis.riskScore}/100</h3>
            <p>AI Risk Score</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📸</div>
          <div className="stat-content">
            <h3>{detailedAnalysis.aiAnalysis.totalFrames}</h3>
            <p>Frames Analyzed</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>{detailedAnalysis.aiAnalysis.totalAlerts}</h3>
            <p>Alerts Generated</p>
          </div>
        </div>
      </div>

      {/* AI Analysis Summary */}
      <div className="detailed-analysis">
        <h3>🤖 AI Analysis Summary</h3>
        <p className="analysis-summary">{detailedAnalysis.aiAnalysis.summary}</p>
        
        {detailedAnalysis.aiAnalysis.flaggedBehaviors.length > 0 && (
          <div className="flagged-behaviors">
            <h4>Flagged Behaviors:</h4>
            <div className="behavior-tags">
              {detailedAnalysis.aiAnalysis.flaggedBehaviors.map((behavior, index) => (
                <span key={index} className="behavior-tag">
                  {behavior.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="timeline-section">
        <h3>⏰ Session Timeline</h3>
        <div className="timeline">
          {detailedAnalysis.aiAnalysis.timeline.map((event, index) => (
            <div key={index} className={`timeline-event ${event.type}`}>
              <div className="timeline-time">
                {new Date(event.timestamp).toLocaleTimeString()}
              </div>
              <div className="timeline-content">
                {event.type === 'alert' ? (
                  <div className={`alert-event severity-${event.severity}`}>
                    <strong>{event.violationType || event.message}</strong>
                    <p>Risk Score: {event.riskScore}</p>
                  </div>
                ) : (
                  <div className="frame-event">
                    <span>Frame Analysis - Risk: {event.riskScore}%</span>
                    {event.alerts.length > 0 && (
                      <small>Alerts: {event.alerts.join(', ')}</small>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentAnalysisDetails;