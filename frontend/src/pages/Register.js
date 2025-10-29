import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Webcam from 'react-webcam';
import './Auth.css';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const webcamRef = useRef(null);

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
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  // Password strength checker
  const checkPasswordStrength = (password) => {
    if (!password) return setPasswordStrength('');
    if (password.length < 6) return setPasswordStrength('weak');
    if (password.length < 10) return setPasswordStrength('medium');
    setPasswordStrength('strong');
  };

  // Capture image from webcam
  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setCameraOpen(false);
  };

  const retakeImage = () => {
    setCapturedImage(null);
    setCameraOpen(true);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    // If student — open camera first if not yet captured
    if (formData.role === 'student' && !capturedImage && !cameraOpen) {
      setCameraOpen(true);
      return;
    }

    if (formData.role === 'student' && !capturedImage) {
      setError('Please capture your face image before registration.');
      return;
    }

    setLoading(true);
    try {
      const result = await register(
        formData.name,
        formData.email,
        formData.password,
        formData.role,
        formData.role === 'student' ? capturedImage : null
      );

      if (result?.success) {
        navigate('/login');
      } else {
        setError(result?.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err.message?.includes('Failed to fetch')) {
        setError('Cannot connect to server. Please check if backend is running.');
      } else if (err.message?.includes('CORS')) {
        setError('CORS error: please enable CORS on the backend.');
      } else {
        setError('Unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
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
              <div className="feature-item"><span>Secure exam environment</span></div>
              <div className="feature-item"><span>Real-time monitoring</span></div>
              <div className="feature-item"><span>Comprehensive reporting</span></div>
            </div>
          </div>
        </div>

        <div className="auth-form-container">
          <div className="auth-card">
            <div className="card-header">
              <h2 className="card-title">Create Account</h2>
              <p className="card-subtitle">Join our AI proctoring platform</p>
            </div>

            {error && (
              <div className="error-message" role="alert">
                <span>{error}</span>
              </div>
            )}

            {!cameraOpen ? (
              <form onSubmit={handleSubmit} className="auth-form">
                {/* Role selection */}
                <div className="form-group">
                  <label className="form-label">Account Type</label>
                  <div className="role-options">
                    {['student', 'instructor'].map((role) => (
                      <label
                        key={role}
                        className={`role-option ${formData.role === role ? 'active' : ''}`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role}
                          checked={formData.role === role}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        <div className="role-content">
                          <span className="role-title">
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                {/* Password */}
                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Create a password"
                    required
                  />
                  {passwordStrength && (
                    <div className={`password-strength ${passwordStrength}`}>
                      Password strength: {passwordStrength}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                {/* Face Capture Preview */}
                {formData.role === 'student' && capturedImage && (
                  <div className="form-group">
                    <label className="form-label">Captured Face Image</label>
                    <img src={capturedImage} alt="Captured" className="captured-preview" />
                    <button type="button" className="retake-btn" onClick={retakeImage}>
                      Retake Photo
                    </button>
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={loading} className={`submit-btn ${loading ? 'loading' : ''}`}>
                  {loading
                    ? (
                      <>
                        <span className="loading-spinner"></span>
                        Creating Account...
                      </>
                    )
                    : formData.role === 'student' && !capturedImage
                      ? 'Capture Face'
                      : 'Create Account'}
                </button>
              </form>
            ) : (
              <div className="camera-section">
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="webcam-view"
                />
                <button onClick={captureImage} className="capture-btn">Capture Image</button>
                <button onClick={() => setCameraOpen(false)} className="cancel-btn">Cancel</button>
              </div>
            )}

            <div className="card-footer">
              <p className="footer-text">
                Already have an account?{' '}
                <Link to="/login" className="footer-link">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
