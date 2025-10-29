import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Keep Link
import Webcam from 'react-webcam'; // Import Webcam
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    agreeToTerms: false,
    live_photo_base64: '' // For the captured image
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Keep
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Keep

  const { register } = useAuth();
  const navigate = useNavigate();
  const webcamRef = useRef(null); // Create a ref for the webcam

  // Function to capture photo
  const capturePhoto = () => {
    // Get the base64 image string from the webcam
    const imageSrc = webcamRef.current.getScreenshot();
    setFormData({
      ...formData,
      live_photo_base64: imageSrc
    });
  };

  // Function to retake photo
  const retakePhoto = () => {
    setFormData({
      ...formData,
      live_photo_base64: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // --- Validation ---
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      setLoading(false);
      return;
    }

    // Validation for photo
    if (!formData.live_photo_base64) {
      setError('Please capture a verification photo');
      setLoading(false);
      return;
    }

    try {
      // Send all form data, including the photo
      const result = await register(
        formData.name,
        formData.email,
        formData.password,
        formData.role,
        formData.live_photo_base64 // Send photo
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Keep handleChange - Make sure it's used by all inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '#e2e8f0' };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
      { score: 0, label: 'Very Weak', color: '#dc2626' },
      { score: 1, label: 'Weak', color: '#ea580c' },
      { score: 2, label: 'Fair', color: '#d97706' },
      { score: 3, label: 'Good', color: '#ca8a04' },
      { score: 4, label: 'Strong', color: '#65a30d' },
      { score: 5, label: 'Very Strong', color: '#16a34a' }
    ];
    return levels[score];
  };

  // Keep passwordStrength calculation - Make sure it's used in JSX
  const passwordStrength = getPasswordStrength(formData.password);

  if (success) {
    // --- Success Screen ---
    return (
      <div className="auth-page">
        <div className="auth-background">
          <div className="gradient-overlay"></div>
        </div>
        <div className="success-container">
          <div className="success-card">
            <div className="success-icon">✅</div>
            <h1 className="success-title">Account Created Successfully!</h1>
            <p className="success-message">
              Welcome to the AI-Enhanced Exam Proctoring System.
              You will be redirected to the login page shortly.
            </p>
            <div className="success-loader">
              <div className="loader-bar"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Registration Form ---
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
      <div className="auth-container register-container">
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <div className="brand-content">
            <div className="brand-logo">
              <div className="logo-icon">🔒</div>
              <h1 className="brand-title">CanYouCheat</h1>
            </div>
            <h2 className="brand-subtitle">Join the Future of Academic Integrity</h2>
            <p className="brand-description">
              Create your account to access cutting-edge AI proctoring technology
              that ensures fair and secure remote examinations.
            </p>

            <div className="registration-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">🎓</span>
                <div className="benefit-content">
                  <h4>For Students</h4>
                  <p>Take exams with confidence in a secure environment</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">👨‍🏫</span>
                <div className="benefit-content">
                  <h4>For Instructors</h4>
                  <p>Monitor and analyze student behavior with AI insights</p>
                </div>
              </div>
            </div>

            <div className="trust-indicators">
              <div className="trust-item">
                <span className="trust-icon">🔐</span>
                <span>256-bit Encryption</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🛡️</span>
                <span>GDPR Compliant</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">✅</span>
                <span>ISO Certified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="auth-form-container">
          <div className="auth-card register-card">
            <div className="card-header">
              <h2 className="card-title">Create Your Account</h2>
              <p className="card-subtitle">Join thousands of users worldwide</p>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form register-form">
              {/* Name Field */}
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  <span className="label-icon">👤</span> Full Name
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange} // <-- USE handleChange
                    required
                    placeholder="Enter your full name"
                    className="form-input"
                    disabled={loading}
                  />
                  <div className="input-border"></div>
                </div>
              </div>

              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <span className="label-icon">📧</span> Email Address
                </label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange} // <-- USE handleChange
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
                  <span className="label-icon">🔐</span> Password
                </label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'} // <-- USE showPassword
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange} // <-- USE handleChange
                    required
                    placeholder="Create a strong password"
                    className="form-input"
                    disabled={loading}
                  />
                  {/* --- USE setShowPassword --- */}
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                  {/* --- END USE setShowPassword --- */}
                  <div className="input-border"></div>
                </div>
                {/* --- USE passwordStrength --- */}
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar" aria-hidden="true">
                      <div
                        className="strength-fill"
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                          backgroundColor: passwordStrength.color
                        }}
                      ></div>
                    </div>
                    <span
                      className="strength-label"
                      style={{ color: passwordStrength.color }}
                      aria-live="polite"
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
                {/* --- END USE passwordStrength --- */}
              </div>

              {/* Confirm Password Field */}
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  <span className="label-icon">🔒</span> Confirm Password
                </label>
                <div className="input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'} // <-- USE showConfirmPassword
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange} // <-- USE handleChange
                    required
                    placeholder="Confirm your password"
                    className="form-input"
                    disabled={loading}
                  />
                  {/* --- USE setShowConfirmPassword --- */}
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                  {/* --- END USE setShowConfirmPassword --- */}
                  <div className="input-border"></div>
                </div>
                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <div className="password-match" aria-live="polite">
                    {formData.password === formData.confirmPassword ? (
                      <span className="match-success">✅ Passwords match</span>
                    ) : (
                      <span className="match-error">❌ Passwords do not match</span>
                    )}
                  </div>
                )}
              </div>

              {/* --- Live Photo Capture Section --- */}
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📸</span>
                  Identity Verification Photo
                </label>
                <div className="webcam-container">
                  {formData.live_photo_base64 ? (
                    // Show the captured image preview
                    <div className="webcam-preview">
                      <img src={formData.live_photo_base64} alt="Live Capture Preview" />
                      <button
                        type="button"
                        className="webcam-btn retake-btn"
                        onClick={retakePhoto}
                        disabled={loading}
                      >
                        Retake Photo
                      </button>
                    </div>
                  ) : (
                    // Show the live webcam feed
                    <div className="webcam-live">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="webcam-element"
                        videoConstraints={{ width: 480, height: 360, facingMode: "user" }}
                      />
                      <button
                        type="button"
                        className="webcam-btn capture-btn"
                        onClick={capturePhoto}
                        disabled={loading}
                      >
                        Capture Photo
                      </button>
                    </div>
                  )}
                  <p className="webcam-instructions" id="webcam-instructions">
                    Provide a clear, forward-facing photo for identity verification. Ensure good lighting.
                  </p>
                </div>
              </div>
              {/* --- End of Live Photo Capture Section --- */}

              {/* Role Selection */}
              <div className="form-group">
                <fieldset> {/* Use fieldset for radio group accessibility */}
                  <legend className="form-label">
                    <span className="label-icon">🎯</span> Account Type
                  </legend>
                  <div className="role-selection">
                    <div className="role-options">
                      <label className={`role-option ${formData.role === 'student' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="role"
                          value="student"
                          checked={formData.role === 'student'}
                          onChange={handleChange} // <-- USE handleChange
                          disabled={loading}
                          className="sr-only" // Hide visually, keep accessible
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
                          onChange={handleChange} // <-- USE handleChange
                          disabled={loading}
                          className="sr-only" // Hide visually, keep accessible
                        />
                        <div className="role-content">
                          <span className="role-icon">👨‍🏫</span>
                          <span className="role-title">Instructor</span>
                          <span className="role-desc">Create and monitor exams</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </fieldset>
              </div>

              {/* Terms Agreement */}
              <div className="form-group">
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange} // <-- USE handleChange
                    required
                    disabled={loading}
                    className="sr-only" // Hide visually, keep accessible
                  />
                  <span className="checkbox-custom" aria-hidden="true"></span>
                  <span className="checkbox-label">
                    I agree to the{' '}
                    {/* Add actual links later */}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="terms-link">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="privacy-link">Privacy Policy</a>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`submit-btn ${loading ? 'loading' : ''}`}
                // Disable if photo is missing or other conditions fail
                disabled={loading || formData.password !== formData.confirmPassword || !formData.agreeToTerms || !formData.live_photo_base64}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner" aria-hidden="true"></span>
                    <span aria-live="assertive">Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span className="btn-icon" aria-hidden="true">🚀</span>
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="card-footer">
              <p className="footer-text">
                Already have an account?{' '}
                {/* --- USE Link --- */}
                <Link to="/login" className="footer-link">
                  Sign in here
                </Link>
                {/* --- END USE Link --- */}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add sr-only class for accessibility (hides element visually but keeps for screen readers)
const SrOnlyStyles = () => (
    <style>{`
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }
    `}</style>
  );
export default Register;