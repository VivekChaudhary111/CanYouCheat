import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

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
            🔒 CanYouCheat
            <span className="logo-subtitle">AI Proctoring</span>
          </Link>
          <div className="navbar-menu">
            <Link to="/login" className="navbar-link">Login</Link>
            <Link to="/register" className="navbar-link">Register</Link>
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
          <div className="navbar-left">
            <div className="profile-dropdown">
              <div className="profile-button loading">
                <div className="profile-avatar loading"></div>
                <div className="profile-info">
                  <span className="profile-name">Loading...</span>
                  <span className="profile-role">---</span>
                </div>
              </div>
            </div>
          </div>

          <Link to="/dashboard" className="navbar-logo">
            🔒 CanYouCheat
            <span className="logo-subtitle">AI Proctoring System</span>
          </Link>

          <div className="navbar-menu">
            <div className="navbar-link loading">Loading...</div>
          </div>
        </div>
      </nav>
    );
  }

  // Profile menu items (only show when user data is loaded)
  const profileMenuItems = [
    {
      icon: '👤',
      label: 'View Profile',
      action: () => {
        navigate('/profile');
        setIsProfileOpen(false);
      }
    },
    {
      icon: '🔧',
      label: 'Account Settings',
      action: () => {
        navigate('/settings');
        setIsProfileOpen(false);
      }
    },
    {
      icon: '🔑',
      label: 'Change Password',
      action: () => {
        navigate('/change-password');
        setIsProfileOpen(false);
      }
    },
    ...(user?.role === 'instructor' ? [
      {
        icon: '📊',
        label: 'Analytics Dashboard',
        action: () => {
          navigate('/analytics');
          setIsProfileOpen(false);
        }
      },
      {
        icon: '⚙️',
        label: 'Proctoring Settings',
        action: () => {
          navigate('/proctoring-settings');
          setIsProfileOpen(false);
        }
      }
    ] : []),
    ...(user?.role === 'student' ? [
      {
        icon: '📈',
        label: 'Performance History',
        action: () => {
          navigate('/performance');
          setIsProfileOpen(false);
        }
      },
      {
        icon: '🔍',
        label: 'System Check',
        action: () => {
          navigate('/system-check');
          setIsProfileOpen(false);
        }
      }
    ] : []),
    {
      icon: '❓',
      label: 'Help & Support',
      action: () => {
        navigate('/help');
        setIsProfileOpen(false);
      }
    },
    {
      icon: '🚪',
      label: 'Logout',
      action: handleLogout,
      className: 'logout-item'
    }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Profile Dropdown - Left Side */}
        <div className="navbar-left">
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
                ▼
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
                      className={`profile-menu-item ${item.className || ''}`}
                      onClick={item.action}
                    >
                      <span className="menu-item-icon">{item.icon}</span>
                      <span className="menu-item-label">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Logo */}
        <Link to="/dashboard" className="navbar-logo">
          🔒 CanYouCheat
          <span className="logo-subtitle">AI Proctoring System</span>
        </Link>

        {/* Navigation Links - Right Side */}
        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-link">
            <span className="link-icon">🏠</span>
            Dashboard
          </Link>
          <Link to="/exams" className="navbar-link">
            <span className="link-icon">📋</span>
            Exams
          </Link>
          {user?.role === 'instructor' && (
            <>
              <Link to="/create-exam" className="navbar-link">
                <span className="link-icon">➕</span>
                Create Exam
              </Link>
              <Link to="/proctoring" className="navbar-link">
                <span className="link-icon">👁️</span>
                Proctoring
              </Link>
            </>
          )}
          
          {/* AI Proctoring Status Indicator */}
          <div className="ai-status-indicator">
            <div className="status-dot active"></div>
            <span className="status-text">AI Active</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;