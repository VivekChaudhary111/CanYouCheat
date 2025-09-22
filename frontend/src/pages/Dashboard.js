import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchDashboardData();
  }, [isAuthenticated, navigate]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/proctoring/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}!</h1>
        <p className="role-badge">{user?.role === 'instructor' ? '👨‍🏫 Instructor' : '👨‍🎓 Student'}</p>
      </div>

      {user?.role === 'instructor' ? (
        <InstructorDashboard stats={stats} />
      ) : (
        <StudentDashboard stats={stats} />
      )}
    </div>
  );
};

const InstructorDashboard = ({ stats }) => {
  const navigate = useNavigate();

  return (
    <div className="instructor-dashboard">
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button 
            className="action-btn primary"
            onClick={() => navigate('/create-exam')}
          >
            📝 Create New Exam
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/exams')}
          >
            📚 Manage Exams
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/proctoring')}
          >
            🔍 Proctoring Dashboard
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Sessions</h3>
          <div className="stat-value">{stats?.totalSessions || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Active Sessions</h3>
          <div className="stat-value active">{stats?.activeSessions || 0}</div>
        </div>
        <div className="stat-card">
          <h3>High Risk Sessions</h3>
          <div className="stat-value high-risk">{stats?.highRiskSessions || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Total Alerts</h3>
          <div className="stat-value">{stats?.totalAlerts || 0}</div>
        </div>
      </div>

      <div className="features-overview">
        <h2>AI Proctoring Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">👁️</div>
            <h3>Face Detection</h3>
            <p>Continuously monitor and track student faces during exams</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎤</div>
            <h3>Audio Monitoring</h3>
            <p>Detect suspicious sounds and multiple voices</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🖥️</div>
            <h3>Browser Monitoring</h3>
            <p>Track tab switches and window focus changes</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚠️</div>
            <h3>Risk Scoring</h3>
            <p>AI-powered risk assessment with real-time alerts</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentDashboard = ({ stats }) => {
  const navigate = useNavigate();

  return (
    <div className="student-dashboard">
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button 
            className="action-btn primary"
            onClick={() => navigate('/exams')}
          >
            📚 View Available Exams
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Exams Taken</h3>
          <div className="stat-value">{stats?.completedSessions || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Average Risk Score</h3>
          <div className="stat-value">{(stats?.averageRiskScore || 0).toFixed(2)}</div>
        </div>
      </div>

      <div className="info-section">
        <h2>How AI Proctoring Works</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>🔒 Secure Environment</h3>
            <p>Your exam session is monitored to ensure academic integrity</p>
          </div>
          <div className="info-card">
            <h3>📹 Webcam Monitoring</h3>
            <p>Your camera tracks face and eye movements during the exam</p>
          </div>
          <div className="info-card">
            <h3>🎧 Audio Detection</h3>
            <p>Microphone monitors for unusual sounds or voices</p>
          </div>
          <div className="info-card">
            <h3>💻 Browser Security</h3>
            <p>System tracks browser activity and prevents cheating attempts</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;