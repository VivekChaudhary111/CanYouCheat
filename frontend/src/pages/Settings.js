import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    notifications: {
      examAlerts: true,
      emailNotifications: true,
      browserNotifications: false,
      proctoringAlerts: true
    },
    privacy: {
      profileVisibility: 'private',
      shareAnalytics: false,
      allowDataCollection: true
    },
    aiProctoring: {
      sensitivity: 'medium',
      faceDetection: true,
      eyeTracking: true,
      audioMonitoring: true,
      screenRecording: true
    }
  });

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const saveSettings = async () => {
    try {
      console.log('💾 Saving settings:', settings);
      // API call would go here
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('❌ Error saving settings:', error);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>⚙️ Account Settings</h1>
        <p>Customize your AI proctoring experience</p>
      </div>

      <div className="settings-content">
        <div className="settings-grid">
          {/* Notification Settings */}
          <div className="settings-section">
            <div className="section-header">
              <h2>🔔 Notifications</h2>
              <p>Manage how you receive alerts and updates</p>
            </div>
            <div className="section-content">
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Exam Alerts</h3>
                  <p>Get notified about upcoming exams and deadlines</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.notifications.examAlerts}
                    onChange={(e) => handleSettingChange('notifications', 'examAlerts', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Email Notifications</h3>
                  <p>Receive updates via email</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Browser Notifications</h3>
                  <p>Show desktop notifications in your browser</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.notifications.browserNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'browserNotifications', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Proctoring Alerts</h3>
                  <p>Real-time alerts during AI proctoring sessions</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.notifications.proctoringAlerts}
                    onChange={(e) => handleSettingChange('notifications', 'proctoringAlerts', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* AI Proctoring Settings */}
          <div className="settings-section">
            <div className="section-header">
              <h2>🤖 AI Proctoring</h2>
              <p>Configure AI monitoring preferences</p>
            </div>
            <div className="section-content">
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Detection Sensitivity</h3>
                  <p>How sensitive should the AI be to potential violations</p>
                </div>
                <select
                  value={settings.aiProctoring.sensitivity}
                  onChange={(e) => handleSettingChange('aiProctoring', 'sensitivity', e.target.value)}
                  className="setting-select"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Face Detection</h3>
                  <p>Monitor facial recognition and presence</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.aiProctoring.faceDetection}
                    onChange={(e) => handleSettingChange('aiProctoring', 'faceDetection', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Eye Tracking</h3>
                  <p>Analyze eye movement patterns</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.aiProctoring.eyeTracking}
                    onChange={(e) => handleSettingChange('aiProctoring', 'eyeTracking', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Audio Monitoring</h3>
                  <p>Listen for suspicious sounds or voices</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.aiProctoring.audioMonitoring}
                    onChange={(e) => handleSettingChange('aiProctoring', 'audioMonitoring', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Screen Recording</h3>
                  <p>Record screen activity during exams</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.aiProctoring.screenRecording}
                    onChange={(e) => handleSettingChange('aiProctoring', 'screenRecording', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="settings-section">
            <div className="section-header">
              <h2>🔒 Privacy</h2>
              <p>Control your data and privacy preferences</p>
            </div>
            <div className="section-content">
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Profile Visibility</h3>
                  <p>Who can view your profile information</p>
                </div>
                <select
                  value={settings.privacy.profileVisibility}
                  onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                  className="setting-select"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="instructors">Instructors Only</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Share Analytics</h3>
                  <p>Allow anonymous analytics sharing for improvement</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.privacy.shareAnalytics}
                    onChange={(e) => handleSettingChange('privacy', 'shareAnalytics', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Data Collection</h3>
                  <p>Allow collection of behavioral data for AI training</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.privacy.allowDataCollection}
                    onChange={(e) => handleSettingChange('privacy', 'allowDataCollection', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button className="save-settings-btn" onClick={saveSettings}>
            💾 Save All Settings
          </button>
          <button className="reset-settings-btn">
            🔄 Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;