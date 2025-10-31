import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import StatusModal from '../components/StatusModal';
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

  const [modal, setModal] = useState({
    isOpen: false,
    type: '',
    title: '',
    message: ''
  });

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');

    if (name === 'password') checkPasswordStrength(value);
  };

  // ✅ Password strength checker
  const checkPasswordStrength = (password) => {
    if (!password) return setPasswordStrength('');
    if (password.length < 6) setPasswordStrength('weak');
    else if (password.length < 10) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  };

  // ✅ Validate form
  const validateForm = () => {
    if (!formData.name.trim()) return 'Full name is required';
    if (!formData.email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return 'Enter a valid email';
    if (!formData.password) return 'Password is required';
    if (formData.password.length < 6)
      return 'Password must be at least 6 characters long';
    if (formData.password !== formData.confirmPassword)
      return 'Passwords do not match';
    return null;
  };

  // ✅ Capture image (safe with fallback)
  const captureImage = useCallback(() => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError('Unable to capture image. Please allow camera access and try again.');
      return;
    }
    console.log('📸 Captured Base64 Image:', imageSrc);
    setCapturedImage(imageSrc);
    setCameraOpen(false);
  }, []);

  const retakeImage = () => {
    setCapturedImage(null);
    setCameraOpen(true);
  };

  // ✅ Modal helpers
  const showModal = (type, title, message) =>
    setModal({ isOpen: true, type, title, message });

  const closeModal = () =>
    setModal({ isOpen: false, type: '', title: '', message: '' });

  const handleModalClose = () => {
    closeModal();
    if (modal.type === 'success') navigate('/login');
  };

  // ✅ Handle registration submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError)
      return showModal('error', 'Registration Failed', validationError);

    if (formData.role === 'student' && !capturedImage) {
      if (!cameraOpen) setCameraOpen(true);
      else setError('Please capture your face before registration.');
      return;
    }

    setLoading(true);
    try {
      console.log('📸 Captured Image Type:', typeof capturedImage);
      console.log('🟢 Sending registration request...');

      const result = await register(
        formData.name,
        formData.email,
        formData.password,
        formData.role,
        formData.role === 'student' ? capturedImage : null
      );

      if (result?.success) {
        showModal('success', 'Registration Successful', 'Welcome aboard!');
      } else {
        showModal('error', 'Registration Failed', result?.message || 'Try again later.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      showModal('error', 'Server Error', err.message || 'Please try again.');
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
          </div>
        </div>

        <div className="auth-form-container">
          <div className="auth-card">
            <div className="card-header">
              <h2 className="card-title">Create Account</h2>
              <p className="card-subtitle">Join our AI proctoring platform</p>
            </div>

            {error && <div className="error-message">{error}</div>}

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
                        <span>{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Inputs */}
                <input
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  required
                />

                {/* Captured face preview */}
                {formData.role === 'student' && capturedImage && (
                  <div className="form-group">
                    <label>Captured Face</label>
                    <img src={capturedImage} alt="Captured" className="captured-preview" />
                    <button type="button" onClick={retakeImage} className="retake-btn">
                      Retake Photo
                    </button>
                  </div>
                )}

                <button type="submit" disabled={loading} className="submit-btn">
                  {loading
                    ? 'Creating Account...'
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
                  width={350}
                  height={250}
                  audio={false}
                  videoConstraints={{ facingMode: 'user' }}
                  className="webcam-view"
                />
                <button onClick={captureImage} className="capture-btn">Capture Image</button>
                <button onClick={() => setCameraOpen(false)} className="cancel-btn">Cancel</button>
              </div>
            )}

            <div className="card-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="footer-link">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

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
            <button onClick={goToLogin} className="submit-btn">Go to Login</button>
          ) : null
        }
      />
    </div>
  );
};

export default Register;
