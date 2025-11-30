import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const getImageUrl = (filename) => {
  return `/${filename}`;
};

const Navbar = () => {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsProfileOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get role-specific badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'instructor': return '#10b981';
      case 'student': return '#3b82f6';
      case 'admin': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  if (!isAuthenticated) {
    return (
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <div className="logo-icon">
                <img src={getImageUrl("android-chrome-512x512.png")} alt="CanYouCheat Logo" />
              </div>
            <div className="logo-text">
              <span className="logo-title">CanYouCheat</span>
              <span className="logo-subtitle">AI Proctoring</span>
            </div>
          </Link>
          <div className="navbar-menu">
            <Link to="/login" className="navbar-link">Login</Link>
            <Link to="/register" className="navbar-link register-btn">Register</Link>
          </div>
        </div>
      </nav>
    );
  }

  // Show loading state while user data is being fetched
  if (loading || !user) {
    return (
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/dashboard" className="navbar-logo">
            <div className="logo-icon">
                <img src={getImageUrl("android-chrome-512x512.png")} alt="CanYouCheat Logo" />
            </div>
            <div className="logo-text">
              <span className="logo-title">CanYouCheat</span>
              <span className="logo-subtitle">AI Proctoring System</span>
            </div>
          </Link>

          <div className="navbar-menu">
            <div className="navbar-link loading">Loading...</div>
          </div>
        </div>
      </nav>
    );
  }

  // Profile menu items
  const profileMenuItems = [
    {
      label: 'View Profile',
      action: () => {
        navigate('/profile');
        setIsProfileOpen(false);
      }
    },
    {
      label: 'Account Settings',
      action: () => {
        navigate('/settings');
        setIsProfileOpen(false);
      }
    },
    {
      label: 'Change Password',
      action: () => {
        navigate('/change-password');
        setIsProfileOpen(false);
      }
    },
    ...(user?.role === 'instructor' ? [
      {
        label: 'Analytics Dashboard',
        action: () => {
          navigate('/analytics');
          setIsProfileOpen(false);
        }
      },
      {
        label: 'Proctoring Settings',
        action: () => {
          navigate('/proctoring-settings');
          setIsProfileOpen(false);
        }
      }
    ] : []),
    ...(user?.role === 'student' ? [
      {
        label: 'Performance History',
        action: () => {
          navigate('/performance');
          setIsProfileOpen(false);
        }
      },
      {
        label: 'System Check',
        action: () => {
          navigate('/system-check');
          setIsProfileOpen(false);
        }
      }
    ] : []),
    {
      label: 'Help & Support',
      action: () => {
        navigate('/help');
        setIsProfileOpen(false);
      }
    }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo - Left Side */}
        <Link to="/dashboard" className="navbar-logo">
          <div className="logo-icon">
            <img src={getImageUrl("android-chrome-512x512.png")} alt="CanYouCheat Logo" />
          </div>
          <div className="logo-text">
            <span className="logo-title">CanYouCheat</span>
            <span className="logo-subtitle">AI Proctoring System</span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-link">
            Dashboard
          </Link>
          <Link to="/exams" className="navbar-link">
            Exams
          </Link>
          {user?.role === 'instructor' && (
            <>
              <Link to="/create-exam" className="navbar-link">
                Create Exam
              </Link>
              <Link to="/proctoring" className="navbar-link">
                Proctoring
              </Link>
            </>
          )}
        </div>

        {/* Right Side - AI Status & Profile */}
        <div className="navbar-right">
          {/* AI Proctoring Status Indicator */}
          <div className="ai-status-indicator">
            <div className="status-dot active"></div>
            <span className="status-text">AI Active</span>
          </div>

          {/* Profile Dropdown */}
          <div className="profile-dropdown" ref={profileRef}>
            <button 
              className="profile-button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-label="Profile menu"
            >
              <div className="profile-avatar">
                {getUserInitials(user?.name)}
              </div>
              <div className="profile-info">
                <span className="profile-name">{user?.name}</span>
                <span 
                  className="profile-role"
                  style={{ color: getRoleBadgeColor(user?.role) }}
                >
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </span>
              </div>
              <div className={`profile-arrow ${isProfileOpen ? 'open' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
            
            {isProfileOpen && (
              <div className="profile-menu">
                <div className="profile-menu-header">
                  <div className="profile-menu-avatar">
                    {getUserInitials(user?.name)}
                  </div>
                  <div className="profile-menu-info">
                    <div className="profile-menu-name">{user?.name}</div>
                    <div className="profile-menu-email">{user?.email}</div>
                    <div 
                      className="profile-menu-role"
                      style={{ backgroundColor: getRoleBadgeColor(user?.role) }}
                    >
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    </div>
                  </div>
                </div>
                
                <div className="profile-menu-divider"></div>
                
                <div className="profile-menu-items">
                  {profileMenuItems.map((item, index) => (
                    <button
                      key={index}
                      className="profile-menu-item"
                      onClick={item.action}
                    >
                      <span className="menu-item-label">{item.label}</span>
                    </button>
                  ))}
                  
                  <div className="profile-menu-divider"></div>
                  
                  <button
                    className="profile-menu-item logout-item"
                    onClick={handleLogout}
                  >
                    <span className="menu-item-label">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;