import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import StatusModal from '../components/StatusModal';
import './Auth.css';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  
  // Modal state
  const [modal, setModal] = useState({
    isOpen: false,
    type: '',
    title: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when user types
    if (error) setError('');

    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    if (password.length === 0) {
      setPasswordStrength('');
      return;
    }
    
    if (password.length < 6) {
      setPasswordStrength('weak');
    } else if (password.length < 10) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return 'Full name is required';
    }

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

    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }

    return null;
  };

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

  const handleModalClose = () => {
    closeModal();
    if (modal.type === 'success') {
      navigate('/login');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      showModal(
        'error',
        'Registration Failed',
        validationError
      );
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting registration form...');
      
      const result = await register(
        formData.name,
        formData.email,
        formData.password,
        formData.role
      );
      
      console.log('Registration result:', result);

      if (result.success) {
        // Clear form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'student'
        });
        setPasswordStrength('');

        // Show success modal
        showModal(
          'success',
          'Account Created Successfully',
          'Your account has been created. You will be redirected to the login page to sign in.'
        );
      } else {
        // Show error modal
        showModal(
          'error',
          'Registration Failed',
          result.message || 'Unable to create account. Please check your information and try again.'
        );
      }
    } catch (error) {
      console.error('Unexpected registration error:', error);
      showModal(
        'error',
        'Network Error',
        'Unable to connect to the server. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    closeModal();
    navigate('/login');
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
              Join the next generation of secure online examination
            </p>
            
            <div className="features-list">
              <div className="feature-item">
                <span>Secure exam environment</span>
              </div>
              <div className="feature-item">
                <span>Real-time monitoring</span>
              </div>
              <div className="feature-item">
                <span>Comprehensive reporting</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-container">
          <div className="auth-card">
            <div className="card-header">
              <h2 className="card-title">Create Account</h2>
              <p className="card-subtitle">Join our AI proctoring platform</p>
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
                <label htmlFor="name" className="form-label">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Create a password"
                  required
                  disabled={loading}
                />
                {passwordStrength && (
                  <div className={`password-strength ${passwordStrength}`}>
                    Password strength: {passwordStrength}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`submit-btn ${loading ? 'loading' : ''}`}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="card-footer">
              <p className="footer-text">
                Already have an account?{' '}
                <Link to="/login" className="footer-link">
                  Sign in
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
              onClick={goToLogin}
              className="submit-btn"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              Go to Login
            </button>
          ) : null
        }
      />
    </div>
  );
};

export default Register;