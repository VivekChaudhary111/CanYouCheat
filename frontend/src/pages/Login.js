import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect when authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🎯 User authenticated, redirecting:', user.name);
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password, formData.role);
      
      if (result.success) {
        console.log('✅ Login completed for:', result.user.name);
        // Navigation will happen automatically via useEffect
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-page">
      {/* Animated Background */}
      <div className="auth-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
          <div className="shape shape-6"></div>
        </div>
        <div className="gradient-overlay"></div>
      </div>

      {/* Main Content */}
      <div className="auth-container">
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <div className="brand-content">
            <div className="brand-logo">
              <div className="logo-icon">🔒</div>
              <h1 className="brand-title">CanYouCheat</h1>
            </div>
            <h2 className="brand-subtitle">AI-Enhanced Exam Proctoring System</h2>
            <p className="brand-description">
              Advanced artificial intelligence monitors and analyzes test-taker behavior 
              to ensure academic integrity in remote examinations.
            </p>
            
            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <span>Real-time behavior analysis</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">👁️</span>
                <span>Advanced eye tracking technology</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🤖</span>
                <span>AI-powered risk assessment</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔊</span>
                <span>Audio anomaly detection</span>
              </div>
            </div>

            <div className="security-badges">
              <div className="badge">
                <span className="badge-icon">🛡️</span>
                <span>Secure</span>
              </div>
              <div className="badge">
                <span className="badge-icon">⚡</span>
                <span>Fast</span>
              </div>
              <div className="badge">
                <span className="badge-icon">🎯</span>
                <span>Accurate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="auth-form-container">
          <div className="auth-card">
            <div className="card-header">
              <h2 className="card-title">Welcome Back</h2>
              <p className="card-subtitle">Sign in to access your AI proctoring dashboard</p>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <span className="label-icon">📧</span>
                  Email Address
                </label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email address"
                    className="form-input"
                    disabled={loading}
                  />
                  <div className="input-border"></div>
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  <span className="label-icon">🔐</span>
                  Password
                </label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    className="form-input"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                  <div className="input-border"></div>
                </div>
              </div>

              {/* Role Selection */}
              <div className="form-group">
                <label htmlFor="role" className="form-label">
                  <span className="label-icon">👤</span>
                  Account Type
                </label>
                <div className="role-selection">
                  <div className="role-options">
                    <label className={`role-option ${formData.role === 'student' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="role"
                        value="student"
                        checked={formData.role === 'student'}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      <div className="role-content">
                        <span className="role-icon">🎓</span>
                        <span className="role-title">Student</span>
                        <span className="role-desc">Take AI-proctored exams</span>
                      </div>
                    </label>
                    
                    <label className={`role-option ${formData.role === 'instructor' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="role"
                        value="instructor"
                        checked={formData.role === 'instructor'}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      <div className="role-content">
                        <span className="role-icon">👨‍🏫</span>
                        <span className="role-title">Instructor</span>
                        <span className="role-desc">Create and monitor exams</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`submit-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🚀</span>
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="card-footer">
              <p className="footer-text">
                Don't have an account?{' '}
                <Link to="/register" className="footer-link">
                  Create one here
                </Link>
              </p>
              
              <div className="footer-links">
                <a href="#" className="help-link">
                  <span className="help-icon">❓</span>
                  Need Help?
                </a>
                <a href="#" className="privacy-link">
                  <span className="privacy-icon">🔒</span>
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;