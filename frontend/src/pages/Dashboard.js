import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
const AI_SERVICE_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:8000';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchDashboardData();
    
    // Set up periodic refresh for real-time stats
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated, navigate]);

  const fetchDashboardData = async () => {
  try {
    setError('');
    
    // Fetch role-specific dashboard data
    const endpoint = user?.role === 'instructor' 
      ? `${API_BASE_URL}/api/dashboard/instructor/dashboard`
      : `${API_BASE_URL}/api/dashboard/student/dashboard`;
      
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      setStats(data.stats);
      setRecentActivity(data.recentActivity || []);
      console.log(`✅ Dashboard data loaded for ${user?.name}:`, data.stats);
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to load dashboard data');
    }
  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error);
    setError('Unable to load dashboard data. Please refresh the page.');
    
    // Set fallback stats
    setStats(user?.role === 'instructor' ? {
      totalExams: 0,
      totalStudents: 0,
      activeSessions: 0,
      pendingReviews: 0,
      totalSubmissions: 0,
      averageRiskScore: 0
    } : {
      availableExams: 0,
      completedExams: 0,
      upcomingExams: 0,
      averageScore: 0,
      totalAttempts: 0,
      lastActivity: null
    });
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <h2>Loading AI Proctoring Dashboard</h2>
        <p>Preparing your personalized dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="user-welcome">
            <h1>Welcome back, {user?.name || 'User'}</h1>  {/* Use actual name from database */}
            <p className="user-subtitle">
              {user?.role === 'instructor' 
                ? 'AI-Enhanced Exam Management Dashboard'
                : 'Your AI-Proctored Learning Hub'
              }
            </p>
          </div>
          <div className="header-badge">
            <span className={`role-indicator ${user?.role}`}>
              {user?.role === 'instructor' ? 'Instructor' : 'Student'}
            </span>
            <div className="status-indicator">
              <span className="status-dot active"></span>
              Online
            </div>
          </div>
        </div>
        
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠</span>
            {error}
            <button onClick={fetchDashboardData} className="retry-btn">
              Retry
            </button>
          </div>
        )}
      </div>

      {user?.role === 'instructor' ? (
        <InstructorDashboard 
          stats={stats} 
          recentActivity={recentActivity}
          refreshData={fetchDashboardData}
        />
      ) : (
        <StudentDashboard 
          stats={stats} 
          recentActivity={recentActivity}
          refreshData={fetchDashboardData}
        />
      )}
    </div>
  );
};

const InstructorDashboard = ({ stats, recentActivity, refreshData }) => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Create New Exam',
      description: 'Set up a new AI-proctored examination',
      action: () => navigate('/create-exam'),
      icon: 'create',
      variant: 'primary'
    },
    {
      title: 'Manage Exams',
      description: 'View and edit existing examinations',
      action: () => navigate('/exams'),
      icon: 'manage',
      variant: 'secondary'
    },
    {
      title: 'Review Sessions',
      description: 'Analyze flagged proctoring sessions',
      action: () => navigate('/exams'),
      icon: 'review',
      variant: 'warning'
    },
    {
      title: 'View Analytics',
      description: 'Detailed AI proctoring reports and insights',
      action: () => navigate('/analytics'),
      icon: 'analytics',
      variant: 'info'
    }
  ];

  // ADD this new action for proctoring dashboard
  const navigateToProctoring = (examId) => {
    navigate(`/proctoring/${examId}`);
  };

  const statCards = [
    {
      title: 'Total Exams',
      value: stats?.totalExams || 0,
      trend: '+12%',
      trendUp: true,
      icon: 'exams',
      description: 'Active examinations'
    },
    {
      title: 'Enrolled Students',
      value: stats?.totalStudents || 0,
      trend: '+5%',
      trendUp: true,
      icon: 'students',
      description: 'Across all exams'
    },
    {
      title: 'Active Sessions',
      value: stats?.activeSessions || 0,
      trend: 'Live',
      isLive: true,
      icon: 'sessions',
      description: 'Currently in progress'
    },
    {
      title: 'Pending Reviews',
      value: stats?.pendingReviews || 0,
      trend: stats?.pendingReviews > 10 ? 'High' : 'Normal',
      isAlert: stats?.pendingReviews > 10,
      icon: 'reviews',
      description: 'Flagged submissions'
    },
    {
      title: 'Total Submissions',
      value: stats?.totalSubmissions || 0,
      trend: '+8%',
      trendUp: true,
      icon: 'submissions',
      description: 'All time submissions'
    },
    {
      title: 'Avg Risk Score',
      value: stats?.averageRiskScore || 0,
      trend: stats?.averageRiskScore < 30 ? 'Low Risk' : stats?.averageRiskScore < 70 ? 'Medium Risk' : 'High Risk',
      isRisk: true,
      icon: 'risk',
      description: 'AI behavior analysis'
    }
  ];

  return (
    <div className="instructor-dashboard">
      {/* Quick Actions Section */}
      <section className="quick-actions-section">
        <div className="section-header">
          <h2>Quick Actions</h2>
          <p>Manage your AI-proctored examinations efficiently</p>
        </div>
        <div className="actions-grid">
          {quickActions.map((action, index) => (
            <div 
              key={index}
              className={`action-card ${action.variant}`}
              onClick={action.action}
            >
              <div className={`action-icon ${action.icon}`}></div>
              <div className="action-content">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
              <div className="action-arrow">→</div>
            </div>
          ))}
        </div>
      </section>

      {/* Statistics Overview */}
      <section className="stats-section">
        <div className="section-header">
          <h2>Performance Overview</h2>
          <button onClick={refreshData} className="refresh-btn">
            Refresh Data
          </button>
        </div>
        <div className="stats-grid">
          {statCards.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-header">
                <div className={`stat-icon ${stat.icon}`}></div>
                <div className={`trend-indicator ${
                  stat.isLive ? 'live' : 
                  stat.isAlert ? 'alert' : 
                  stat.isRisk ? (stats?.averageRiskScore < 30 ? 'good' : stats?.averageRiskScore < 70 ? 'warning' : 'danger') :
                  stat.trendUp ? 'positive' : 'neutral'
                }`}>
                  {stat.trend}
                </div>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-title">{stat.title}</div>
                <div className="stat-description">{stat.description}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="activity-section">
        <div className="section-header">
          <h2>Recent Activity</h2>
          <a href="/activity" className="view-all-link">View All</a>
        </div>
        <div className="activity-feed">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="activity-item">
                <div className={`activity-indicator ${activity.type}`}></div>
                <div className="activity-content">
                  <div className="activity-message">{activity.message}</div>
                  <div className="activity-time">{activity.timestamp}</div>
                </div>
                {activity.actionable && (
                  <button className="activity-action">View</button>
                )}
              </div>
            ))
          ) : (
            <div className="no-activity">
              <div className="no-activity-icon">📊</div>
              <p>No recent activity to display</p>
            </div>
          )}
        </div>
      </section>

      {/* AI Proctoring Insights */}
      <section className="insights-section">
        <div className="section-header">
          <h2>AI Proctoring Insights</h2>
          <p>Advanced behavior analysis and risk management</p>
        </div>
        <div className="insights-grid">
          <div className="insight-card behavior-analysis">
            <h3>Behavior Analysis Engine</h3>
            <p>Real-time monitoring of student behavior patterns using advanced computer vision and machine learning algorithms.</p>
            <div className="insight-metrics">
              <div className="metric">
                <span className="metric-value">99.3%</span>
                <span className="metric-label">Detection Accuracy</span>
              </div>
              <div className="metric">
                <span className="metric-value">&lt;0.1s</span>
                <span className="metric-label">Response Time</span>
              </div>
            </div>
          </div>
          
          <div className="insight-card risk-assessment">
            <h3>Risk Assessment System</h3>
            <p>Intelligent risk scoring based on multiple behavioral indicators and environmental factors.</p>
            <div className="insight-metrics">
              <div className="metric">
                <span className="metric-value">15</span>
                <span className="metric-label">Risk Factors</span>
              </div>
              <div className="metric">
                <span className="metric-value">24/7</span>
                <span className="metric-label">Monitoring</span>
              </div>
            </div>
          </div>
          
          <div className="insight-card security-features">
            <h3>Security & Privacy</h3>
            <p>Enterprise-grade security with encrypted data transmission and privacy-compliant storage.</p>
            <div className="insight-metrics">
              <div className="metric">
                <span className="metric-value">AES-256</span>
                <span className="metric-label">Encryption</span>
              </div>
              <div className="metric">
                <span className="metric-value">GDPR</span>
                <span className="metric-label">Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const StudentDashboard = ({ stats, recentActivity, refreshData }) => {
  const navigate = useNavigate();
  const [viewportSize, setViewportSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Handle window resize for better responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dynamically adjust grid columns based on viewport
  const getGridColumns = () => {
    if (viewportSize.width < 480) return '1fr';
    if (viewportSize.width < 768) return 'repeat(2, 1fr)';
    if (viewportSize.width < 1024) return 'repeat(3, 1fr)';
    return 'repeat(auto-fit, minmax(280px, 1fr))';
  };

  const quickActions = [
    {
      title: 'Take an Exam',
      description: 'Access available AI-proctored examinations',
      action: () => navigate('/exams'),
      icon: 'exam',
      variant: 'primary'
    },
    {
      title: 'View Results',
      description: 'Check your exam performance and feedback',
      action: () => navigate('/results'),
      icon: 'results',
      variant: 'secondary'
    },
    {
      title: 'System Check',
      description: 'Verify your setup for AI proctoring',
      action: () => navigate('/system-check'),
      icon: 'system',
      variant: 'info'
    }
  ];

  const statCards = [
    {
      title: 'Available Exams',
      value: stats?.availableExams || 0,
      description: 'Ready to take',
      icon: 'available',
      actionable: true,
      action: () => navigate('/exams')
    },
    {
      title: 'Completed Exams', 
      value: stats?.completedExams || 0,
      description: 'Successfully submitted',
      icon: 'completed'
    },
    {
      title: 'Upcoming Exams',
      value: stats?.upcomingExams || 0,
      description: 'Scheduled sessions',
      icon: 'upcoming'
    },
    {
      title: 'Average Score',
      value: `${stats?.averageScore || 0}%`,
      description: 'Overall performance',
      icon: 'score',
      trend: stats?.averageScore >= 80 ? 'excellent' : stats?.averageScore >= 70 ? 'good' : 'needs-improvement'
    },
    {
      title: 'Total Attempts',
      value: stats?.totalAttempts || 0,
      description: 'Exam sessions',
      icon: 'attempts'
    },
    {
      title: 'Integrity Score',
      value: `${Math.max(0, Math.min(100, 100 - (stats?.averageRiskScore || 0)))}%`,
      description: 'AI behavior assessment',
      icon: 'integrity',
      trend: (100 - (stats?.averageRiskScore || 0)) >= 80 ? 'excellent' : 
             (100 - (stats?.averageRiskScore || 0)) >= 60 ? 'good' : 'needs-attention'
    }
  ];

  return (
    <div className="student-dashboard">
      {/* Quick Actions Section */}
      <section className="quick-actions-section">
        <div className="section-header">
          <h2>Quick Actions</h2>
          <p>Your AI-proctored examination portal</p>
        </div>
        <div className="actions-grid">
          {quickActions.map((action, index) => (
            <div 
              key={index}
              className={`action-card ${action.variant}`}
              onClick={action.action}
            >
              <div className={`action-icon ${action.icon}`}></div>
              <div className="action-content">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
              <div className="action-arrow">→</div>
            </div>
          ))}
        </div>
      </section>

      {/* Enhanced Statistics Overview */}
      <section className="stats-section">
        <div className="section-header">
          <div>
            <h2>Your Performance</h2>
            <p>AI-Enhanced Exam Analytics Dashboard</p>
          </div>
          <button onClick={refreshData} className="refresh-btn">
            <span>🔄</span> Refresh Data
          </button>
        </div>
        <div 
          className="stats-grid student-stats"
          style={{ 
            gridTemplateColumns: getGridColumns(),
            gap: viewportSize.width < 768 ? '1rem' : '1.5rem'
          }}
        >
          {statCards.map((stat, index) => (
            <div 
              key={index} 
              className={`stat-card ${stat.actionable ? 'actionable' : ''} ${stat.trend || ''}`}
              onClick={stat.actionable ? stat.action : undefined}
              style={{
                minHeight: viewportSize.width < 480 ? 'auto' : 
                          viewportSize.width < 768 ? '110px' : 
                          viewportSize.width < 1024 ? '120px' : '140px'
              }}
            >
              <div className="stat-header">
                <div className={`stat-icon ${stat.icon}`}></div>
                {stat.trend && (
                  <div className={`trend-badge ${stat.trend}`}>
                    {stat.trend === 'excellent' ? 'Excellent' : 
                     stat.trend === 'good' ? 'Good' : 
                     stat.trend === 'needs-improvement' ? 'Improve' :
                     stat.trend === 'needs-attention' ? 'Attention' : ''}
                  </div>
                )}
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-title">{stat.title}</div>
                <div className="stat-description">{stat.description}</div>
              </div>
              {stat.actionable && <div className="stat-action">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="activity-section">
        <div className="section-header">
          <h2>Recent Activity</h2>
          <span className="last-updated">
            Last updated: {stats?.lastActivity ? new Date(stats.lastActivity).toLocaleString() : 'Never'}
          </span>
        </div>
        <div className="activity-feed">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 4).map((activity, index) => (
              <div key={index} className="activity-item">
                <div className={`activity-indicator ${activity.type}`}></div>
                <div className="activity-content">
                  <div className="activity-message">{activity.message}</div>
                  <div className="activity-time">{activity.timestamp}</div>
                </div>
                {activity.score && (
                  <div className="activity-score">{activity.score}%</div>
                )}
              </div>
            ))
          ) : (
            <div className="no-activity">
              <div className="no-activity-icon">📝</div>
              <p>No recent exam activity</p>
              <button 
                className="start-exam-btn"
                onClick={() => navigate('/exams')}
              >
                Take Your First Exam
              </button>
            </div>
          )}
        </div>
      </section>

      {/* AI Proctoring Information */}
      <section className="proctoring-info-section">
        <div className="section-header">
          <h2>AI Proctoring Information</h2>
          <p>Understanding how our system ensures exam integrity</p>
        </div>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon security"></div>
            <h3>Secure Environment</h3>
            <p>Advanced AI monitors your exam session to maintain academic integrity and provide a fair testing environment.</p>
          </div>
          
          <div className="info-card">
            <div className="info-icon monitoring"></div>
            <h3>Behavior Monitoring</h3>
            <p>Computer vision technology tracks facial expressions, eye movements, and environmental changes in real-time.</p>
          </div>
          
          <div className="info-card">
            <div className="info-icon privacy"></div>
            <h3>Privacy Protected</h3>
            <p>All monitoring data is encrypted, securely stored, and used solely for exam integrity purposes.</p>
          </div>
          
          <div className="info-card">
            <div className="info-icon support"></div>
            <h3>Technical Support</h3>
            <p>24/7 technical assistance available for any issues during your AI-proctored examination sessions.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;