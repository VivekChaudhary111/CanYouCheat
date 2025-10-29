import React, { createContext, useContext, useState, useEffect } from 'react';

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
          const response = await fetch('http://localhost:5000/api/auth/verify', {
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

  const login = async (email, password, role) => {
    // ... (your existing login function - no changes)
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

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

  // --- NEW: Register Function ---
  const register = async (name, email, password, role, live_photo_base64) => {
    try {
      // NOTE: We don't set global loading(true) here, 
      // because the Register.js component handles its own button loading state.

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          live_photo_base64 // <-- Send the photo to the backend
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Registration successful for:', name);
        return { success: true };
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    // ... (your existing logout function - no changes)
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    console.log('👋 User logged out');
  };

  const updateUser = (updatedUserData) => {
    // ... (your existing updateUser function - no changes)
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
    register, // <-- NEW: Export the register function
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};