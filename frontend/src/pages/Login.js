import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusModal from '../components/StatusModal';
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
  const [preventAutoRedirect, setPreventAutoRedirect] = useState(false);

  // Modal state
  const [modal, setModal] = useState({
    isOpen: false,
    type: '',
    title: '',
    message: ''
  });

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect when authenticated, but respect preventAutoRedirect flag
  useEffect(() => {
    if (isAuthenticated && user && !preventAutoRedirect) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate, preventAutoRedirect]);

  const showModal = (type, title, message) => {
    setModal({
      isOpen: true,
      type,
      title,
      message
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      type: '',
      title: '',
      message: ''
    });
  };

  // Called when the StatusModal requests close (X, backdrop, or auto-close)
  const handleModalClose = () => {
    closeModal();

    // If it was a successful login, go to dashboard
    if (modal.type === 'success') {
      setPreventAutoRedirect(false);
      navigate('/dashboard');
    }
  };

  // Used by the action button inside the modal to explicitly go to dashboard
  const goToDashboard = () => {
    closeModal();
    setPreventAutoRedirect(false);
    navigate('/dashboard');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      return 'Email is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address';
    }

    if (!formData.password) {
      return 'Password is required';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      showModal('error', 'Login Failed', validationError);
      setLoading(false);
      return;
    }

    try {
      // Prevent automatic redirect until user closes modal or presses action
      setPreventAutoRedirect(true);

      const result = await login(formData.email, formData.password, formData.role);

      if (result && result.success) {
        showModal(
          'success',
          'Login Successful',
          `Welcome back! You are now signed in to your ${formData.role} dashboard.`
        );
      } else {
        // On login failure, allow auto-redirect in future attempts (not necessary, but safe)
        setPreventAutoRedirect(false);
        showModal(
          'error',
          'Login Failed',
          (result && result.message) || 'Invalid credentials. Please check your email and password and try again.'
        );
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      setPreventAutoRedirect(false);
      showModal(
        'error',
        'Network Error',
        'Unable to connect to the server. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));

    // Clear inline error when user types
    if (error) setError('');
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="gradient-overlay"></div>
      </div>

      <div className="auth-container">
        <div className="auth-branding">
          <div className="brand-content">
            <div className="brand-logo">
              <div className="logo-icon">
                <img src="../android-chrome-512x512.png" alt="CanYouCheat Logo" />
              </div>
              <h1 className="brand-title">CanYouCheat</h1>
            </div>
            <h2 className="brand-subtitle">AI-Enhanced Exam Proctoring</h2>
            <p className="brand-description">
              Advanced AI monitoring for secure remote examinations
            </p>

            <div className="features-list">
              <div className="feature-item">
                <span>Real-time behavior analysis</span>
              </div>
              <div className="feature-item">
                <span>Eye tracking technology</span>
              </div>
              <div className="feature-item">
                <span>AI-powered risk assessment</span>
              </div>
              <div className="feature-item">
                <span>Audio anomaly detection</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-container">
          <div className="auth-card">
            <div className="card-header">
              <h2 className="card-title">Welcome Back</h2>
              <p className="card-subtitle">Sign in to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="role" className="form-label">
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
                        <span className="role-title">Student</span>
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
                        <span className="role-title">Instructor</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
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
                    placeholder="Enter your email"
                    className="form-input"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
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
                    disabled={loading}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && <p className="form-error">{error}</p>}

              <button
                type="submit"
                className={`submit-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            <div className="card-footer">
              <p className="footer-text">
                Don't have an account?{' '}
                <Link to="/register" className="footer-link">
                  Create one here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      <StatusModal
        isOpen={modal.isOpen}
        onClose={handleModalClose}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        autoClose={modal.type === 'success'}
        autoCloseDelay={4000}
        actionButton={
          modal.type === 'success' ? (
            <button
              onClick={goToDashboard}
              className="submit-btn"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              Go to Dashboard
            </button>
          ) : null
        }
      />
    </div>
  );
};

export default Login;
