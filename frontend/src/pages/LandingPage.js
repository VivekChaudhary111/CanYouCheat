import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <main>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Welcome to <span>CanYouCheat</span>
            </h1>
            <p className="hero-subtitle">
              AI-Enhanced Exam Proctoring for a Smarter, Fairer Future.
            </p>

            <div className="hero-buttons">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="btn primary"
              >
                Get Started
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn secondary"
              >
                Login
              </button>
            </div>
          </div>

          <div className="hero-image">
            <img
              src="/apple-touch-icon.png"
              alt="AI Proctoring Illustration"
            />
          </div>
        </section>

        {/* About Section */}
        <section className="about-section">
          <h2>Why Choose CanYouCheat?</h2>
          <p>
            CanYouCheat ensures secure, fair, and intelligent online examinations
            using advanced AI-driven proctoring technology.
          </p>

          <div className="features">
            <div className="feature-card">
              <img src="/secure_icon_miniproject.png" alt="Secure" />
              <h3>Secure Exam Environment</h3>
              <p>
                Advanced AI algorithms monitor in real-time to prevent cheating
                and unauthorized activities.
              </p>
            </div>

            <div className="feature-card">
              <img src="/live_monitoring_miniproject.png" alt="Monitoring" />
              <h3>Live Monitoring</h3>
              <p>
                Supervisors can view live streams, get alerts, and maintain exam
                integrity effortlessly.
              </p>
            </div>

            <div className="feature-card">
              <img src="/analytics_miniproject.png" alt="Analytics" />
              <h3>Smart Analytics</h3>
              <p>
                Comprehensive post-exam reports with behavioral insights and
                AI-driven detection logs.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <h2>Ready to Experience the Future of Online Exams?</h2>
          <p>Join our platform and make your exams smarter, safer, and simpler.</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn primary">
              Register Now
            </Link>
            <Link to="/login" className="btn secondary">
              Login
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} CanYouCheat. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;