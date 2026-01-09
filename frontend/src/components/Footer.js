import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__content">
        {/* Brand/About */}
        <div className="footer__brand">
          <h2>AI Education Platform</h2>
          <p>Empowering learning with AI-driven insights.</p>
        </div>

        {/* Quick Links */}
        <div className="footer__section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>

        {/* Resources */}
        <div className="footer__section">
          <h4>Resources</h4>
          <ul>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#faq">FAQs</a></li>
            <li><a href="#docs">Documentation</a></li>
            <li><a href="#careers">Careers</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer__section">
          <h4>Contact</h4>
          <p>Email: info@aiedu.com</p>
          <p>Phone: +91 98765 XXXXX</p>
          <p>Address: Mathura, UP, India</p>
        </div>

        {/* Socials */}
        <div className="footer__section">
          <h4>Follow Us</h4>
          <div className="footer__socials">
            <a href="https://twitter.com" aria-label="Twitter">🐦</a>
            <a href="https://linkedin.com" aria-label="LinkedIn">💼</a>
            <a href="https://github.com" aria-label="GitHub">🐙</a>
          </div>
        </div>
      </div>

      {/* Legal */}
      <div className="footer__bottom">
        <small>
          © {new Date().getFullYear()} AI Education Platform · 
          <a href="#privacy"> Privacy Policy</a> · 
          <a href="#terms"> Terms of Service</a>
        </small>
      </div>
    </footer>
  );
};

export default Footer;