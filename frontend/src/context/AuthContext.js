import React, { createContext, useContext, useState, useEffect } from 'react';
const AI_SERVICE_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:8000';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser);
          
          // Verify token is still valid by checking with backend
          const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });

          if (response.ok) {
            setToken(storedToken);
            setUser(userData);
            setIsAuthenticated(true);
            console.log('🔄 Session restored for:', userData.name);
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);
  // Register function
  const register = async (name, email, password, role, live_photo_base64) => {
    try {
      // Only require photo for students
      if (role === 'student' && !live_photo_base64) {
        return {
          success: false,
          message: 'Photo verification is required for student registration'
        };
      }

      const systemInfo = {
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          live_photo_base64: role === 'student' ? live_photo_base64 : null, // Only send photo for students
          systemInfo
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Auto-login after successful registration
        if (data.token && data.user) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          setToken(data.token);
          setUser(data.user);
          setIsAuthenticated(true);
        }

        return {
          success: true,
          user: data.user,
          message: 'Registration successful'
        };
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.'
      };
    }
  };
  const login = async (email, password, role) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store in localStorage first
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Then update state - THIS IS THE KEY FIX
        await new Promise(resolve => {
          setToken(data.token);
          setUser(data.user);
          setIsAuthenticated(true);
          resolve();
        });

        console.log('✅ Login successful for:', data.user.name);
        return { success: true, user: data.user };
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    console.log('👋 User logged out');
  };

  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData };
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
    console.log('🔄 User data updated for:', newUserData.name);
  };

  // Add computed role properties
  const isInstructor = user?.role === 'instructor';
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isInstructor,
    isStudent,
    isAdmin,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};