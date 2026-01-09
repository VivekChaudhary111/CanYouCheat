import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Footer from '../components/Footer.js';
import './LandingPage.css';

import img1 from '.././assets/images/secure_icon_miniproject.png';
import img2 from '.././assets/images/live_monitoring_miniproject.png';
import img3 from '.././assets/images/analytics_miniproject.png';
import img4 from '.././assets/images/android-chrome-512x512.png';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <main>
        {/* Hero */}
        <section id="hero" className="hero">
          <div className="container hero__grid">
            <div className="hero__copy">
              <h1 className="hero__title">
                Fair exams. Connected classes. <span>AI that works for you.</span>
              </h1>
              <p className="hero__subtitle">
                CanYouCheat simplifies teaching and protects integrity—AI‑driven proctoring, group collaboration, and built‑in meetings in one seamless flow.
              </p>
              <div className="hero__actions">
                <button className="btn btn--primary" onClick={() => navigate('/register')}>
                  Get started
                </button>
                <button className="btn btn--ghost" onClick={() => navigate('/login')}>
                  Login
                </button>
              </div>
              <ul className="hero__trust">
                <li>Real‑time AI monitoring</li>
                <li>Behavioral analytics</li>
                <li>Secure, scalable sessions</li>
              </ul>
            </div>
            <div className="hero__visual">
              <img src={img4} alt="Platform overview" className="hero__img" />
            </div>
          </div>
        </section>

        {/* Product pillars */}
        <section id="pillars" className="section">
          <div className="container">
            <h2 className="section__title">Built around what educators need</h2>
            <p className="section__lead">
              Four focused pillars—each designed to reduce friction and raise confidence.
            </p>

            <div className="grid grid--3">
              <article className="card">
                <img src={img1} alt="Proctoring" className="card__icon" />
                <h3 className="card__title">AI‑driven proctoring</h3>
                <p className="card__text">
                  Real‑time detection, instant alerts, and post‑exam behavior logs—fairness without the overhead.
                </p>
              </article>

              <article className="card">
                <img src={img2} alt="Live supervision" className="card__icon" />
                <h3 className="card__title">Live supervision</h3>
                <p className="card__text">
                  Watch streams, act on signals, and keep sessions aligned—clarity for supervisors, calm for students.
                </p>
              </article>

              <article className="card">
                <img src={img3} alt="Analytics" className="card__icon" />
                <h3 className="card__title">Smart analytics</h3>
                <p className="card__text">
                  Evidence‑backed reports with behavioral insights—make decisions with confidence.
                </p>
              </article>
            </div>

            <div className="grid grid--2 mt-32">
              <article className="card">
                <h3 className="card__title">Group collaboration</h3>
                <p className="card__text">
                  Class groups, threads, and shared resources—organized communication that stays on task.
                </p>
              </article>

              <article className="card">
                <h3 className="card__title">Meetings that fit teaching</h3>
                <p className="card__text">
                  Lectures, breakouts, recordings, and attendance—video built for classrooms, not just calls.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="section section--muted">
          <div className="container">
            <h2 className="section__title">A simple flow that respects your time</h2>
            <div className="steps">
              <div className="step">
                <span className="step__num">01</span>
                <h3 className="step__title">Set up</h3>
                <p className="step__text">Create classes, groups, and exam rules. Upload materials once—reuse as needed.</p>
              </div>
              <div className="step">
                <span className="step__num">02</span>
                <h3 className="step__title">Run</h3>
                <p className="step__text">Meet, teach, and supervise with AI signals in real time—no juggling tools.</p>
              </div>
              <div className="step">
                <span className="step__num">03</span>
                <h3 className="step__title">Review</h3>
                <p className="step__text">Get reports, behavior timelines, and attendance—act on clear evidence.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Proof & voice */}
        <section id="proof" className="section">
          <div className="container">
            <div className="grid grid--2">
              <div>
                <h2 className="section__title">What educators say</h2>
                <div className="quotes">
                  <blockquote className="quote">
                    “We ran high‑stakes exams with confidence. Alerts were precise, reports were actionable.”
                    <footer>— Dr. Sharma</footer>
                  </blockquote>
                  <blockquote className="quote">
                    “Groups and meetings feel built for teaching. Less context switching, more focus.”
                    <footer>— Mr. Devendra Rathod</footer>
                  </blockquote>
                </div>
              </div>
              <div className="metrics">
                <div className="metric">
                  <span className="metric__value">98%</span>
                  <span className="metric__label">sessions without incidents</span>
                </div>
                <div className="metric">
                  <span className="metric__value">3×</span>
                  <span className="metric__label">faster post‑exam review</span>
                </div>
                <div className="metric">
                  <span className="metric__value">0</span>
                  <span className="metric__label">extra tools to manage</span>
                </div>
              </div>
            </div>
          </div>
        </section>

       {/* CTA */}
<section id="cta" className="cta">
  <div className="container cta__grid">
    <div className="cta__copy">
      <h2 className="cta__title">
        Ready to simplify teaching and secure exams?
      </h2>
      <p className="cta__text">
        CanYouCheat brings AI‑powered proctoring, collaboration, and meetings together in one seamless flow.
        Start today and experience clarity, fairness, and confidence in every session.
      </p>
    </div>
    <div className="cta__actions">
      <Link to="/register" className="btn btn--primary">Create Account</Link>
      <Link to="/login" className="btn btn--ghost">Sign In</Link>
    </div>
  </div>
</section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;