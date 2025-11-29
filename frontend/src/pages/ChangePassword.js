import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './ChangePassword.css';

const ChangePassword = () => {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('New passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setMessage('New password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://canyoucheat.onrender.com/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password changed successfully!');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('❌ Error changing password:', error);
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
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

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div className="change-password-page">
      <div className="change-password-container">
        <div className="change-password-header">
          <h1>🔑 Change Password</h1>
          <p>Update your password to keep your AI proctoring account secure</p>
        </div>

        <form onSubmit={handleSubmit} className="change-password-form">
          {/* Current Password */}
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <div className="password-input-group">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                id="currentPassword"
                value={formData.currentPassword}
                onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                required
                placeholder="Enter your current password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="password-input-group">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                id="newPassword"
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                required
                placeholder="Enter your new password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="password-strength">
                <div className="strength-bar">
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
                >
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="password-input-group">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            {/* Password Match Indicator */}
            {formData.confirmPassword && (
              <div className="password-match">
                {formData.newPassword === formData.confirmPassword ? (
                  <span className="match-success">✅ Passwords match</span>
                ) : (
                  <span className="match-error">❌ Passwords do not match</span>
                )}
              </div>
            )}
          </div>

          {/* Password Requirements */}
          <div className="password-requirements">
            <h3>Password Requirements:</h3>
            <ul>
              <li className={formData.newPassword.length >= 8 ? 'met' : ''}>
                At least 8 characters long
              </li>
              <li className={/[A-Z]/.test(formData.newPassword) ? 'met' : ''}>
                Contains uppercase letter
              </li>
              <li className={/[a-z]/.test(formData.newPassword) ? 'met' : ''}>
                Contains lowercase letter
              </li>
              <li className={/\d/.test(formData.newPassword) ? 'met' : ''}>
                Contains a number
              </li>
              <li className={/[^A-Za-z0-9]/.test(formData.newPassword) ? 'met' : ''}>
                Contains special character
              </li>
            </ul>
          </div>

          {/* Message */}
          {message && (
            <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="change-password-btn"
              disabled={loading || formData.newPassword !== formData.confirmPassword}
            >
              {loading ? '🔄 Changing Password...' : '🔑 Change Password'}
            </button>
          </div>
        </form>

        {/* Security Tips */}
        <div className="security-tips">
          <h3>🛡️ Security Tips</h3>
          <ul>
            <li>Use a unique password that you don't use elsewhere</li>
            <li>Consider using a password manager</li>
            <li>Enable two-factor authentication for extra security</li>
            <li>Never share your password with anyone</li>
            <li>Change your password regularly</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;