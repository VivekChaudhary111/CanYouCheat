import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, token } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    institution: '',
    department: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData(user);
      setFormData({
        name: user.name || '',           // Real name from database
        email: user.email || '',         // Real email from database
        bio: user.bio || '',
        institution: user.institution || '',
        department: user.department || ''
      });
    }
    setLoading(false);
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('https://can-you-cheat.vercel.app//api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data.user);
        setEditing(false);
        console.log('✅ Profile updated successfully');
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'instructor': return '#10b981';
      case 'student': return '#3b82f6';
      case 'admin': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <h2>Loading Profile...</h2>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-banner">
          <div className="banner-gradient"></div>
          <div className="profile-header-content">
            <div className="profile-avatar-large">
              {getUserInitials(profileData?.name)}
            </div>
            <div className="profile-header-info">
              <h1 className="profile-title">{profileData?.name || 'User Name'}</h1>
              <div 
                className="profile-role-badge"
                style={{ backgroundColor: getRoleBadgeColor(profileData?.role) }}
              >
                {profileData?.role?.charAt(0).toUpperCase() + profileData?.role?.slice(1)}
              </div>
              <p className="profile-email">{profileData?.email || 'user@example.com'}</p>
            </div>
            <div className="profile-actions">
              <button 
                className={`edit-btn ${editing ? 'cancel' : 'primary'}`}
                onClick={() => setEditing(!editing)}
              >
                {editing ? '❌ Cancel' : '✏️ Edit Profile'}
              </button>
              {editing && (
                <button 
                  className="save-btn primary"
                  onClick={handleSaveProfile}
                >
                  💾 Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-grid">
          {/* Personal Information */}
          <div className="profile-section">
            <div className="section-header">
              <h2>👤 Personal Information</h2>
              <p>Your basic profile information for the AI proctoring system</p>
            </div>
            <div className="section-content">
              {editing ? (
                <div className="form-grid">
                  <div className="form-field">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="form-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="form-field full-width">
                    <label>Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>
                  <div className="form-field">
                    <label>Institution</label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => setFormData({...formData, institution: e.target.value})}
                      placeholder="Your school/university"
                    />
                  </div>
                  <div className="form-field">
                    <label>Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      placeholder="Your department"
                    />
                  </div>
                </div>
              ) : (
                <div className="info-grid">
                  <div className="info-item">
                    <label>Full Name</label>
                    <span>{profileData?.name || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <span>{profileData?.email}</span>
                  </div>
                  <div className="info-item full-width">
                    <label>Bio</label>
                    <span>{profileData?.bio || 'No bio provided'}</span>
                  </div>
                  <div className="info-item">
                    <label>Institution</label>
                    <span>{profileData?.institution || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <label>Department</label>
                    <span>{profileData?.department || 'Not provided'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Proctoring Stats */}
          <div className="profile-section">
            <div className="section-header">
              <h2>🤖 AI Proctoring Statistics</h2>
              <p>Your performance in the AI-enhanced exam system</p>
            </div>
            <div className="section-content">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">
                    {user?.role === 'instructor' ? '12' : '8'}
                  </div>
                  <div className="stat-label">
                    {user?.role === 'instructor' ? 'Exams Created' : 'Exams Taken'}
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">
                    {user?.role === 'instructor' ? '156' : '85%'}
                  </div>
                  <div className="stat-label">
                    {user?.role === 'instructor' ? 'Students Monitored' : 'Average Score'}
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">
                    {user?.role === 'instructor' ? '94%' : '92%'}
                  </div>
                  <div className="stat-label">
                    {user?.role === 'instructor' ? 'Detection Accuracy' : 'Integrity Score'}
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">
                    {user?.role === 'instructor' ? '23' : '3'}
                  </div>
                  <div className="stat-label">
                    {user?.role === 'instructor' ? 'Flags Reviewed' : 'Violations'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Security */}
          <div className="profile-section">
            <div className="section-header">
              <h2>🔒 Account Security</h2>
              <p>Manage your account security for the AI proctoring system</p>
            </div>
            <div className="section-content">
              <div className="security-grid">
                <div className="security-item">
                  <div className="security-info">
                    <h3>Password</h3>
                    <p>Last changed: 30 days ago</p>
                  </div>
                  <button className="security-btn">Change Password</button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <h3>Two-Factor Authentication</h3>
                    <p>Additional security for your account</p>
                  </div>
                  <button className="security-btn secondary">Enable 2FA</button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <h3>Login Sessions</h3>
                    <p>Manage active sessions</p>
                  </div>
                  <button className="security-btn secondary">View Sessions</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;