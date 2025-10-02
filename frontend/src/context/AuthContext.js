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
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔄 Initializing AI Proctoring Authentication...');
      console.log('🔍 Current token in localStorage:', token ? 'Token exists' : 'No token');
      
      if (token) {
        try {
          // Try to decode token first to check if it's valid JWT
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('📝 Token payload decoded:', payload);
          
          // Check if token is expired
          const currentTime = Date.now() / 1000;
          if (payload.exp && payload.exp < currentTime) {
            console.log('❌ Token expired, clearing authentication');
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            setLoading(false);
            return;
          }

          // For now, use token payload directly (bypass /me endpoint issues)
          console.log('✅ Using token payload for AI Proctoring user data');
          setUser({
            id: payload.id,
            email: payload.email,
            role: payload.role,
            name: payload.name || 'AI Proctoring User'
          });
          
        } catch (tokenError) {
          console.error('💥 Error decoding token:', tokenError);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } else {
        console.log('ℹ️ No token found for AI Proctoring System');
      }
      
      setLoading(false);
      console.log('✅ AI Proctoring authentication initialization complete');
    };

    initializeAuth();
  }, [token]);

  // Login function for AI proctoring system
  const login = async (email, password, role) => {
    console.log('🔐 Starting AI Proctoring login process...');
    console.log('📋 Login credentials:', { email, role, passwordLength: password?.length });
    
    try {
      console.log('📡 Sending login request to AI Proctoring backend...');
      
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, role })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      const data = await response.json();
      console.log('📋 Full response data:', data);
      
      if (response.ok && data.success) {
        console.log('✅ Login successful for AI Proctoring System');
        console.log('🎫 Token received:', data.token ? 'Yes' : 'No');
        console.log('👤 User data received:', data.user);
        
        if (data.token) {
          localStorage.setItem('token', data.token);
          console.log('💾 Token stored in localStorage');
          setToken(data.token);
          setUser(data.user);
          console.log('🔄 State updated with user data');
        } else {
          console.error('❌ No token in response');
          return { success: false, message: 'No authentication token received' };
        }
        
        return { success: true, user: data.user };
      } else {
        console.log('❌ Login failed for AI Proctoring System');
        console.log('📋 Error details:', data);
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('💥 Network error during AI Proctoring login:', error);
      return { 
        success: false, 
        message: 'Network error - please check your connection and backend server' 
      };
    }
  };

  // Register function for AI proctoring system
  const register = async (name, email, password, role) => {
    console.log('📝 Starting AI Proctoring registration...');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await response.json();
      console.log('📡 Registration response:', { status: response.status, success: data.success });
      
      if (response.ok && data.success) {
        console.log('✅ Registration successful for AI Proctoring System');
        
        // Auto-login after registration
        if (data.token) {
          localStorage.setItem('token', data.token);
          setToken(data.token);
          setUser(data.user);
        }
        
        return { success: true, message: data.message };
      } else {
        console.log('❌ Registration failed:', data.message);
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('💥 Registration network error:', error);
      return { 
        success: false, 
        message: 'Network error - please check your connection' 
      };
    }
  };

  // Logout function for AI proctoring system
  const logout = () => {
    console.log('👋 Logging out from AI Proctoring System');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // AI Proctoring System permission checks
  const canAccessProctoringFeatures = () => {
    const hasAccess = user && user.role && ['student', 'instructor'].includes(user.role);
    console.log('🔐 Proctoring access check:', { user: user?.email, role: user?.role, hasAccess });
    return hasAccess;
  };

  const canTakeExams = () => {
    return user && user.role === 'student';
  };

  const canManageExams = () => {
    return user && user.role === 'instructor';
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user && !!token,
    
    // AI Proctoring System specific methods
    canAccessProctoringFeatures,
    canTakeExams,
    canManageExams,
    
    // User role info for AI proctoring UI
    isStudent: user?.role === 'student',
    isInstructor: user?.role === 'instructor'
  };

  console.log('🔄 AuthContext state:', { 
    hasUser: !!user, 
    hasToken: !!token, 
    isAuthenticated: !!user && !!token,
    loading 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};