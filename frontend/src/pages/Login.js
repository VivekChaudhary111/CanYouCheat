import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Webcam from "react-webcam";
import "./Auth.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "student",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Webcam state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const webcamRef = useRef(null);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Capture photo
  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // If student role, open camera before login
    if (formData.role === "student" && !capturedImage) {
      setCameraOpen(true);
      return;
    }

    setLoading(true);

    try {
      const result = await login(
        formData.email,
        formData.password,
        formData.role,
        capturedImage // Send captured image to backend
      );

      if (!result.success) {
        setError(result.message || "Login failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
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
                <img
                  src="../android-chrome-512x512.png"
                  alt="CanYouCheat Logo"
                />
              </div>
              <h1 className="brand-title">CanYouCheat</h1>
            </div>
            <h2 className="brand-subtitle">AI-Enhanced Exam Proctoring</h2>
            <p className="brand-description">
              Advanced AI monitoring for secure remote examinations
            </p>
          </div>
        </div>

        <div className="auth-form-container">
          <div className="auth-card">
            <div className="card-header">
              <h2 className="card-title">Welcome Back</h2>
              <p className="card-subtitle">Sign in to access your dashboard</p>
            </div>

            {error && (
              <div className="error-message">
                <span>{error}</span>
              </div>
            )}

            {/* Camera UI */}
            {cameraOpen && formData.role === "student" && (
              <div className="camera-container">
                {!capturedImage ? (
                  <>
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{ facingMode: "user" }}
                      className="webcam-view"
                    />
                    <button
                      type="button"
                      className="capture-btn"
                      onClick={capturePhoto}
                    >
                      Capture Photo
                    </button>
                  </>
                ) : (
                  <div className="preview-section">
                    <img
                      src={capturedImage}
                      alt="Captured face"
                      className="captured-img"
                    />
                    <div className="photo-actions">
                      <button
                        type="button"
                        className="retake-btn"
                        onClick={retakePhoto}
                      >
                        Retake
                      </button>
                      <button
                        type="submit"
                        className="confirm-btn"
                        onClick={handleSubmit}
                      >
                        Continue to Login
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hide login form when camera open */}
            {!cameraOpen && (
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="role" className="form-label">
                    Account Type
                  </label>
                  <div className="role-options">
                    <label
                      className={`role-option ${
                        formData.role === "student" ? "active" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="student"
                        checked={formData.role === "student"}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      <div className="role-content">
                        <span className="role-title">Student</span>
                      </div>
                    </label>

                    <label
                      className={`role-option ${
                        formData.role === "instructor" ? "active" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="instructor"
                        checked={formData.role === "instructor"}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      <div className="role-content">
                        <span className="role-title">Instructor</span>
                      </div>
                    </label>
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
                      type={showPassword ? "text" : "password"}
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
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`submit-btn ${loading ? "loading" : ""}`}
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
            )}

            <div className="card-footer">
              <p className="footer-text">
                Don't have an account?{" "}
                <Link to="/register" className="footer-link">
                  Create one here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
